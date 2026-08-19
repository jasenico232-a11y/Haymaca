"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ViewMode } from "@/lib/tours/model";

type Props = {
  labels: { label: string; grid: string; map: string };
};

export function ViewToggle({ labels }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current: ViewMode = searchParams.get("view") === "map" ? "map" : "grid";

  function setView(view: ViewMode) {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "map") params.set("view", "map");
    else params.delete("view");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const options: Array<{ value: ViewMode; label: string }> = [
    { value: "grid", label: labels.grid },
    { value: "map", label: labels.map },
  ];

  return (
    <div
      role="group"
      aria-label={labels.label}
      className="inline-flex overflow-hidden rounded-control border border-line"
    >
      {options.map((option) => {
        const active = option.value === current;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setView(option.value)}
            aria-pressed={active}
            className={
              active
                ? "px-4 text-sm font-medium text-paper bg-forest"
                : "px-4 text-sm text-muted transition-colors hover:text-ink"
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
