import { reactive } from 'vue'

export type ToastType = 'info' | 'success' | 'error'

export interface Toast {
  id: number
  message: string
  type: ToastType
}

const toasts = reactive<Toast[]>([])
let counter = 0

export function dismissToast(id: number): void {
  const index = toasts.findIndex((t) => t.id === id)
  if (index >= 0) toasts.splice(index, 1)
}

export function pushToast(message: string, type: ToastType = 'info', timeout = 4000): number {
  const id = ++counter
  toasts.push({ id, message, type })
  if (timeout > 0) window.setTimeout(() => dismissToast(id), timeout)
  return id
}

export function useToasts() {
  return { toasts, pushToast, dismissToast }
}
