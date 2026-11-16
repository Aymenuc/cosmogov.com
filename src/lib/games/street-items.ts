/** Things you can put on your Dream street. Space = how many of the 8 spots it takes. */
export const STREET_ITEMS = [
  { id: "trees", label: "Shade trees", space: 1 },
  { id: "bench", label: "Benches", space: 1 },
  { id: "flowers", label: "Flower beds", space: 1 },
  { id: "lights", label: "Warm street lights", space: 1 },
  { id: "fountain", label: "Water fountain", space: 1 },
  { id: "art", label: "Street art", space: 1 },
  { id: "bus", label: "Bus stop", space: 1 },
  { id: "bikes", label: "Bike lane", space: 2 },
  { id: "market", label: "Market stalls", space: 2 },
  { id: "play", label: "Play corner", space: 2 },
  { id: "cafe", label: "Café terrace", space: 2 },
  { id: "parking", label: "Parking spaces", space: 2 },
] as const;
export type StreetItemId = (typeof STREET_ITEMS)[number]["id"];
export const STREET_SPACE = 8;
export const VIBES = ["Calm", "Lively", "Green", "Safe"] as const;
