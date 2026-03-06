import { useState } from 'react';
import { Button, Modal, Form, Input, Select, Table, Pagination } from 'antd';
import { useThemeSync } from './hooks/useThemeSync';

function App() {
  useThemeSync();

  const [count, setCount] = useState(0);

  const [open, setOpen] = useState(false);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Password',
      dataIndex: 'password',
      key: 'password',
    },
    {
      title: 'Confirm Password',
      dataIndex: 'confirmPassword',
      key: 'confirmPassword',
    },
  ];

  return (
    <>
      <div>
        <h1>App</h1>
        <p className="text-red-500">This is a test app</p>
        <Button onClick={() => setOpen(true)} type="primary">
          Primary Button
        </Button>
        <Modal title="Basic Modal" open={open} onCancel={() => setOpen(false)}>
          <p>Some contents...</p>
          <p>Some contents...</p>
        </Modal>
        <Form>
          <Form.Item label="Name" name="name">
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input />
          </Form.Item>
          <Form.Item label="Password" name="password">
            <Input />
          </Form.Item>
          <Form.Item label="Confirm Password" name="confirmPassword">
            <Input />
          </Form.Item>
          <Form.Item>
            <Select
              options={[
                { label: '1', value: 1 },
                { label: '2', value: 2 },
                { label: '3', value: 3 },
              ]}
            ></Select>
          </Form.Item>
        </Form>
        <Table dataSource={[]} columns={columns} />
        <Pagination total={100} pageSize={10} current={1} />
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
    </>
  );
}

export default App;
