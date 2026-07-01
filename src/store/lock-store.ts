import { create } from "zustand";
import { persist } from "zustand/middleware";

interface LockState {
  pin: string | null;
  timeoutMinutes: number;
  isLocked: boolean;
  
  setPin: (pin: string | null) => void;
  setTimeoutMinutes: (minutes: number) => void;
  setLocked: (locked: boolean) => void;
  checkPin: (pin: string) => boolean;
}

export const useLockStore = create<LockState>()(
  persist(
    (set, get) => ({
      pin: null,
      timeoutMinutes: 5,
      isLocked: false, 

      setPin: (pin) => set({ pin }),
      setTimeoutMinutes: (minutes) => set({ timeoutMinutes: minutes }),
      
      setLocked: (locked) => {
        // Chỉ khóa nếu có cài mã PIN
        if (locked && !get().pin) return;
        set({ isLocked: locked });
      },

      checkPin: (inputPin) => {
        const { pin } = get();
        if (pin === inputPin) {
          set({ isLocked: false });
          return true;
        }
        return false;
      },
    }),
    {
      name: "chat-lock-storage",
    }
  )
);
