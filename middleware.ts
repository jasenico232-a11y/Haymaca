import { NextResponse, type NextRequest } from "next/server";
import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  locales,
  type Locale,
} from "./i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Negotiate a locale: an explicit override cookie wins; otherwise the browser's
 * Accept-Language preference, by quality; otherwise the default.
 */
function negotiateLocale(request: NextRequest): Locale {
  const override = request.cookies.get(LOCALE_COOKIE)?.value;
  if (isLocale(override)) return override;

  const header = request.headers.get("accept-language");
  if (header) {
    const ranked = header
      .split(",")
      .map((part) => {
        const [tag, ...params] = part.trim().split(";");
        const q = params
          .map((p) => p.trim())
          .find((p) => p.startsWith("q="));
        return {
          tag: (tag ?? "").toLowerCase(),
          quality: q ? Number.parseFloat(q.slice(2)) || 0 : 1,
        };
      })
      .sort((a, b) => b.quality - a.quality);

    for (const { tag } of ranked) {
      const base = tag.split("-")[0];
      if (isLocale(base)) return base;
    }
  }

  return defaultLocale;
}

/** A fresh, unguessable base64 nonce for this request's CSP. */
function makeNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// The tour map (MapLibre GL) pulls open raster tiles from OpenStreetMap and
// spins up its rendering worker from a blob: URL. Everything else stays 'self'.
const TILE_HOST = "https://tile.openstreetmap.org https://*.tile.openstreetmap.org";

function contentSecurityPolicy(nonce: string, isDev: boolean): string {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  // Next.js dev server and the error overlay compile with eval.
  if (isDev) scriptSrc.push("'unsafe-eval'");

  return [
    "default-src 'self'",
    "base-uri 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    // Scripts are nonce-locked; inline styles (React style props, next/font) are
    // allowed. The brief bans unsafe-inline for scripts only.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${TILE_HOST}`,
    "font-src 'self'",
    `connect-src 'self' ${TILE_HOST}`,
    "worker-src 'self' blob:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function applySecurityHeaders(
  headers: Headers,
  csp: string,
): void {
  headers.set("Content-Security-Policy", csp);
  headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set(
    "Permissions-Policy",
    [
      "accelerometer=()",
      "autoplay=()",
      "camera=()",
      "display-capture=()",
      "encrypted-media=()",
      "geolocation=()",
      "gyroscope=()",
      "magnetometer=()",
      "microphone=()",
      "payment=()",
      "usb=()",
      "browsing-topics=()",
      "interest-cohort=()",
    ].join(", "),
  );
  headers.set("X-Frame-Options", "DENY");
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isDev = process.env.NODE_ENV !== "production";
  const nonce = makeNonce();
  const csp = contentSecurityPolicy(nonce, isDev);

  const pathHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (!pathHasLocale) {
    const locale = negotiateLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

    const redirect = NextResponse.redirect(url);
    applySecurityHeaders(redirect.headers, csp);
    // Remember the negotiated choice so later visits are stable.
    redirect.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: ONE_YEAR,
      sameSite: "lax",
    });
    return redirect;
  }

  // The path is already localized. Forward the nonce so Server Components can
  // read it, and put the CSP on the request headers so Next.js stamps the nonce
  // onto the scripts it injects.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  applySecurityHeaders(response.headers, csp);
  return response;
}

export const config = {
  // Run on document routes only: skip API route handlers (they must not be
  // locale-redirected), Next internals, and any file with an extension.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.).*)",
  ],
};
