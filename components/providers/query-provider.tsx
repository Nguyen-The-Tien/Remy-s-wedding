"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import axios from "axios"

function shouldRetry(failureCount: number, error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    // Client errors (400-499) won't succeed by retrying — e.g. a 404 for a
    // resource that was just deleted, or a 401 for an expired session.
    if (status && status >= 400 && status < 500) return false
  }
  return failureCount < 3
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: shouldRetry,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
