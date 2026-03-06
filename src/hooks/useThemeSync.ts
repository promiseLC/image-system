import { useEffect } from 'react';
import { useThemeStore } from '../stores';

/**
 * 将 themeStore 中的主题色和背景色同步到 CSS 变量，供全局使用
 */
export function useThemeSync() {
  const { themeColor, backgroundColor } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-color', themeColor);
    root.style.setProperty('--background-color', backgroundColor);
  }, [themeColor, backgroundColor]);
}
