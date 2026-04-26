'use client'
import { SWRConfig } from 'swr'

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={{
      keepPreviousData: true,
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }}>
      {children}
    </SWRConfig>
  )
}
