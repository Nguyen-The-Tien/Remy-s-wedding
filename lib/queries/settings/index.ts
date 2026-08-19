"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { http } from "@/lib/queries/http"
import { queryKeys } from "@/lib/queries/keys"
import type { SiteSettingsRow } from "@/lib/supabase/types"

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: async () => (await http.get<SiteSettingsRow>("/settings")).data,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      patch: Partial<
        Pick<
          SiteSettingsRow,
          | "email"
          | "address"
          | "zalo_link"
          | "facebook_link"
          | "instagram_link"
          | "hero_background_mode"
          | "hero_video_url"
        >
      >
    ) => (await http.patch<SiteSettingsRow>("/settings", patch)).data,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: queryKeys.settings })
    },
  })
}
