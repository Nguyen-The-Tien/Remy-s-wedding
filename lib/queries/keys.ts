export const queryKeys = {
  albums: ["albums"] as const,
  album: (id: string) => ["albums", id] as const,
  videos: ["videos"] as const,
  heroImages: ["hero-images"] as const,
  settings: ["settings"] as const,
}
