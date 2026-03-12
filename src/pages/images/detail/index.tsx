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
      <img src="https://res.aishinye.com/orthowb/static/20260129/f245990fc5ecb035eb4cca4b08bd4c74.jpg" alt="图片" />
      <Empty description="暂无图片详情" />
    </div>
  );
};

export default ImageDetail;
