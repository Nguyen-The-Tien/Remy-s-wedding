export const queryKeys = {
  albums: ["albums"] as const,
  albumsList: (params: { page: number; pageSize: number; category: string }) =>
    ["albums", "list", params] as const,
  album: (id: string) => ["albums", id] as const,
  videos: ["videos"] as const,
  videosList: (params: { page: number; pageSize: number }) =>
    ["videos", "list", params] as const,
  heroImages: ["hero-images"] as const,
  settings: ["settings"] as const,
  adminStats: ["admin-stats"] as const,
}
