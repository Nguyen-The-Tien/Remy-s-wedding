"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { APP_CONFIG } from "@/config/config"
import { mockAlbums } from "@/lib/mock-albums"
import { mockVideos } from "@/lib/mock-videos"
import type {
  AdminAlbum,
  AdminSettings,
  AdminVideo,
  NewAlbumInput,
  VideoFormValues,
} from "@/lib/admin/types"

function seedAlbums(): AdminAlbum[] {
  return mockAlbums.map((album, index) => ({
    id: album.id,
    category: album.category,
    title: album.title,
    slug: album.slug,
    eventDate: album.date,
    location: album.location,
    coverImage: album.coverImage,
    highlightVideoUrl: album.highlightVideoUrl ?? "",
    isFeatured: index < 3,
    isPublished: true,
    createdAt: new Date(2026, 0, index + 1).toISOString(),
    photos: album.photos.map((url, photoIndex) => ({
      id: `${album.id}-p${photoIndex}`,
      url,
    })),
  }))
}

function seedVideos(): AdminVideo[] {
  return mockVideos.map((video, index) => ({
    id: video.id,
    title: video.title,
    location: video.location,
    eventDate: video.date,
    youtubeUrl: video.youtubeUrl,
    isPublished: true,
    createdAt: new Date(2026, 0, index + 1).toISOString(),
  }))
}

function seedSettings(): AdminSettings {
  return {
    email: APP_CONFIG.contact.email,
    address: APP_CONFIG.contact.address,
    zaloLink: APP_CONFIG.contact.zaloUrl,
    facebookLink: APP_CONFIG.contact.facebookUrl,
    instagramLink: APP_CONFIG.contact.instagramUrl,
    heroBackgroundMode: "video",
    heroVideoUrl: "",
    heroImages: mockAlbums.slice(0, 6).map((album, index) => ({
      id: `hero-${index}`,
      url: album.coverImage,
    })),
  }
}

type AdminDataContextValue = {
  albums: AdminAlbum[]
  videos: AdminVideo[]
  settings: AdminSettings
  getAlbum: (id: string) => AdminAlbum | undefined
  createAlbum: (input: NewAlbumInput) => AdminAlbum
  updateAlbum: (id: string, patch: Partial<AdminAlbum>) => void
  deleteAlbum: (id: string) => void
  togglePublished: (id: string) => void
  toggleFeatured: (id: string) => void
  addPhotos: (albumId: string, urls: string[]) => void
  removePhoto: (albumId: string, photoId: string) => void
  movePhoto: (
    albumId: string,
    photoId: string,
    direction: "up" | "down"
  ) => void
  createVideo: (input: VideoFormValues) => AdminVideo
  updateVideo: (id: string, patch: Partial<AdminVideo>) => void
  deleteVideo: (id: string) => void
  toggleVideoPublished: (id: string) => void
  updateSettings: (patch: Partial<AdminSettings>) => void
  addHeroImages: (urls: string[]) => void
  removeHeroImage: (photoId: string) => void
  moveHeroImage: (photoId: string, direction: "up" | "down") => void
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null)

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [albums, setAlbums] = useState<AdminAlbum[]>(seedAlbums)
  const [videos, setVideos] = useState<AdminVideo[]>(seedVideos)
  const [settings, setSettings] = useState<AdminSettings>(seedSettings)

  const getAlbum = useCallback(
    (id: string) => albums.find((album) => album.id === id),
    [albums]
  )

  const createAlbum = useCallback((input: NewAlbumInput) => {
    const album: AdminAlbum = {
      id: crypto.randomUUID(),
      category: input.category,
      title: input.title,
      slug: input.slug,
      eventDate: input.eventDate,
      location: "",
      coverImage: "",
      highlightVideoUrl: "",
      isFeatured: false,
      isPublished: false,
      createdAt: new Date().toISOString(),
      photos: [],
    }
    setAlbums((prev) => [album, ...prev])
    return album
  }, [])

  const updateAlbum = useCallback((id: string, patch: Partial<AdminAlbum>) => {
    setAlbums((prev) =>
      prev.map((album) => (album.id === id ? { ...album, ...patch } : album))
    )
  }, [])

  const deleteAlbum = useCallback((id: string) => {
    setAlbums((prev) => prev.filter((album) => album.id !== id))
  }, [])

  const togglePublished = useCallback((id: string) => {
    setAlbums((prev) =>
      prev.map((album) =>
        album.id === id ? { ...album, isPublished: !album.isPublished } : album
      )
    )
  }, [])

  const toggleFeatured = useCallback((id: string) => {
    setAlbums((prev) =>
      prev.map((album) =>
        album.id === id ? { ...album, isFeatured: !album.isFeatured } : album
      )
    )
  }, [])

  const addPhotos = useCallback((albumId: string, urls: string[]) => {
    setAlbums((prev) =>
      prev.map((album) =>
        album.id === albumId
          ? {
              ...album,
              photos: [
                ...album.photos,
                ...urls.map((url) => ({ id: crypto.randomUUID(), url })),
              ],
            }
          : album
      )
    )
  }, [])

  const removePhoto = useCallback((albumId: string, photoId: string) => {
    setAlbums((prev) =>
      prev.map((album) =>
        album.id === albumId
          ? { ...album, photos: album.photos.filter((p) => p.id !== photoId) }
          : album
      )
    )
  }, [])

  const movePhoto = useCallback(
    (albumId: string, photoId: string, direction: "up" | "down") => {
      setAlbums((prev) =>
        prev.map((album) => {
          if (album.id !== albumId) return album
          const index = album.photos.findIndex((p) => p.id === photoId)
          if (index === -1) return album
          const swapWith = direction === "up" ? index - 1 : index + 1
          if (swapWith < 0 || swapWith >= album.photos.length) return album
          const photos = [...album.photos]
          ;[photos[index], photos[swapWith]] = [photos[swapWith], photos[index]]
          return { ...album, photos }
        })
      )
    },
    []
  )

  const createVideo = useCallback((input: VideoFormValues) => {
    const video: AdminVideo = {
      id: crypto.randomUUID(),
      title: input.title,
      location: input.location,
      eventDate: input.eventDate,
      youtubeUrl: input.youtubeUrl,
      isPublished: false,
      createdAt: new Date().toISOString(),
    }
    setVideos((prev) => [video, ...prev])
    return video
  }, [])

  const updateVideo = useCallback((id: string, patch: Partial<AdminVideo>) => {
    setVideos((prev) =>
      prev.map((video) => (video.id === id ? { ...video, ...patch } : video))
    )
  }, [])

  const deleteVideo = useCallback((id: string) => {
    setVideos((prev) => prev.filter((video) => video.id !== id))
  }, [])

  const toggleVideoPublished = useCallback((id: string) => {
    setVideos((prev) =>
      prev.map((video) =>
        video.id === id ? { ...video, isPublished: !video.isPublished } : video
      )
    )
  }, [])

  const updateSettings = useCallback((patch: Partial<AdminSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const addHeroImages = useCallback((urls: string[]) => {
    setSettings((prev) => ({
      ...prev,
      heroImages: [
        ...prev.heroImages,
        ...urls.map((url) => ({ id: crypto.randomUUID(), url })),
      ],
    }))
  }, [])

  const removeHeroImage = useCallback((photoId: string) => {
    setSettings((prev) => ({
      ...prev,
      heroImages: prev.heroImages.filter((p) => p.id !== photoId),
    }))
  }, [])

  const moveHeroImage = useCallback(
    (photoId: string, direction: "up" | "down") => {
      setSettings((prev) => {
        const index = prev.heroImages.findIndex((p) => p.id === photoId)
        if (index === -1) return prev
        const swapWith = direction === "up" ? index - 1 : index + 1
        if (swapWith < 0 || swapWith >= prev.heroImages.length) return prev
        const heroImages = [...prev.heroImages]
        ;[heroImages[index], heroImages[swapWith]] = [
          heroImages[swapWith],
          heroImages[index],
        ]
        return { ...prev, heroImages }
      })
    },
    []
  )

  const value = useMemo<AdminDataContextValue>(
    () => ({
      albums,
      videos,
      settings,
      getAlbum,
      createAlbum,
      updateAlbum,
      deleteAlbum,
      togglePublished,
      toggleFeatured,
      addPhotos,
      removePhoto,
      movePhoto,
      createVideo,
      updateVideo,
      deleteVideo,
      toggleVideoPublished,
      updateSettings,
      addHeroImages,
      removeHeroImage,
      moveHeroImage,
    }),
    [
      albums,
      videos,
      settings,
      getAlbum,
      createAlbum,
      updateAlbum,
      deleteAlbum,
      togglePublished,
      toggleFeatured,
      addPhotos,
      removePhoto,
      movePhoto,
      createVideo,
      updateVideo,
      deleteVideo,
      toggleVideoPublished,
      updateSettings,
      addHeroImages,
      removeHeroImage,
      moveHeroImage,
    ]
  )

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  )
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext)
  if (!ctx) {
    throw new Error("useAdminData must be used within an AdminDataProvider")
  }
  return ctx
}
