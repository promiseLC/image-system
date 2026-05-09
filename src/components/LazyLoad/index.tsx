import { type ReactNode } from 'react';
import useInView, { type UseInViewOptions } from './hooks/useInView';

interface LazyLoadProps extends UseInViewOptions {
  className?: string;
  children: ReactNode;
  placeholder?: ReactNode;
  minHeight?: number | string;
}

const LazyLoad = ({ children, className, placeholder = null, minHeight = 1, ...observerOptions }: LazyLoadProps) => {
  const [ref, visible] = useInView<HTMLDivElement>({ ...observerOptions });

  const currentHeight = typeof minHeight === 'string' ? minHeight : `${minHeight}px`;

  return (
    // <div ref={ref}>
    //   {
    //     Array.from({ length: 10 }).map((_, i) => {
    //       return <img key={i} src={`https://picsum.photos/seed/img${i + 1}/400/300`} alt="" />
    //     })
    //   }
    // </div>
    <div ref={ref} className={className} style={{ minHeight: currentHeight }}>
      {visible ? children : placeholder}
    </div>
  );
};

export default LazyLoad;
