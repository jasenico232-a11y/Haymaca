"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Labels = {
  scanInput: string;
  scanButton: string;
  online: string;
  offline: string;
  queuedCount: string; // "{n} waiting to sync"
  syncNow: string;
  resultCheckedIn: string; // "Checked in: {name}, party of {party}"
  resultAlready: string; // "Already checked in: {name}"
  resultInvalid: string;
  resultNotConfirmed: string;
  resultWrongDeparture: string;
  cameraUnavailable: string;
};

type LogEntry = { id: number; text: string; tone: "ok" | "warn" };
type QueueItem = { token: string; ts: number };

const QUEUE_KEY = "haymaca_scan_queue";

export function ScanConsole({ labels }: { labels: Labels }) {
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [token, setToken] = useState("");
  const logId = useRef(0);
  const syncing = useRef(false);

  const persist = useCallback((items: QueueItem[]) => {
    setQueue(items);
    try {
      window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
    } catch {
      // storage unavailable — the in-memory queue still holds this session
    }
  }, []);

  const pushLog = useCallback((text: string, tone: "ok" | "warn") => {
    logId.current += 1;
    const entry = { id: logId.current, text, tone };
    setLog((prev) => [entry, ...prev].slice(0, 8));
  }, []);

  // Reports a definitive server result. Returns true when the scan is resolved
  // (checked in or definitively rejected) and should not be re-queued.
  const reportResult = useCallback(
    (status: number, data: Record<string, unknown>): boolean => {
      if (status === 200) {
        const name = String(data.name ?? "");
        const party = String(data.partySize ?? "");
        if (data.already)
          pushLog(labels.resultAlready.replace("{name}", name), "warn");
        else
          pushLog(
            labels.resultCheckedIn
              .replace("{name}", name)
              .replace("{party}", party),
            "ok",
          );
        return true;
      }
      if (status === 422) {
        const reason = String(data.error ?? "invalid_token");
        const text =
          reason === "not_confirmed"
            ? labels.resultNotConfirmed
            : reason === "wrong_departure"
              ? labels.resultWrongDeparture
              : labels.resultInvalid;
        pushLog(text, "warn");
        return true; // forged / invalid — do not retry
      }
      return false; // transient (401/429/5xx) — leave queued
    },
    [labels, pushLog],
  );

  const flush = useCallback(async () => {
    if (syncing.current || !navigator.onLine) return;
    syncing.current = true;
    try {
      let remaining = [...queue];
      for (const item of [...remaining]) {
        try {
          const res = await fetch("/api/operator/checkin", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ token: item.token }),
          });
          const data = await res.json().catch(() => ({}));
          const resolved = reportResult(res.status, data);
          if (resolved) {
            remaining = remaining.filter((q) => q !== item);
            persist(remaining);
          } else {
            break; // transient failure — stop and keep the rest queued
          }
        } catch {
          break; // network dropped again
        }
      }
    } finally {
      syncing.current = false;
    }
  }, [queue, reportResult, persist]);

  // Load any queue left from a previous (offline) session, wire connectivity.
  useEffect(() => {
    setOnline(navigator.onLine);
    try {
      const raw = window.localStorage.getItem(QUEUE_KEY);
      if (raw) setQueue(JSON.parse(raw) as QueueItem[]);
    } catch {
      // ignore malformed storage
    }
    const goOnline = () => {
      setOnline(true);
      void flush();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever we come online with a non-empty queue, drain it.
  useEffect(() => {
    if (online && queue.length > 0) void flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  async function submit(raw: string) {
    const value = raw.trim();
    if (!value) return;
    setToken("");

    if (!navigator.onLine) {
      persist([...queue, { token: value, ts: Date.now() }]);
      return;
    }
    try {
      const res = await fetch("/api/operator/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: value }),
      });
      const data = await res.json().catch(() => ({}));
      const resolved = reportResult(res.status, data);
      if (!resolved) persist([...queue, { token: value, ts: Date.now() }]);
    } catch {
      // Offline mid-request — queue it for the next sync.
      persist([...queue, { token: value, ts: Date.now() }]);
    }
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <span
          className={`inline-flex items-center gap-2 text-sm ${
            online ? "text-forest" : "text-ink"
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-control ${
              online ? "bg-forest" : "bg-sun"
            }`}
          />
          {online ? labels.online : labels.offline}
        </span>
        {queue.length > 0 ? (
          <span className="text-sm text-muted">
            {labels.queuedCount.replace("{n}", String(queue.length))}
          </span>
        ) : null}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(token);
        }}
      >
        <input
          aria-label={labels.scanInput}
          value={token}
          onChange={(event) => setToken(event.target.value)}
          className="w-full rounded-control border border-line bg-paper text-base text-ink transition-colors focus:border-river"
        />
        <button
          type="submit"
          className="shrink-0 rounded-control bg-forest px-4 text-sm font-medium text-paper transition-colors hover:bg-ink"
        >
          {labels.scanButton}
        </button>
      </form>

      {queue.length > 0 ? (
        <button
          type="button"
          onClick={() => void flush()}
          disabled={!online}
          className="mt-3 rounded-control border border-line px-4 text-sm text-ink transition-colors hover:border-ink disabled:opacity-50"
        >
          {labels.syncNow}
        </button>
      ) : null}

      <ul className="mt-5 space-y-2">
        {log.map((entry) => (
          <li
            key={entry.id}
            className={`flex items-center gap-2 rounded-control border px-3 py-2 text-sm ${
              entry.tone === "ok"
                ? "border-forest/30 bg-forest/5 text-ink"
                : "border-sun/40 bg-sun/10 text-ink"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-control ${
                entry.tone === "ok" ? "bg-forest" : "bg-sun"
              }`}
            />
            {entry.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
