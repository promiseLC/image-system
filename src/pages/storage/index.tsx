import React from 'react';
import { Card, Progress } from 'antd';
import styles from './index.module.scss';

const Storage: React.FC = () => {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>存储管理</h1>
      <p className={styles.subtitle}>查看存储空间与用量</p>

      <Card className={styles.card} title="存储概览" variant="outlined">
        <div className={styles.progressWrap}>
          <span className={styles.label}>已用 2.4GB / 10GB</span>
          <Progress percent={24} showInfo={false} strokeColor="var(--theme-color)" />
        </div>
      </Card>
    </div>
  );
};

export default Storage;
