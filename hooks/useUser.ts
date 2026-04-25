import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useUser() {
  const { data, error, isLoading } = useSWR('/api/auth/me', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })
  return {
    user: data as { id: string; name: string; username: string } | undefined,
    loading: isLoading,
    error,
  }
}
