import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ThemeState {
  /** 主题色，如 primary、按钮等的主色 */
  themeColor: string;
  /** 背景色 */
  backgroundColor: string;
  /** 设置主题色 */
  setThemeColor: (color: string) => void;
  /** 设置背景色 */
  setBackgroundColor: (color: string) => void;
  /** 重置为默认值 */
  reset: () => void;
}

const DEFAULT_THEME_COLOR = '#1677ff'; // antd 默认蓝
const DEFAULT_BACKGROUND_COLOR = '#ffffff';

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeColor: DEFAULT_THEME_COLOR,
      backgroundColor: DEFAULT_BACKGROUND_COLOR,

      setThemeColor: (color) => set({ themeColor: color }),

      setBackgroundColor: (color) => set({ backgroundColor: color }),

      reset: () =>
        set({
          themeColor: DEFAULT_THEME_COLOR,
          backgroundColor: DEFAULT_BACKGROUND_COLOR,
        }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
