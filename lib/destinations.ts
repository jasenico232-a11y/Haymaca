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
