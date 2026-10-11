/**
 * Display order for destinations. The copy for each one lives in the message
 * catalogues under destinations.items[slug]; this file only decides sequence,
 * so adding a place is a catalogue entry plus a slug here.
 */
export const destinationOrder = [
  "treasure-beach",
  "port-antonio",
  "blue-mountains",
  "frenchmans-cove",
] as const;

export type DestinationSlug = (typeof destinationOrder)[number];

/** Where each destination sits, [longitude, latitude], for the locator maps. */
export const destinationCoords: Record<DestinationSlug, [number, number]> = {
  "treasure-beach": [-77.755, 17.885],
  "port-antonio": [-76.451, 18.177],
  "blue-mountains": [-76.579, 18.046],
  "frenchmans-cove": [-76.398, 18.172],
};
