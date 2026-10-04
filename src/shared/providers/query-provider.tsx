"use client"

import { useState } from "react"
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"

const STALE_TIME_DEFAULT = 1000 * 60 * 5
const IDLE_SESSION_ERROR = "Сессия завершена из-за неактивности"

function isIdleSessionError(error: unknown) {
  return error instanceof Error && error.message === IDLE_SESSION_ERROR
}

function redirectOnIdleSessionError(error: unknown) {
  if (typeof window === "undefined") return
  if (!isIdleSessionError(error)) return
  window.location.assign("/login?reason=idle")
}

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: redirectOnIdleSessionError,
        }),
        mutationCache: new MutationCache({
          onError: redirectOnIdleSessionError,
        }),
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME_DEFAULT,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (isIdleSessionError(error)) return false
              return failureCount < 1
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
