import { useEffect } from 'react';
import { useThemeStore } from '../stores';
import { getThemeColorValue } from '@/constants/themeColors';
import { getBackgroundStyle, BACKGROUND_CSS_VARS } from '@/constants/backgroundStyles';

/**
 * 将 themeStore 中的主题色和背景风格同步到 CSS 变量，供全局使用
 *
 * 输出的 CSS 变量：
 * - --theme-color: 主题色（按钮、链接等强调元素）
 * - --bg-base: 基础背景色
 * - --text-primary: 主要文字色
 * - --text-secondary: 次要文字色
 * - --text-disabled: 禁用态文字色
 * - --text-placeholder: 占位符文字色
 */
export function useThemeSync() {
  const { themeColorId, backgroundStyleId } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    const bgStyle = getBackgroundStyle(backgroundStyleId);

    root.style.setProperty('--theme-color', getThemeColorValue(themeColorId));
    root.style.setProperty(BACKGROUND_CSS_VARS.bg, bgStyle.bg);
    root.style.setProperty(BACKGROUND_CSS_VARS.textPrimary, bgStyle.textPrimary);
    root.style.setProperty(BACKGROUND_CSS_VARS.textSecondary, bgStyle.textSecondary);
    root.style.setProperty(BACKGROUND_CSS_VARS.textDisabled, bgStyle.textDisabled);
    root.style.setProperty(BACKGROUND_CSS_VARS.textPlaceholder, bgStyle.textPlaceholder);
  }, [themeColorId, backgroundStyleId]);
}
