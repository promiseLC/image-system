// 图片详情页面
import React from 'react';
import { useParams } from 'react-router-dom';
import { Empty } from 'antd';

const ImageDetail: React.FC = () => {
  const { id } = useParams();

  return (
    <div>
      <h1>图片详情: {id}</h1>
      <p>查看图片详情</p>
      <img src={`https://picsum.photos/seed/img${id}/800/300`} alt="detail_image" />
      <Empty description="暂无图片详情" />
    </div>
  );
};

export default ImageDetail;
