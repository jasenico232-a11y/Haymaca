"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { jamaicaBounds, type CategorySlug, type RegionSlug } from "@/lib/tours/model";
import type { TourView } from "@/lib/tours/view";
import { TourCard } from "./TourCard";

export type MapLabels = {
  loading: string;
  close: string;
  clusterTemplate: string; // "{n} tours"
  regionsLabel: string;
};

type Props = { tours: TourView[]; labels: MapLabels };

// Below this zoom the pins collapse into one marker per region; above it, every
// tour gets its own pin. That is the "cluster by region" behaviour.
const CLUSTER_ZOOM = 9;

const PAPER = "#FBFAF6";

// One-path white glyphs, drawn inside the coloured pin so colour is paired with
// an icon on the map itself (viewBox 0 0 20 20).
const PIN_GLYPH: Record<CategorySlug, string> = {
  adventure: "M2 16 L7 7 L10 11 L13 5 L18 16 Z",
  water: "M2 8 q3 -3 6 0 t6 0 M2 13 q3 -3 6 0 t6 0",
  culture: "M4 8 L10 4 L16 8 M6 8 v6 M10 8 v6 M14 8 v6 M4 15 h12",
  food: "M8 3 h4 M9 3 v3 l-1 2 v9 h4 v-9 l-1 -2 v-3 M8 12 h4",
  wildlife: "M17 4 C8 4 4 8 4 15 c6 -2 10 -6 13 -11 -3 4 -7 6 -10 10",
};

const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
} as unknown as maplibregl.StyleSpecification;

function centroid(list: TourView[]): [number, number] {
  const sum = list.reduce(
    (acc, t) => [acc[0] + t.coords[0], acc[1] + t.coords[1]] as [number, number],
    [0, 0] as [number, number],
  );
  return [sum[0] / list.length, sum[1] / list.length];
}

function groupByRegion(list: TourView[]): Map<RegionSlug, TourView[]> {
  const groups = new Map<RegionSlug, TourView[]>();
  for (const tour of list) {
    const bucket = groups.get(tour.region);
    if (bucket) bucket.push(tour);
    else groups.set(tour.region, [tour]);
  }
  return groups;
}

function pinElement(tour: TourView, label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", label);
  Object.assign(button.style, {
    width: "44px",
    height: "44px",
    padding: "0",
    border: "none",
    background: "transparent",
    cursor: "pointer",
  });
  button.innerHTML = `
    <span style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:${tour.color};border:2px solid ${PAPER};box-shadow:0 1px 3px rgba(18,20,15,.35)">
      <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="${PAPER}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${PIN_GLYPH[tour.category]}"/></svg>
    </span>`;
  button.addEventListener("click", onClick);
  return button;
}

function clusterElement(count: number, label: string, onClick: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", label);
  Object.assign(button.style, {
    width: "44px",
    height: "44px",
    padding: "0",
    border: "none",
    background: "transparent",
    cursor: "pointer",
  });
  button.innerHTML = `
    <span style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:#12140F;color:${PAPER};border:2px solid ${PAPER};font:600 14px/1 ui-sans-serif,system-ui,sans-serif;box-shadow:0 1px 3px rgba(18,20,15,.35)">${count}</span>`;
  button.addEventListener("click", onClick);
  return button;
}

export default function TourMap({ tours, labels }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const toursRef = useRef<TourView[]>(tours);
  const selectRef = useRef<(tour: TourView) => void>(() => {});
  const [selected, setSelected] = useState<TourView | null>(null);

  toursRef.current = tours;
  selectRef.current = setSelected;

  function renderMarkers() {
    const map = mapRef.current;
    if (!map) return;
    for (const marker of markersRef.current) marker.remove();
    markersRef.current = [];

    const list = toursRef.current;
    if (map.getZoom() < CLUSTER_ZOOM) {
      for (const [, group] of groupByRegion(list)) {
        const label = labels.clusterTemplate.replace("{n}", String(group.length));
        const center = centroid(group);
        const element = clusterElement(group.length, label, () =>
          map.easeTo({ center, zoom: CLUSTER_ZOOM + 1.6 }),
        );
        markersRef.current.push(
          new maplibregl.Marker({ element, anchor: "center" }).setLngLat(center).addTo(map),
        );
      }
    } else {
      for (const tour of list) {
        const element = pinElement(tour, `${tour.categoryName} — ${tour.title}`, () =>
          selectRef.current(tour),
        );
        markersRef.current.push(
          new maplibregl.Marker({ element, anchor: "center" }).setLngLat(tour.coords).addTo(map),
        );
      }
    }
  }

  // Init the map once.
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      bounds: jamaicaBounds,
      fitBoundsOptions: { padding: 40 },
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", renderMarkers);
    map.on("zoomend", renderMarkers);

    return () => {
      for (const marker of markersRef.current) marker.remove();
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render markers when the filtered set changes; drop a selection that fell
  // out of the results.
  useEffect(() => {
    if (mapRef.current?.isStyleLoaded()) renderMarkers();
    setSelected((current) =>
      current && tours.some((tour) => tour.slug === current.slug) ? current : null,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tours]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" aria-label={labels.regionsLabel} />

      {selected ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-3 sm:justify-start sm:p-4">
          <div className="pointer-events-auto relative w-full max-w-sm">
            <button
              type="button"
              onClick={() => setSelected(null)}
              aria-label={labels.close}
              className="absolute -right-2 -top-2 z-10 rounded-control border border-line bg-paper text-sm text-ink shadow-sm"
            >
              <span aria-hidden="true" className="px-1 text-lg leading-none">
                ×
              </span>
            </button>
            <TourCard view={selected} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
