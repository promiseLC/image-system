import { useEffect } from 'react';
import { useOutlet } from 'react-router-dom';
import { useRouteAnimation } from '@/router/hooks/useRouteAnimation';
import styles from './index.module.scss';

const ANIMATION_MAP = {
  fade: { old: 'vt-fade-out', new: 'vt-fade-in' },
  'slide-left': { old: 'vt-slide-out-right', new: 'vt-slide-in-left' },
  'slide-right': { old: 'vt-slide-out-left', new: 'vt-slide-in-right' },
  zoom: { old: 'vt-zoom-out', new: 'vt-zoom-in' },
} as const;

/**
 * 带 View Transitions 的 Outlet
 * 根据 handle.animation 设置 view-transition-name 与 CSS 变量，配合全局样式实现路由切换动画
 * 支持 children：用于 KeepAlive 场景，传入 outlet 元素以保留动画同时支持缓存
 */
export function AnimatedOutlet({ children }: { children?: React.ReactNode }) {
  const animation = useRouteAnimation();
  const outlet = useOutlet();
  const content = children ?? outlet;

  useEffect(() => {
    if (animation.type === 'none') return;
    const type = animation.type ?? 'fade';
    const { old: oldName, new: newName } = ANIMATION_MAP[type] ?? ANIMATION_MAP.fade;
    const el = document.documentElement;
    el.style.setProperty('--vt-duration', `${animation.duration}ms`);
    el.style.setProperty('--vt-old-animation', oldName);
    el.style.setProperty('--vt-new-animation', newName);
    return () => {
      el.style.removeProperty('--vt-duration');
      el.style.removeProperty('--vt-old-animation');
      el.style.removeProperty('--vt-new-animation');
    };
  }, [animation.type, animation.duration]);

  if (animation.type === 'none') {
    return content;
  }

  return <div className={styles.wrapper}>{content}</div>;
}
