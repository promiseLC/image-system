import React from 'react';
import { Card, Empty, Input } from 'antd';
import styles from './index.module.scss';

const Analytics: React.FC = () => {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>使用统计</h1>
      <p className={styles.subtitle}>流量与趋势分析</p>

      <Input placeholder="请输入搜索关键词" />
      <Card className={styles.card} title="数据概览" variant="outlined">
        <Empty description="暂无统计数据" />
      </Card>
    </div>
  );
};

export default Analytics;
