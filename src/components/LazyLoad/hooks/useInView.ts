import { useEffect, useRef, useState } from 'react';

export interface UseInViewOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
  enabled?: boolean;
  initialInView?: boolean;
}

const useInView = <T extends Element>(options?: UseInViewOptions) => {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    once = true,
    enabled = true,
    initialInView = false,
  } = options || {};

  const ref = useRef<T>(null);

  const [inView, setInView] = useState(initialInView);

  useEffect(() => {
    // 自定义滚动容器还没拿到 DOM 时,可以通过 enabled=false 避免先按浏览器视口监听。
    if (!enabled) return;

    const el = ref.current;

    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      /* eslint-disable-next-line react-hooks/set-state-in-effect */
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);

            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setInView(false);
          }
        });
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [root, rootMargin, threshold, once, enabled]);

  return [ref, inView] as const;
};

export default useInView;
