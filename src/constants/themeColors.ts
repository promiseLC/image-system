/**
 * 主题色常量 - 极简偏淡风格
 * 用于主题色切换（按钮、悬停、选中项、链接等强调性元素）
 */

export interface ThemeColorItem {
  /** 唯一标识，用于存储和引用 */
  id: string;
  /** 展示名称 */
  name: string;
  /** 色值（hex） */
  value: string;
}

/**
 * 8 种预设主题色，风格为极简偏淡、柔和舒适
 * 淡绿色为必选色
 */
export const THEME_COLORS: readonly ThemeColorItem[] = [
  { id: 'lightGreen', name: '淡绿', value: '#7DB87B' },
  { id: 'lightBlue', name: '淡蓝', value: '#6BA3D0' },
  { id: 'lightLavender', name: '淡紫', value: '#A698C9' },
  { id: 'lightPink', name: '淡粉', value: '#E8A4B8' },
  { id: 'lightOrange', name: '淡橙', value: '#E8B87C' },
  { id: 'lightCyan', name: '淡青', value: '#5EC4D6' },
  { id: 'softGray', name: '淡灰', value: '#8B9BA3' },
  { id: 'lightRose', name: '淡玫', value: '#D48BA8' },
] as const;

/** 主题色 id 联合类型 */
export type ThemeColorId = (typeof THEME_COLORS)[number]['id'];

/** 根据 id 获取主题色值 */
export function getThemeColorValue(id: ThemeColorId): string {
  const found = THEME_COLORS.find((c) => c.id === id);
  return found?.value ?? THEME_COLORS[0].value;
}

/** 默认主题色 id */
export const DEFAULT_THEME_COLOR_ID = 'lightGreen';
