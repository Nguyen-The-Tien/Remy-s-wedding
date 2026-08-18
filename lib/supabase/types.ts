export type AlbumCategory = "pre_wedding" | "wedding"

export type HeroBackgroundMode = "video" | "images"

export type AlbumRow = {
  id: string
  category: AlbumCategory
  title: string
  slug: string
  event_date: string | null
  location: string | null
  cover_image_key: string | null
  highlight_video_url: string | null
  is_featured: boolean
  is_published: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type AlbumPhotoRow = {
  id: string
  album_id: string
  image_key: string
  sort_order: number
  created_at: string
}

export type VideoRow = {
  id: string
  title: string
  location: string
  event_date: string
  youtube_url: string
  is_published: boolean
  created_at: string
}

export type SiteSettingsRow = {
  id: number
  email: string | null
  address: string | null
  zalo_link: string | null
  facebook_link: string | null
  instagram_link: string | null
  hero_background_mode: HeroBackgroundMode
  hero_video_key: string | null
  updated_at: string
}

export type HeroImageRow = {
  id: string
  image_key: string
  sort_order: number
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      albums: {
        Row: AlbumRow
        Insert: Partial<AlbumRow> & Pick<AlbumRow, "category" | "title" | "slug">
        Update: Partial<AlbumRow>
      }
      album_photos: {
        Row: AlbumPhotoRow
        Insert: Partial<AlbumPhotoRow> & Pick<AlbumPhotoRow, "album_id" | "image_key">
        Update: Partial<AlbumPhotoRow>
      }
      videos: {
        Row: VideoRow
        Insert: Partial<VideoRow> &
          Pick<VideoRow, "title" | "location" | "event_date" | "youtube_url">
        Update: Partial<VideoRow>
      }
      site_settings: {
        Row: SiteSettingsRow
        Insert: Partial<SiteSettingsRow>
        Update: Partial<SiteSettingsRow>
      }
      hero_images: {
        Row: HeroImageRow
        Insert: Partial<HeroImageRow> & Pick<HeroImageRow, "image_key">
        Update: Partial<HeroImageRow>
      }
    }
  }
}
