import React, { useState } from 'react';
import { Card, Empty } from 'antd';
import styles from './index.module.scss';
import LazyImage from '@/components/LazyLoad/lazyImage';
import LazyLoad from '@/components/LazyLoad';

const Logs: React.FC = () => {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>操作日志</h1>
      <p className={styles.subtitle}>操作与审计记录</p>
      <Card className={styles.card} title="最近日志" variant="outlined">
        <Empty description="暂无操作记录" />
      </Card>

      <div ref={setRoot} id="scroll" className="w-[500px] h-[200px] border overflow-auto bg-amber-300">
        {Array.from({ length: 10 }).map((_, i) => (
          <LazyImage
            root={root}
            enabled={Boolean(root)}
            key={i}
            rootMargin="10px"
            placeholder="https://picsum.photos/seed/img1/400/300"
            fallback="xxx"
            src={`https://picsum.photos/seed/img${i * 100}/400/300`}
          />
        ))}
      </div>

      <LazyLoad placeholder="请稍后">
        <img src="https://picsum.photos/seed/img10/400/300" alt="" />
      </LazyLoad>

      {Array.from({ length: 10 }).map((_, i) => {
        return (
          <LazyImage
            placeholder="https://picsum.photos/seed/img1/400/300"
            key={i}
            fallback="xxx"
            src={`https://picsum.photos/seed/img${i * 100}/400/300`}
            rootMargin="10px"
          ></LazyImage>
        );
      })}
    </div>
  );
};

export default Logs;
