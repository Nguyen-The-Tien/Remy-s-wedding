"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { http } from "@/lib/queries/http"
import { queryKeys } from "@/lib/queries/keys"
import type { HeroImageRow } from "@/lib/supabase/types"

export function useHeroImages() {
  return useQuery({
    queryKey: queryKeys.heroImages,
    queryFn: async () => (await http.get<HeroImageRow[]>("/hero-images")).data,
  })
}

export function useAddHeroImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { imageKey: string; sortOrder: number }) =>
      (await http.post<HeroImageRow>("/hero-images", input)).data,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.heroImages })
    },
  })
}

export function useDeleteHeroImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await http.delete(`/hero-images/${id}`)
    },
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.heroImages })
    },
  })
}

export function useUpdateHeroImageSortOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { id: string; sortOrder: number }) =>
      (
        await http.patch<HeroImageRow>(`/hero-images/${input.id}`, {
          sortOrder: input.sortOrder,
        })
      ).data,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.heroImages })
    },
  })
}
