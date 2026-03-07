/**
 * 背景色及配套字体颜色常量 - 极简主义风格
 *
 * 变量命名规范（对应 CSS 变量）：
 * - --bg-base: 基础背景色
 * - --text-primary: 主要文字色（标题、正文）
 * - --text-secondary: 次要文字色（说明、辅助信息）
 * - --text-disabled: 禁用态文字色
 * - --text-placeholder: 占位符文字色
 *
 * 与主题色协同：主题色 --theme-color 独立于背景风格，用于强调元素（按钮、链接等）
 */

export type BackgroundStyleType = 'light' | 'dark';

export interface BackgroundStylePreset {
  /** 唯一标识 */
  id: string;
  /** 展示名称 */
  name: string;
  /** 明暗类型 */
  type: BackgroundStyleType;
  /** 基础背景色 */
  bg: string;
  /** 主要文字色 */
  textPrimary: string;
  /** 次要文字色 */
  textSecondary: string;
  /** 禁用态文字色 */
  textDisabled: string;
  /** 占位符文字色 */
  textPlaceholder: string;
}

/**
 * 4 种背景风格预设
 * - 2 种浅色：明亮模式
 * - 2 种深色：暗黑模式
 * 所有颜色符合极简主义，避免鲜艳或浓重
 */
export const BACKGROUND_STYLES: readonly BackgroundStylePreset[] = [
  // 浅色风格
  {
    id: 'pureWhite',
    name: '纯白',
    type: 'light',
    bg: '#FFFFFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#64748B',
    textDisabled: '#94A3B8',
    textPlaceholder: '#CBD5E1',
  },
  {
    id: 'warmWhite',
    name: '暖白',
    type: 'light',
    bg: '#FAF9F6',
    textPrimary: '#1A1A1A',
    textSecondary: '#64748B',
    textDisabled: '#94A3B8',
    textPlaceholder: '#CBD5E1',
  },
  // 深色风格
  {
    id: 'darkGray',
    name: '深灰',
    type: 'dark',
    bg: '#2C2C2C',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textDisabled: '#64748B',
    textPlaceholder: '#475569',
  },
  {
    id: 'softBlack',
    name: '柔黑',
    type: 'dark',
    bg: '#1C1C1C',
    textPrimary: '#F1F5F9',
    textSecondary: '#94A3B8',
    textDisabled: '#64748B',
    textPlaceholder: '#475569',
  },
] as const;

/** 背景风格 id 联合类型 */
export type BackgroundStyleId = (typeof BACKGROUND_STYLES)[number]['id'];

/** 根据 id 获取背景风格预设 */
export function getBackgroundStyle(id: BackgroundStyleId): BackgroundStylePreset {
  const found = BACKGROUND_STYLES.find((s) => s.id === id);
  return found ?? BACKGROUND_STYLES[0];
}

/** 默认背景风格（纯白） */
export const DEFAULT_BACKGROUND_STYLE_ID: BackgroundStyleId = 'pureWhite';

/** 背景风格对应的 CSS 变量名映射 */
export const BACKGROUND_CSS_VARS = {
  bg: '--bg-base',
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  textDisabled: '--text-disabled',
  textPlaceholder: '--text-placeholder',
} as const;
