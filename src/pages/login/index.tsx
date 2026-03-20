import React, { useMemo, useState } from 'react';
import { Alert, Button, Checkbox, Form, Input } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './index.module.scss';
import { login } from '@/apis/auth';
import { useAuthStore } from '@/stores/authStore';

interface LoginFormValues {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const [form] = Form.useForm<LoginFormValues>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const authLogin = useAuthStore((s) => s.login);
  const [rememberMe, setRememberMe] = useState(true);

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: login,
    onSuccess: ({ token, user }) => {
      authLogin(token, [...user.roles], [...user.permissions]);
      queryClient.setQueryData(['user', 'me'], user);

      const from = searchParams.get('from') ?? '/';

      // 重定向到 from 页面 使用navigate会导致路由缓存,这样能保证拿到最新的数据
      window.location.href = from;
    },
  });

  const errorMessage = useMemo(() => {
    if (!isError) return '';
    if (error instanceof Error) return error.message;
    return '登录失败，请稍后重试';
  }, [error, isError]);

  const onFinish = (values: LoginFormValues) => {
    mutate(values);
  };

  return (
    <div className={styles.login}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrap} aria-hidden="true">
            <LockOutlined className={styles.headerIcon} />
          </div>
          <h1 className={styles.title}>登录</h1>
          <p className={styles.subtitle}>欢迎回来，请登录您的账户（演示：admin / 123456）</p>
        </div>

        {isError && (
          <div className={styles.alertWrap}>
            <Alert type="error" showIcon message="登录失败" description={errorMessage} />
          </div>
        )}

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
            <Button type="primary" htmlType="submit" block size="large" loading={isPending}>
              登录
            </Button>
          </Form.Item>

          <div className={styles.rememberRow}>
            <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}>
              记住我
            </Checkbox>
          </div>
        </Form>

        <div className={styles.bottomLinks}>
          <a
            className={styles.link}
            href="#"
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            忘记密码？
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
