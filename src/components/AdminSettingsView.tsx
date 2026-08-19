import React, { useState } from 'react';
import { 
  Card, Tabs, Table, Button, Space, Select, 
  Input, Form, Modal, Typography, Tag, InputNumber, 
  Alert, message, List 
} from 'antd';
import { 
  PlusOutlined, 
  SettingOutlined, SaveOutlined, SafetyCertificateOutlined,
  CloseOutlined, AuditOutlined, ProjectOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useTaskFlow } from '../context/TaskFlowContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const AdminSettingsView: React.FC = () => {
  const { 
    currentUser, users, currentProject, workflows, 
    updateWorkflowColumns, activityLogs,
    projects, createProject, deleteProject
  } = useTaskFlow();

  const [activeTab, setActiveTab] = useState('2');
  const [activeTab, setActiveTab] = useState(currentUser?.role === 'Super Admin' ? '1' : '2');
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [userForm] = Form.useForm();
  
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [projectForm] = Form.useForm();

  // Load columns state for custom workflows
  const currentWorkflow = workflows.find(w => w.projectId === currentProject?.id) || { columns: [] };
  const [columns, setColumns] = useState(() => [...currentWorkflow.columns]);

  // Sync columns if project workflow changes
  React.useEffect(() => {
    setColumns([...currentWorkflow.columns]);
  }, [currentProject, workflows]);

  // Access Control check
  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const isProjectAdmin = currentUser?.role === 'Project Manager' || currentUser?.role === 'Super Admin';

  const handleCreateProject = (values: { name: string; key: string; description: string; type: 'Scrum' | 'Kanban' | 'Timesheet' }) => {
    createProject(values.name, values.key, values.description, values.type);
    setProjectModalVisible(false);
    projectForm.resetFields();
    message.success(`Project "${values.name}" created successfully.`);
  };

  const handleDeleteProject = (projectId: string) => {
    const proj = projects.find(p => p.id === projectId);
    Modal.confirm({
      title: 'Delete Project',
      content: `Are you sure you want to delete "${proj?.name}"? All associated tasks, sprints, epics, and work logs will be permanently deleted!`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        deleteProject(projectId);
        message.success('Project deleted successfully.');
      }
    });
  };

  // Workflow customizer helpers
  const handleWipLimitChange = (index: number, val: number | null) => {
    const nextCols = [...columns];
    nextCols[index].wipLimit = val;
    setColumns(nextCols);
  };

  const handleAddColumn = (colName: string) => {
    if (!colName.trim()) return;
    if (columns.some(c => c.status.toLowerCase() === colName.toLowerCase())) {
      message.error('Column status already exists!');
      return;
    }
    setColumns([...columns, { status: colName, wipLimit: null }]);
  };

  const handleRemoveColumn = (index: number) => {
    const colToRemove = columns[index].status;
    if (colToRemove === 'Done') {
      message.error('A single terminal "Done" column is required for workflows.');
      return;
    }
    const nextCols = columns.filter((_, idx) => idx !== index);
    setColumns(nextCols);
  };

  const handleSaveWorkflow = () => {
    if (!currentProject) return;
    updateWorkflowColumns(currentProject.id, columns);
    message.success('Workflow board columns updated successfully!');
  };

  const [newColName, setNewColName] = useState('');

  if (!isProjectAdmin) {
    return (
      <div className="view-container fade-in">
        <Alert
          message="Access Restricted"
          description="You must be an administrator or project manager to view and configure organization settings."
          type="warning"
          showIcon
          style={{ marginTop: 24 }}
        />
      </div>
    );
  }

  return (
    <div className="view-container fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Administration & Settings</Title>
        <Text type="secondary">Manage user roles, configure workflow columns, and check administrative audit logs.</Text>
      </div>

      <Card bordered={false}>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* TAB 1: User Directory */}
          {isSuperAdmin && (
            <Tabs.TabPane tab={<span><UserOutlined />User Management</span>} key="1">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>Organization Directory</Title>
              {isSuperAdmin && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setUserModalVisible(true)} className="gradient-btn">
                  Add User
                </Button>
              )}
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
                  render: (role: Role) => {
                    let color = 'blue';
                    if (role === 'Super Admin') color = 'red';
                    else if (role === 'Project Manager') color = 'purple';
                    else if (role === 'Team Lead') color = 'orange';
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
                      disabled={!isSuperAdmin || record.id === currentUser?.id}
                    >
                      Remove
                    </Button>
                  )
                }
              ]}
            />
          </Tabs.TabPane>
          )}

          {/* TAB 2: Board Workflow customization */}
          <Tabs.TabPane tab={<span><SettingOutlined />Board Workflow Columns</span>} key="2">
            <div style={{ marginBottom: 20 }}>
              <Title level={4} style={{ margin: 0 }}>Custom Board Status Columns</Title>
              <Paragraph type="secondary">
                Add, remove, or modify columns representing task statuses on the active board for <strong>{currentProject?.name}</strong>.
              </Paragraph>
            </div>

            <div style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                {columns.map((col, index) => (
                  <Card 
                    key={col.status} 
                    size="small" 
                    style={{ width: 180, position: 'relative', border: '1px solid #d9d9d9', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                    title={<strong>{col.status}</strong>}
                    extra={
                      col.status !== 'Done' ? (
                        <CloseOutlined 
                          style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 12 }} 
                          onClick={() => handleRemoveColumn(index)} 
                        />
                      ) : null
                    }
                  >
                    <div style={{ fontSize: 11, marginBottom: 8, color: 'rgba(0,0,0,0.45)' }}>WIP Limit</div>
                    <InputNumber 
                      min={1} 
                      value={col.wipLimit} 
                      onChange={(val) => handleWipLimitChange(index, val)}
                      placeholder="None"
                      style={{ width: '100%' }}
                    />
                  </Card>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, maxWidth: 400 }}>
                <Input 
                  placeholder="New column status name" 
                  value={newColName} 
                  onChange={(e) => setNewColName(e.target.value)} 
                />
                <Button 
                  icon={<PlusOutlined />} 
                  onClick={() => { handleAddColumn(newColName); setNewColName(''); }}
                >
                  Add Status
                </Button>
              </div>
            </div>

            <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveWorkflow} className="gradient-btn">
              Save Workflow Changes
            </Button>
          </Tabs.TabPane>

          {/* TAB 3: Admin Audit Logs */}
          <Tabs.TabPane tab={<span><AuditOutlined />System Audit Log</span>} key="3">
            <div style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>System Logs</Title>
              <Text type="secondary">Audit trail of critical administrative changes and updates in the organization.</Text>
            </div>
            
            <List
              dataSource={activityLogs.filter(log => log.issue_id === 'system')}
              renderItem={(log) => {
                const actor = users.find(u => u.id === log.user_id);
                return (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<SafetyCertificateOutlined style={{ color: '#52c41a', fontSize: 18 }} />}
                      title={<span><strong>{actor?.name || 'Administrator'}</strong> {log.action}</span>}
                      description={<Text type="secondary" style={{ fontSize: 11 }}>{new Date(log.timestamp).toLocaleString()}</Text>}
                    />
                  </List.Item>
                );
              }}
              locale={{ emptyText: <Text type="secondary">No administrative actions logged yet.</Text> }}
            />
          </Tabs.TabPane>

          {/* TAB 4: Project Management */}
          <Tabs.TabPane tab={<span><ProjectOutlined />Project Management</span>} key="4">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4} style={{ margin: 0 }}>Project Directory</Title>
              {isSuperAdmin && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setProjectModalVisible(true)} className="gradient-btn">
                  Create Project
                </Button>
              )}
            </div>

            <Table 
              dataSource={projects} 
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: 'Project Name',
                  dataIndex: 'name',
                  key: 'name',
                  render: (text, record) => (
                    <div>
                      <strong>{text}</strong>
                      <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>{record.description}</div>
                    </div>
                  )
                },
                {
                  title: 'Key',
                  dataIndex: 'key',
                  key: 'key',
                  render: (key) => <Tag color="blue">{key}</Tag>
                },
                {
                  title: 'Type',
                  dataIndex: 'type',
                  key: 'type',
                  render: (type) => {
                    let color = 'geekblue';
                    if (type === 'Kanban') color = 'green';
                    else if (type === 'Timesheet') color = 'gold';
                    return <Tag color={color}>{type}</Tag>;
                  }
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, record) => (
                    <Button 
                      danger 
                      type="text" 
                      icon={<DeleteOutlined />} 
                      onClick={() => handleDeleteProject(record.id)}
                      disabled={!isSuperAdmin || projects.length <= 1}
                    >
                      Delete
                    </Button>
                  )
                }
              ]}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* CREATE PROJECT MODAL */}
      <Modal
        title="Create New Project"
        open={projectModalVisible}
        onCancel={() => setProjectModalVisible(false)}
        footer={null}
      >
        <Form form={projectForm} layout="vertical" onFinish={handleCreateProject}>
          <Form.Item name="name" label="Project Name" rules={[{ required: true, message: 'Please input project name!' }]}>
            <Input placeholder="e.g. Client Billing App" />
          </Form.Item>
          <Form.Item name="key" label="Project Key" rules={[{ required: true, message: 'Please input project key!' }, { max: 10, message: 'Key must be 10 characters or less!' }]}>
            <Input placeholder="e.g. BILL" style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="type" label="Project Type" rules={[{ required: true }]} initialValue="Timesheet">
            <Select>
              <Option value="Scrum">Scrum (Sprints & Backlogs)</Option>
              <Option value="Kanban">Kanban (Continuous Flow)</Option>
              <Option value="Timesheet">Timesheet (Weekly Work Tracking)</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Describe the goal and scope of this project..." rows={3} />
          </Form.Item>
          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', margin: 0 }}>
            <Space>
              <Button onClick={() => setProjectModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create Project</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
