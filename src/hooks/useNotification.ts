import { toast } from "sonner"

export const useNotification = () => {
  return {
    success: (message: string, description?: string) =>
      toast.success(message, { description }),
    error: (message: string, description?: string) =>
      toast.error(message, { description }),
    info: (message: string, description?: string) =>
      toast(message, { description }),
    loading: (message: string) => toast.loading(message),
    dismiss: (toastId?: string | number) => toast.dismiss(toastId),
  }
}