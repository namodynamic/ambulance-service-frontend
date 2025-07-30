import { useCallback } from "react"
import { toast } from "sonner"

export const useNotification = () => {
  const success = useCallback((message: string, description?: string) => {
    toast.success(message, { description })
  }, [])

  const error = useCallback((message: string, description?: string) => {
    toast.error(message, {
      description,
      classNames: {
        title: "!text-red-600 !dark:text-red-500",
        description: "!text-red-600/90 !dark:text-red-500/90",
      },
    })
  }, [])

  const info = useCallback((message: string, description?: string) => {
    toast(message, { description })
  }, [])

  const loading = useCallback((message: string) => toast.loading(message), [])

  const dismiss = useCallback((toastId?: string | number) => toast.dismiss(toastId), [])

  return {
    success,
    error,
    info,
    loading,
    dismiss,
  }
}