import React from 'react';
import { Form, Input, Button } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import styles from './index.module.scss';

interface LoginFormValues {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const [form] = Form.useForm<LoginFormValues>();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((s) => s.login);

  const onFinish = (values: LoginFormValues) => {
    // TODO: 接入真实登录 API，当前为演示用
    login(`${values.username}-token`, ['admin']);
    const from = searchParams.get('from') ?? '/';

    window.location.href = from;
  };

  return (
    <div className={styles.login}>
      <div className={styles.card}>
        <h1 className={styles.title}>登录</h1>
        <p className={styles.subtitle}>欢迎回来，请登录您的账户</p>

        <Form form={form} layout="vertical" size="large" onFinish={onFinish} className={styles.form}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input
              prefix={<UserOutlined className={styles.inputIcon} />}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password
              prefix={<LockOutlined className={styles.inputIcon} />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item className={styles.submitItem}>
            <Button type="primary" htmlType="submit" block size="large">
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;
