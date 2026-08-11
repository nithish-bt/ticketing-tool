import React, { useState } from 'react';
import { 
  Card, Col, Row, Progress, Button, Avatar, Tooltip, 
  Tag, Typography, Modal, Table, Select, Space, Form, message, Divider 
} from 'antd';
import { 
  ProjectOutlined, RocketOutlined, ClockCircleOutlined, 
  PlusOutlined, UserDeleteOutlined, TeamOutlined, EnterOutlined 
} from '@ant-design/icons';
import { useTaskFlow } from '../context/TaskFlowContext';
import type { Role, User } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const ProjectsView: React.FC = () => {
  const { 
    projects, issues, projectMembers, users, currentUser,
    setCurrentProject, setView, addProjectMember, removeProjectMember 
  } = useTaskFlow();

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [activeProjId, setActiveProjId] = useState<string | null>(null);
  const [memberForm] = Form.useForm();

  const isAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Project Manager';

  // Helper: Get project completion stats
  const getProjectStats = (projId: string) => {
    const projIssues = issues.filter(i => i.project_id === projId && !i.key.includes('-SUB-'));
    const total = projIssues.length;
    const done = projIssues.filter(i => i.status === 'Done').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  };

  // Helper: Get project members
  const getProjectMembersList = (projId: string) => {
    const pm = projectMembers.filter(m => m.project_id === projId);
    return pm.map(m => {
      const u = users.find(user => user.id === m.user_id);
      return u ? { ...u, projectRole: m.role } : null;
    }).filter(Boolean) as (User & { projectRole: Role })[];
  };

  const handleEnterProject = (projId: string) => {
    const proj = projects.find(p => p.id === projId);
    if (proj) {
      setCurrentProject(proj);
      if (proj.type === 'Timesheet') {
        setView('Timesheet');
      } else {
        setView('Dashboard');
      }
      message.success(`Entered project: ${proj.name}`);
    }
  };

  const handleManageMembers = (projId: string) => {
    setActiveProjId(projId);
    setIsMemberModalOpen(true);
  };

  const handleAddMemberSubmit = (values: { userId: string; role: Role }) => {
    if (activeProjId) {
      addProjectMember(activeProjId, values.userId, values.role);
      memberForm.resetFields();
      message.success('Member added successfully.');
    }
  };

  const handleRemoveMember = (userId: string) => {
    if (activeProjId) {
      if (userId === currentUser?.id) {
        message.error('You cannot remove yourself from the project!');
        return;
      }
      removeProjectMember(activeProjId, userId);
      message.success('Member removed successfully.');
    }
  };

  const currentProj = projects.find(p => p.id === activeProjId);
  const currentMembers = activeProjId ? getProjectMembersList(activeProjId) : [];
  // Filter users not already in the project
  const nonMembers = users.filter(u => 
    !currentMembers.some(m => m.id === u.id)
  );

  return (
    <div className="view-container fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Project Directory</Title>
        <Text type="secondary">Explore organizational projects, view completion rates, and manage workspace membership.</Text>
      </div>

      <Row gutter={[16, 16]}>
        {projects.map(proj => {
          const { total, done, pct } = getProjectStats(proj.id);
          const members = getProjectMembersList(proj.id);
          
          return (
            <Col xs={24} md={12} lg={8} key={proj.id}>
              <Card 
                bordered={false} 
                className="dashboard-subcard" 
                style={{ 
                  borderRadius: 12, 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                title={
                  <Space>
                    {proj.type === 'Scrum' ? (
                      <RocketOutlined style={{ color: '#1677ff' }} />
                    ) : proj.type === 'Kanban' ? (
                      <ProjectOutlined style={{ color: '#52c41a' }} />
                    ) : (
                      <ClockCircleOutlined style={{ color: '#faad14' }} />
                    )}
                    <span style={{ fontWeight: 600 }}>{proj.name}</span>
                  </Space>
                }
                extra={<Tag color="blue">{proj.key}</Tag>}
              >
                <div style={{ minHeight: 70, marginBottom: 16 }}>
                  <Paragraph type="secondary" style={{ fontSize: 13, height: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {proj.description || 'No description provided.'}
                  </Paragraph>
                  <Tag color={proj.type === 'Scrum' ? 'geekblue' : proj.type === 'Kanban' ? 'green' : 'gold'}>
                    {proj.type} Project
                  </Tag>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                    <Text type="secondary">Project Completion</Text>
                    <Text style={{ fontWeight: 600 }}>{pct}% ({done}/{total} done)</Text>
                  </div>
                  <Progress percent={pct} size="small" strokeColor={pct === 100 ? '#52c41a' : '#1677ff'} />
                </div>

                {/* Team Members List */}
                <div style={{ marginBottom: 20 }}>
                  <Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 8 }}>
                    Project Team ({members.length})
                  </Text>
                  <Avatar.Group maxCount={5} size="medium">
                    {members.map(member => (
                      <Tooltip key={member.id} title={`${member.name} (${member.projectRole})`}>
                        <Avatar src={member.avatarUrl} />
                      </Tooltip>
                    ))}
                  </Avatar.Group>
                </div>

                <Divider style={{ margin: '12px 0' }} />

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  {isAdmin && (
                    <Button 
                      type="default" 
                      icon={<TeamOutlined />} 
                      onClick={() => handleManageMembers(proj.id)}
                    >
                      Team
                    </Button>
                  )}
                  <Button 
                    type="primary" 
                    icon={<EnterOutlined />} 
                    onClick={() => handleEnterProject(proj.id)}
                    className="gradient-btn"
                  >
                    Enter Project
                  </Button>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* MANAGE MEMBERS MODAL */}
      <Modal
        title={<span><TeamOutlined style={{ marginRight: 8 }} />Manage Team Members — {currentProj?.name}</span>}
        open={isMemberModalOpen}
        onCancel={() => { setIsMemberModalOpen(false); setActiveProjId(null); }}
        footer={null}
        width={550}
      >
        <div style={{ marginBottom: 24, marginTop: 16 }}>
          <Title level={5}>Add Team Member</Title>
          <Form form={memberForm} layout="inline" onFinish={handleAddMemberSubmit}>
            <Form.Item name="userId" rules={[{ required: true, message: 'Select user!' }]} style={{ width: 220, marginRight: 8 }}>
              <Select placeholder="Select team member">
                {nonMembers.map(u => (
                  <Option key={u.id} value={u.id}>{u.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="role" rules={[{ required: true }]} initialValue="Developer" style={{ width: 150, marginRight: 8 }}>
              <Select placeholder="Role">
                <Option value="Developer">Developer</Option>
                <Option value="Team Lead">Team Lead</Option>
                <Option value="Project Manager">Project Manager</Option>
                <Option value="Viewer">Viewer</Option>
              </Select>
            </Form.Item>
            <Form.Item style={{ marginRight: 0 }}>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />} className="gradient-btn">
                Add
              </Button>
            </Form.Item>
          </Form>
        </div>

        <Title level={5}>Current Members Directory</Title>
        <Table 
          dataSource={currentMembers}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Member',
              key: 'member',
              render: (_, record) => (
                <Space>
                  <Avatar src={record.avatarUrl} size="small" />
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{record.name}</span>
                    <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)' }}>{record.email}</div>
                  </div>
                </Space>
              )
            },
            {
              title: 'Project Role',
              dataIndex: 'projectRole',
              key: 'role',
              render: (role) => <Tag color="blue">{role}</Tag>
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Button 
                  danger 
                  type="text" 
                  size="small"
                  icon={<UserDeleteOutlined />} 
                  onClick={() => handleRemoveMember(record.id)}
                  disabled={record.id === currentUser?.id}
                >
                  Remove
                </Button>
              )
            }
          ]}
        />
      </Modal>
    </div>
  );
};
