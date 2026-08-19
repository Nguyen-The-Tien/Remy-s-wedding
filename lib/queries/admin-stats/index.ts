"use client"

import { useQuery } from "@tanstack/react-query"

import { http } from "@/lib/queries/http"
import { queryKeys } from "@/lib/queries/keys"

type CategoryStats = { total: number; published: number }

type AdminStats = {
  albums: CategoryStats & { pre_wedding: CategoryStats; wedding: CategoryStats }
  videos: CategoryStats
}

export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.adminStats,
    queryFn: async () => (await http.get<AdminStats>("/admin/stats")).data,
  })
}
