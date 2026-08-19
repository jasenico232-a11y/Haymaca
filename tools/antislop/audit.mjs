#!/usr/bin/env node
/**
 * NSE Anti-Generic Audit.
 * Scans a codebase for the specific patterns that make a site read as
 * machine-generated. Reports findings with file:line and a fix.
 *
 *   node audit.mjs [srcDir] [--json] [--config path]
 *
 * Exit code 1 if score < failScore. Wire into CI.
 */
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const SRC = args.find(a => !a.startsWith("--")) || "src";
const JSON_OUT = args.includes("--json");
const CFG_PATH = (args.find(a => a.startsWith("--config=")) || "").split("=")[1]
  || path.join(path.dirname(new URL(import.meta.url).pathname), "antislop.config.json");
const C = JSON.parse(fs.readFileSync(CFG_PATH, "utf8"));

const EXT = new Set([".tsx",".jsx",".ts",".js",".mdx",".md",".html",".astro",".vue",".svelte"]);
const SKIP = new Set(["node_modules",".next","dist","build",".git","coverage",".vercel","out"]);
const F = [];
const add = (sev, rule, file, line, msg, fix, ev) =>
  F.push({severity:sev, rule, file, line, message:msg, fix, evidence:(ev||"").slice(0,120).trim()});

function walk(dir, acc=[]) {
  let ents; try { ents = fs.readdirSync(dir, {withFileTypes:true}); } catch { return acc; }
  for (const e of ents) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (EXT.has(path.extname(e.name))) acc.push(p);
  }
  return acc;
}

const files = walk(SRC);
if (!files.length) { console.error(`No source files found under "${SRC}".`); process.exit(2); }

const counts = {radius:new Map(), shadow:new Map(), rawColor:0};
let totalText = 0;

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const lines = src.split("\n");
  totalText += src.length;

  lines.forEach((ln, i) => {
    const n = i + 1, low = ln.toLowerCase();

    for (const p of C.copy.bannedPhrases)
      if (low.includes(p)) add("high","copy/banned-phrase",file,n,
        `Banned phrase: "${p}"`, "Replace with something specific to this business. If you cannot, the sentence is not saying anything.", ln);

    for (const p of C.copy.placeholders)
      if (low.includes(p.toLowerCase())) add("critical","copy/placeholder",file,n,
        `Placeholder content: "${p}"`, "Replace with real content before ship. This must never reach production.", ln);

    for (const r of C.visual.bannedClassPatterns)
      if (new RegExp(r.re,"i").test(ln)) add("high",`visual/${r.id}`,file,n, r.why,
        "Remove and replace with the project's own token-driven treatment.", ln);

    if (new RegExp(C.visual.emojiInJsx,"u").test(ln) && !/^\s*(\/\/|\*|\/\*)/.test(ln))
      add("medium","visual/emoji-as-icon",file,n,
        "Emoji used in the interface", "Use a real icon set or a custom SVG. Emoji render differently on every platform.", ln);

    const raw = ln.match(new RegExp(C.visual.rawTailwindColors,"g"));
    if (raw) { counts.rawColor += raw.length;
      add("medium","visual/raw-palette",file,n,
        `Default Tailwind colour used directly: ${raw.slice(0,3).join(", ")}`,
        "Reference a named project token instead. Raw palette values mean no design decision was made.", ln); }

    for (const [key, re] of [["radius",C.visual.radiusClasses],["shadow",C.visual.shadowClasses]]) {
      const m = ln.match(new RegExp(re,"g"));
      if (m) for (const v of m) counts[key].set(v,(counts[key].get(v)||0)+1);
    }

    if (C.layout.centeredHero.needs.every(cl => ln.includes(cl)))
      add("high","layout/centred-hero",file,n, C.layout.centeredHero.why,
        "Break the symmetry. Offset the content, or lead with an asymmetric editorial layout.", ln);

    if (ln.includes(C.layout.threeColGrid) && /(feature|benefit|service|card)/i.test(src))
      add("medium","layout/three-col-feature-grid",file,n,
        "Three-column feature grid — the default 'features' block",
        "Vary the sizing, or replace with a layout that reflects what these items actually are.", ln);

    if (C.structure.requireAltText && /<(img|Image)\b/.test(ln) && !/alt\s*=/.test(ln))
      add("critical","a11y/missing-alt",file,n,
        "Image without an alt attribute",
        "Add descriptive alt text, or alt=\"\" if genuinely decorative. This is an accessibility failure, not a style note.", ln);
  });
}

for (const [key, max, why] of [
  ["radius", C.layout.maxRepeatedRadius, "One radius everywhere means the radius was never chosen."],
  ["shadow", C.layout.maxRepeatedShadow, "One shadow everywhere is a component-library default left untouched."]]) {
  for (const [cls, n] of counts[key]) if (n > max)
    add("medium", `visual/uniform-${key}`, "(project-wide)", 0,
      `"${cls}" used ${n} times`, why + " Vary it deliberately, or define a token that means something.", "");
}

// ---- structural checks -------------------------------------------------
const twCfg = ["tailwind.config.ts","tailwind.config.js","tailwind.config.mjs"]
  .map(f => path.join(path.dirname(SRC === "." ? "./x" : SRC), "..", f))
  .concat(["tailwind.config.ts","tailwind.config.js","tailwind.config.mjs"])
  .find(f => fs.existsSync(f));

if (C.structure.requireTokenLayer) {
  if (!twCfg) add("high","structure/no-token-layer","(project)",0,
    "No Tailwind config found","Define a project token layer. Without one, every colour is a default and the site cannot look like anyone.","");
  else {
    const t = fs.readFileSync(twCfg,"utf8");
    const named = (t.match(/['"]?[a-zA-Z][\w-]*['"]?\s*:\s*['"]#[0-9a-fA-F]{3,8}['"]/g)||[]).length;
    if (named < 4) add("high","structure/thin-token-layer",twCfg,0,
      `Only ${named} named colour token(s) defined`,
      "Define at least 5-7 named tokens (ink, background, accent, muted, line...) and reference those everywhere.","");
    const fontSizes = (t.match(/fontSize/)||[]).length;
    if (!fontSizes) add("medium","structure/no-type-scale",twCfg,0,
      "No custom type scale defined",
      "Define an explicit scale. Default scales produce flat hierarchy, which is the most common reason a page reads as generated.","");
    if (C.structure.requireFontConfig && !/fontFamily/.test(t))
      add("high","structure/no-font-config",twCfg,0,
        "No custom fontFamily configured",
        "Ship real typefaces via next/font. The default system stack is the strongest 'nobody designed this' signal there is.","");
  }
}

// ---- score -------------------------------------------------------------
const W = {critical:12, high:6, medium:2.5, low:1};
const penalty = F.reduce((s,f)=>s+W[f.severity],0);
const score = Math.max(0, Math.round(100 - penalty));
const by = s => F.filter(f=>f.severity===s).length;
const summary = {score, pass: score >= C.failScore, filesScanned: files.length,
  critical:by("critical"), high:by("high"), medium:by("medium"), low:by("low")};

if (JSON_OUT) { console.log(JSON.stringify({summary, findings:F}, null, 1)); }
else {
  const bar = (n,ch="█") => ch.repeat(Math.max(0,Math.round(n/4)));
  console.log(`\n  NSE ANTI-GENERIC AUDIT`);
  console.log(`  ${files.length} files scanned\n`);
  console.log(`  Score  ${score}/100  ${bar(score)}  ${summary.pass ? "PASS" : "FAIL"}  (threshold ${C.failScore})`);
  console.log(`  critical ${summary.critical} · high ${summary.high} · medium ${summary.medium} · low ${summary.low}\n`);
  const order = ["critical","high","medium","low"];
  const grouped = {};
  for (const f of F) (grouped[f.rule] ||= []).push(f);
  Object.entries(grouped)
    .sort((a,b)=>order.indexOf(a[1][0].severity)-order.indexOf(b[1][0].severity))
    .forEach(([rule, items]) => {
      console.log(`  [${items[0].severity.toUpperCase()}] ${rule}  (${items.length})`);
      console.log(`    ${items[0].message}`);
      console.log(`    Fix: ${items[0].fix}`);
      items.slice(0,4).forEach(i => console.log(`      ${i.file}${i.line?":"+i.line:""}  ${i.evidence}`));
      if (items.length>4) console.log(`      ...and ${items.length-4} more`);
      console.log("");
    });
  if (!F.length) console.log("  No findings. Verify by eye as well — this catches patterns, not taste.\n");
}
process.exit(summary.pass ? 0 : 1);
