import React from 'react';
import { Card, Col, Row, Statistic, Progress, Table, Timeline, Tag, Avatar, Space, Typography, Select, message } from 'antd';
import { 
  UserOutlined, MailOutlined, SafetyOutlined, 
  HourglassOutlined, CheckSquareOutlined, HistoryOutlined 
} from '@ant-design/icons';
import { useTaskFlow } from '../context/TaskFlowContext';
import type { Issue } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const ProfileView: React.FC = () => {
  const { 
    currentUser, issues, worklogs, activityLogs, projects, updateIssue 
  } = useTaskFlow();

  if (!currentUser) return null;

  // 1. Calculate Statistics
  // Filter issues assigned to this user
  const userIssues = issues.filter(i => i.assignee_id === currentUser.id);
  const totalAssigned = userIssues.length;
  const completedIssues = userIssues.filter(i => i.status === 'Done').length;
  const openIssuesCount = totalAssigned - completedIssues;
  
  const completionRate = totalAssigned > 0 ? Math.round((completedIssues / totalAssigned) * 100) : 0;

  // Calculate total hours logged by this user
  const userWorklogs = worklogs.filter(w => w.user_id === currentUser.id);
  const totalHoursLogged = userWorklogs.reduce((sum, w) => sum + w.time_spent, 0);

  // 2. Activity Feed (Filtered by current user)
  const userActivity = activityLogs.filter(log => log.user_id === currentUser.id);

  // Find project by id utility
  const getProjectName = (projId: string) => {
    const p = projects.find(proj => proj.id === projId);
    return p ? p.name : 'Unknown Project';
  };

  const handleStatusChange = (issueId: string, status: string) => {
    updateIssue(issueId, { status });
    message.success('Task status updated successfully.');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Highest': return '#ff4d4f';
      case 'High': return '#ff7a45';
      case 'Medium': return '#faad14';
      case 'Low': return '#bae637';
      case 'Lowest': return '#73d13d';
      default: return '#d9d9d9';
    }
  };

  return (
    <div className="view-container fade-in">
      {/* Header Profile Summary */}
      <Card 
        bordered={false} 
        bodyStyle={{ padding: 24 }}
        style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 24 }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={6} md={4} style={{ textAlign: 'center' }}>
            <Avatar 
              size={96} 
              src={currentUser.avatarUrl} 
              icon={<UserOutlined />} 
              style={{ border: '3px solid #1677ff', padding: 2 }}
            />
          </Col>
          <Col xs={24} sm={18} md={20}>
            <Title level={2} style={{ margin: 0, fontWeight: 700 }}>{currentUser.name}</Title>
            <Paragraph type="secondary" style={{ fontSize: 14, margin: '4px 0 16px 0' }}>
              Member of Organization Dashboard
            </Paragraph>
            
            <Space size="large" wrap>
              <Text><MailOutlined style={{ marginRight: 6 }} /> {currentUser.email}</Text>
              <Text>
                <SafetyOutlined style={{ marginRight: 6, color: '#1677ff' }} /> 
                System Role: <Tag color="blue" style={{ marginLeft: 4 }}>{currentUser.role}</Tag>
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Left Column: Stats & Tasks List */}
        <Col xs={24} lg={16}>
          {/* Statistics Grid */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={12} sm={6}>
              <Card size="small" bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <Statistic 
                  title="Assigned Tasks" 
                  value={totalAssigned} 
                  prefix={<CheckSquareOutlined style={{ color: '#1677ff', marginRight: 6 }} />} 
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <Statistic 
                  title="Completed Tasks" 
                  value={completedIssues} 
                  prefix={<CheckSquareOutlined style={{ color: '#52c41a', marginRight: 6 }} />} 
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <Statistic 
                  title="Open Tasks" 
                  value={openIssuesCount} 
                  prefix={<HourglassOutlined style={{ color: '#faad14', marginRight: 6 }} />} 
                />
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <Statistic 
                  title="Total Hours Logged" 
                  value={`${totalHoursLogged.toFixed(1)}h`} 
                  prefix={<HourglassOutlined style={{ color: '#722ed1', marginRight: 6 }} />} 
                />
              </Card>
            </Col>
          </Row>

          {/* Completion Rate Chart */}
          <Card 
            title="Assigned Task Completion Rate" 
            bordered={false} 
            style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 24 }}
          >
            <Row align="middle" gutter={24}>
              <Col xs={24} sm={8} style={{ textAlign: 'center', padding: '12px 0' }}>
                <Progress 
                  type="circle" 
                  percent={completionRate} 
                  strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                  width={110}
                />
              </Col>
              <Col xs={24} sm={16}>
                <Paragraph type="secondary">
                  This rate tracks the percentage of assigned issues across Scrum and Kanban projects that are marked as <strong>Done</strong>. Keep locking timesheets and moving tickets to close work!
                </Paragraph>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Completed</Text>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{completedIssues} Tasks</div>
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>Outstanding</Text>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#faad14' }}>{openIssuesCount} Tasks</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Assigned Tasks Table */}
          <Card 
            title="My Active Work Items" 
            bordered={false} 
            style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
          >
            <Table 
              dataSource={userIssues.filter(i => i.status !== 'Done')}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
              columns={[
                {
                  title: 'Key',
                  dataIndex: 'key',
                  key: 'key',
                  render: (key) => <Tag color="blue">{key}</Tag>
                },
                {
                  title: 'Title',
                  dataIndex: 'title',
                  key: 'title',
                  render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>
                },
                {
                  title: 'Project',
                  dataIndex: 'project_id',
                  key: 'project',
                  render: (id) => <Tag color="purple">{getProjectName(id)}</Tag>
                },
                {
                  title: 'Priority',
                  dataIndex: 'priority',
                  key: 'priority',
                  render: (priority) => <Tag color={getPriorityColor(priority)}>{priority}</Tag>
                },
                {
                  title: 'Status',
                  key: 'status',
                  render: (_, record: Issue) => (
                    <Select 
                      size="small" 
                      value={record.status} 
                      onChange={(val) => handleStatusChange(record.id, val)}
                      style={{ width: 120 }}
                    >
                      <Option value="To Do">To Do</Option>
                      <Option value="In Progress">In Progress</Option>
                      <Option value="In Review">In Review</Option>
                      <Option value="Done">Done</Option>
                    </Select>
                  )
                }
              ]}
              locale={{ emptyText: 'No pending assigned tasks! Enjoy your free backlog.' }}
            />
          </Card>
        </Col>

        {/* Right Column: Activity Feed */}
        <Col xs={24} lg={8}>
          <Card 
            title={<span><HistoryOutlined style={{ marginRight: 8 }} />Recent Activity Feed</span>}
            bordered={false}
            style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', height: '100%' }}
          >
            {userActivity.length > 0 ? (
              <Timeline mode="left" style={{ marginTop: 16 }}>
                {userActivity.slice(-8).reverse().map((log) => {
                  const issue = issues.find(i => i.id === log.issue_id);
                  return (
                    <Timeline.Item key={log.id}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)', marginBottom: 2 }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        <span style={{ fontSize: 12 }}>
                          You {log.action}
                          {issue && (
                            <span style={{ marginLeft: 4 }}>
                              in <Tag color="blue" style={{ fontSize: 10 }}>{issue.key}</Tag>
                            </span>
                          )}
                        </span>
                      </div>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <HistoryOutlined style={{ fontSize: 32, color: 'rgba(0,0,0,0.15)', marginBottom: 12 }} />
                <Text type="secondary">No recent activity logged for you.</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
