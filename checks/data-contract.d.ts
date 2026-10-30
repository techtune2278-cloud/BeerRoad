// Minimal contract for the missing data module. Test-only: not application content.
declare module "@/src/data/beerRoadData" {
  export type Universe = "origines" | "transmission" | "atelier" | "grenier" | "kerhuon" | "legendes" | "avenir"
  export const plaques: Array<{ universe: Universe; name: string; content: {
    highlights?: Array<{ label: string }>; albums?: Array<{ title: string }>;
    books?: Array<{ title: string }>; links?: Array<{ label: string }>;
  } }>
}
