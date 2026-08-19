"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { http } from "@/lib/queries/http"
import { queryKeys } from "@/lib/queries/keys"
import type { VideoRow } from "@/lib/supabase/types"

export function useVideos() {
  return useQuery({
    queryKey: queryKeys.videos,
    queryFn: async () => (await http.get<VideoRow[]>("/videos")).data,
  })
}

export function useCreateVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      title: string
      location: string
      eventDate: string
      youtubeUrl: string
    }) => (await http.post<VideoRow>("/videos", input)).data,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.videos })
    },
  })
}

export function useUpdateVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string
      patch: Partial<{
        title: string
        location: string
        event_date: string
        youtube_url: string
        is_published: boolean
      }>
    }) => (await http.patch<VideoRow>(`/videos/${id}`, patch)).data,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.videos })
    },
  })
}

export function useDeleteVideo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/videos/${id}`)
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.videos })
    },
  })
}
