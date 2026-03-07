import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type ThemeColorId, DEFAULT_THEME_COLOR_ID } from '@/constants/themeColors';
import { DEFAULT_BACKGROUND_STYLE_ID, type BackgroundStyleId } from '@/constants/backgroundStyles';

interface ThemeState {
  /** 主题色 id，对应 THEME_COLORS */
  themeColorId: ThemeColorId;
  /** 背景风格 id，对应 BACKGROUND_STYLES */
  backgroundStyleId: BackgroundStyleId;
  /** 设置主题色 */
  setThemeColorId: (id: ThemeColorId) => void;
  /** 设置背景风格 */
  setBackgroundStyleId: (id: BackgroundStyleId) => void;
  /** 重置为默认值 */
  reset: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeColorId: DEFAULT_THEME_COLOR_ID,
      backgroundStyleId: DEFAULT_BACKGROUND_STYLE_ID,

      setThemeColorId: (id) => set({ themeColorId: id }),

      setBackgroundStyleId: (id) => set({ backgroundStyleId: id }),

      reset: () =>
        set({
          themeColorId: DEFAULT_THEME_COLOR_ID,
          backgroundStyleId: DEFAULT_BACKGROUND_STYLE_ID,
        }),
    }),
    { name: 'theme-storage' }
  )
);
