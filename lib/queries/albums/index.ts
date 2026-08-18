"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { http } from "@/lib/queries/http"
import { queryKeys } from "@/lib/queries/keys"
import type { AlbumCategory, AlbumPhotoRow, AlbumRow } from "@/lib/supabase/types"

type AlbumWithPhotos = AlbumRow & { photos: AlbumPhotoRow[] }

export function useAlbums() {
  return useQuery({
    queryKey: queryKeys.albums,
    queryFn: async () => (await http.get<AlbumRow[]>("/albums")).data,
  })
}

export function useAlbum(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.album(id),
    queryFn: async () => (await http.get<AlbumWithPhotos>(`/albums/${id}`)).data,
    enabled: Boolean(id) && (options?.enabled ?? true),
  })
}

export function useCreateAlbum() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      category: AlbumCategory
      title: string
      slug: string
      location?: string | null
      eventDate?: string | null
    }) => (await http.post<AlbumRow>("/albums", input)).data,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.albums })
    },
  })
}

export function useUpdateAlbum(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      patch: Partial<
        Pick<
          AlbumRow,
          | "title"
          | "slug"
          | "event_date"
          | "location"
          | "cover_image_key"
          | "highlight_video_url"
          | "is_featured"
          | "is_published"
          | "sort_order"
        >
      >
    ) => (await http.patch<AlbumRow>(`/albums/${id}`, patch)).data,
    onSuccess: () => {
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.albums }),
        queryClient.invalidateQueries({ queryKey: queryKeys.album(id) }),
      ])
    },
  })
}

export function useDeleteAlbum() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/albums/${id}`)
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.albums })
    },
  })
}

export function useAddPhoto(albumId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { imageKey: string; sortOrder: number }) =>
      (await http.post<AlbumPhotoRow>(`/albums/${albumId}/photos`, input)).data,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.album(albumId) })
    },
  })
}

export function useDeletePhoto(albumId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (photoId: string) => {
      await http.delete(`/albums/${albumId}/photos/${photoId}`)
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.album(albumId) })
    },
  })
}

export function useUpdatePhotoSortOrder(albumId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { photoId: string; sortOrder: number }) =>
      (
        await http.patch<AlbumPhotoRow>(
          `/albums/${albumId}/photos/${input.photoId}`,
          { sortOrder: input.sortOrder }
        )
      ).data,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.album(albumId) })
    },
  })
}
