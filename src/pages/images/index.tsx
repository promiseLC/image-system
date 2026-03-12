import React from 'react';
import { Button, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.scss';

const ImageList: React.FC = () => {
  const navigate = useNavigate();
  const handleDetail = (id: string) => {
    navigate(`/images/detail/${id}`);
  };
  return (
    <div className={styles.imageList}>
      <h1 className={styles.title}>图片列表</h1>
      <Button type="primary" onClick={() => handleDetail('1')}>
        查看图片详情
      </Button>
      <p className={styles.subtitle}>管理与浏览您的图片素材</p>
      <Empty description="暂无图片" className={styles.empty} />
    </div>
  );
};

export default ImageList;
