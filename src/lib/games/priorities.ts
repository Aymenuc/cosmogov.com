/** Neighbourhood priorities for "My top three". */
export const PRIORITIES = [
  { id: "safety", label: "Safer streets", emoji: "🦺" },
  { id: "clean", label: "Cleaner streets", emoji: "🧹" },
  { id: "green", label: "More green space", emoji: "🌳" },
  { id: "housing", label: "Affordable homes", emoji: "🏠" },
  { id: "transport", label: "Better buses and paths", emoji: "🚌" },
  { id: "youth", label: "Things for young people", emoji: "🛹" },
  { id: "elders", label: "Support for older people", emoji: "🫖" },
  { id: "shops", label: "Local jobs and shops", emoji: "🛍️" },
  { id: "culture", label: "Culture and events", emoji: "🎭" },
  { id: "quiet", label: "Quieter nights", emoji: "🌙" },
] as const;
export type PriorityId = (typeof PRIORITIES)[number]["id"];
