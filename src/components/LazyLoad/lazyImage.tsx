import { useState, type CSSProperties, type ImgHTMLAttributes } from 'react';
import useInView from './hooks/useInView';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  rootMargin?: string;
  src: string;
  placeholder?: string;
  fallback?: string;
  root?: Element | null;
  minHeight?: number | string;
  enabled?: boolean;
  wrapperStyle?: CSSProperties;
}

type Status = 'idle' | 'error';

interface ImageState {
  src: string;
  status: Status;
}

const LazyImage = ({
  src,
  alt = '',
  placeholder,
  fallback,
  rootMargin = '100px',
  root,
  style,
  minHeight = '300px',
  enabled = true,
  wrapperStyle,
  onLoad,
  onError,
  ...rest
}: LazyImageProps) => {
  const [ref, inView] = useInView<HTMLDivElement>({ root, rootMargin, once: true, enabled });
  const [imageState, setImageState] = useState<ImageState>({ src, status: 'idle' });

  // src 变化时自动回到 idle, 不需要额外 useEffect 重置状态。
  const status = imageState.src === src ? imageState.status : 'idle';
  const displaySrc = status === 'error' && fallback ? fallback : src;
  const currentMinHeight = typeof minHeight === 'string' ? minHeight : `${minHeight}px`;
  const placeholderNode = placeholder ? <img src={placeholder} alt="" style={style} /> : null;

  return (
    // 观察稳定的外层占位容器,避免 img 未加载时高度为 0 导致所有图片一次性命中。
    <div ref={ref} style={{ minHeight: currentMinHeight, ...wrapperStyle }}>
      {inView ? (
        <img
          src={displaySrc}
          alt={alt}
          style={style}
          {...rest}
          onLoad={onLoad}
          onError={(e) => {
            if (displaySrc === src) setImageState({ src, status: 'error' });
            onError?.(e);
          }}
        />
      ) : (
        placeholderNode
      )}
    </div>
  );
};

export default LazyImage;
