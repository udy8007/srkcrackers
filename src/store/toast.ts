import { create } from "zustand";

interface ToastState {
  message: string;
  visible: boolean;
  show: (message: string) => void;
  hide: () => void;
}

let hideTimer: ReturnType<typeof setTimeout> | undefined;

export const useToast = create<ToastState>((set) => ({
  message: "",
  visible: false,
  show: (message) => {
    set({ message, visible: true });
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => set({ visible: false }), 2600);
  },
  hide: () => set({ visible: false }),
}));
