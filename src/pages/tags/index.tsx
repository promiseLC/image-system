import React from 'react';
import { Card, Empty } from 'antd';
import styles from './index.module.scss';

const Tags: React.FC = () => {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>标签管理</h1>
      <p className={styles.subtitle}>分类与检索图片标签</p>

      <Card className={styles.card} title="全部标签" variant="outlined">
        <Empty description="暂无标签，可在此添加标签" />
      </Card>
    </div>
  );
};

export default Tags;
