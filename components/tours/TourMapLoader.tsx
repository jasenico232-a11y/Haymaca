"use client";

import dynamic from "next/dynamic";
import type { TourView } from "@/lib/tours/view";
import { MapSkeleton } from "./MapSkeleton";
import type { MapLabels } from "./TourMap";

// ssr:false keeps MapLibre out of the server render and out of first-load JS —
// it is fetched only when this component mounts (i.e. when the map view opens).
const TourMap = dynamic(() => import("./TourMap"), { ssr: false });

export function TourMapLoader({
  tours,
  labels,
}: {
  tours: TourView[];
  labels: MapLabels;
}) {
  return (
    // Fixed frame reserves the space up front; the skeleton and the map both
    // fill it absolutely, so swapping one for the other shifts nothing (CLS 0).
    <div className="relative h-[68vh] min-h-[480px] w-full overflow-hidden rounded-card border border-line">
      <MapSkeleton label={labels.loading} />
      <TourMap tours={tours} labels={labels} />
    </div>
  );
}
