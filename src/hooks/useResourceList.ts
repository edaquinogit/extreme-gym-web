import { useEffect, useState } from 'react'
import { useApiError } from './useApiError'

type UseResourceListOptions<TData> = {
  load: () => Promise<TData[]>
}

export function useResourceList<TData>({ load }: UseResourceListOptions<TData>) {
  const [data, setData] = useState<TData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { getErrorMessage } = useApiError()

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        setIsLoading(true)
        setErrorMessage(null)
        const response = await load()

        if (isMounted) {
          setData(response)
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(getErrorMessage(error))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [getErrorMessage, load])

  return { data, errorMessage, isLoading }
}
