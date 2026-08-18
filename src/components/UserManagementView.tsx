import React, { useState } from 'react';
import { 
  Card, Tabs, Table, Button, Space, Avatar, Select, 
  Input, Form, Modal, Typography, Tag, Alert, message, List 
} from 'antd';
import { 
  UserOutlined, UserDeleteOutlined, PlusOutlined, 
  SafetyCertificateOutlined
} from '@ant-design/icons';
import { useTaskFlow } from '../context/TaskFlowContext';
import type { Role } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

export const UserManagementView: React.FC = () => {
  const { 
    currentUser, users, addUser, removeUser, roles, addRole
  } = useTaskFlow();

  const [activeTab, setActiveTab] = useState('1');
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [userForm] = Form.useForm();
  
  const [newRoleName, setNewRoleName] = useState('');

  const isSuperAdmin = currentUser?.role === 'Super Admin';

  const handleAddUser = (values: { name: string; email: string; role: Role }) => {
    addUser(values.name, values.email, values.role);
    setUserModalVisible(false);
    userForm.resetFields();
    message.success(`User ${values.name} added successfully.`);
  };

  const handleRemoveUser = (userId: string) => {
    if (userId === currentUser?.id) {
      message.error('You cannot delete your own account while logged in!');
      return;
    }
    const u = users.find(user => user.id === userId);
    Modal.confirm({
      title: 'Remove User',
      content: `Are you sure you want to remove ${u?.name} from the organization?`,
      okText: 'Remove',
      okType: 'danger',
      onOk: () => {
        removeUser(userId);
        message.success('User removed successfully.');
      }
    });
  };

  const handleAddRole = () => {
    if (!newRoleName.trim()) return;
    if (roles.includes(newRoleName.trim())) {
      message.error('Role already exists!');
      return;
    }
    addRole(newRoleName.trim());
    setNewRoleName('');
    message.success(`Role "${newRoleName.trim()}" created successfully!`);
  };

  if (!isSuperAdmin) {
    return (
      <div className="view-container fade-in">
        <Alert
          message="Access Restricted"
          description="Only Super Admins can manage users and roles."
          type="error"
          showIcon
          style={{ marginTop: 24 }}
        />
      </div>
    );
  }

  return (
    <div className="view-container fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Users & Roles</Title>
        <Text type="secondary">Manage organization users and create custom roles.</Text>
      </div>

      <Card bordered={false}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* TAB 1: User Directory */}
          <Tabs.TabPane tab={<span><UserOutlined />User Management</span>} key="1">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>Organization Directory</Title>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setUserModalVisible(true)} className="gradient-btn">
                Add User
              </Button>
            </div>

            <Table 
              dataSource={users} 
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: 'User Profile',
                  key: 'profile',
                  render: (_, record) => (
                    <Space>
                      <Avatar src={record.avatarUrl} />
                      <div>
                        <strong>{record.name}</strong>
                        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>{record.email}</div>
                      </div>
                    </Space>
                  )
                },
                {
                  title: 'Role',
                  dataIndex: 'role',
                  render: (role: string) => {
                    let color = 'blue';
                    if (role === 'Super Admin') color = 'red';
                    else if (role === 'Project Manager') color = 'purple';
                    else if (role === 'Team Lead') color = 'orange';
                    else if (role === 'Tester') color = 'pink';
                    return <Tag color={color}>{role}</Tag>;
                  }
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, record) => (
                    <Button 
                      danger 
                      type="text" 
                      icon={<UserDeleteOutlined />} 
                      onClick={() => handleRemoveUser(record.id)}
                      disabled={record.id === currentUser?.id}
                    >
                      Remove
                    </Button>
                  )
                }
              ]}
            />
          </Tabs.TabPane>

          {/* TAB 2: Roles */}
          <Tabs.TabPane tab={<span><SafetyCertificateOutlined />Roles Configuration</span>} key="2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>System Roles</Title>
            </div>
            
            <div style={{ marginBottom: 24, display: 'flex', gap: 8, maxWidth: 400 }}>
              <Input 
                placeholder="New custom role name" 
                value={newRoleName}
                onChange={e => setNewRoleName(e.target.value)}
                onPressEnter={handleAddRole}
              />
              <Button type="primary" onClick={handleAddRole}>Create Role</Button>
            </div>

            <List
              bordered
              dataSource={roles}
              renderItem={role => (
                <List.Item>
                  <Text strong>{role}</Text>
                  {['Super Admin', 'Project Manager', 'Team Lead', 'Developer', 'Tester', 'Viewer'].includes(role) && (
                    <Tag color="default">System Default</Tag>
                  )}
                </List.Item>
              )}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* ADD USER MODAL */}
      <Modal
        title="Add Team Member"
        open={userModalVisible}
        onCancel={() => setUserModalVisible(false)}
        footer={null}
      >
        <Form form={userForm} layout="vertical" onFinish={handleAddUser}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please input full name!' }]}>
            <Input placeholder="e.g. John Doe" />
          </Form.Item>
          <Form.Item name="email" label="Email Address" rules={[{ required: true, message: 'Please input email!' }, { type: 'email', message: 'Input a valid email!' }]}>
            <Input placeholder="e.g. john@taskflow.io" />
          </Form.Item>
          <Form.Item name="role" label="System Role" rules={[{ required: true }]}>
            <Select placeholder="Select role">
              {roles.map(r => (
                <Option key={r} value={r}>{r}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', margin: 0 }}>
            <Space>
              <Button onClick={() => setUserModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Add User</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
