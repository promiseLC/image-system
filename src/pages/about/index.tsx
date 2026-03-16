import React from 'react';
import { Card } from 'antd';
import styles from './index.module.scss';

const About: React.FC = () => {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>系统信息</h1>
      <p className={styles.subtitle}>版本与运行环境</p>

      <Card className={styles.card} title="版本" variant="outlined">
        <div className={styles.section}>
          <p className={styles.sectionDesc}>图片管理系统 v1.0.0</p>
        </div>
      </Card>
    </div>
  );
};

export default About;
