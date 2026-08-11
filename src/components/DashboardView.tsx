import React, { useState } from 'react';
import { Card, Col, Row, Statistic, Progress, Timeline, Avatar, List, Tag, Badge, Empty, Typography, Button, Drawer, Divider } from 'antd';
import { 
  ProjectOutlined, CheckCircleOutlined, InfoCircleOutlined,
  CalendarOutlined, FileTextOutlined, BellOutlined, HistoryOutlined
} from '@ant-design/icons';
import { useTaskFlow } from '../context/TaskFlowContext';
import type { Issue, User } from '../types';

const { Title, Text, Paragraph } = Typography;

export const DashboardView: React.FC = () => {
  const { 
    currentUser, currentProject, sprints, issues, 
    activityLogs, notifications, users, markNotificationRead, clearNotifications 
  } = useTaskFlow();

  const [notifDrawerVisible, setNotifDrawerVisible] = useState(false);

  // Filter components by project
  const projectIssues = issues.filter(i => i.project_id === currentProject?.id);
  const activeSprint = sprints.find(s => s.project_id === currentProject?.id && s.status === 'active');
  const sprintIssues = projectIssues.filter(i => i.sprint_id === activeSprint?.id);

  // Compute stats
  const totalIssues = projectIssues.length;
  const doneIssues = projectIssues.filter(i => i.status === 'Done').length;
  const inProgressIssues = projectIssues.filter(i => i.status === 'In Progress').length;
  const toDoIssues = projectIssues.filter(i => i.status === 'To Do').length;
  const inReviewIssues = projectIssues.filter(i => i.status === 'In Review').length;

  const activeSprintTotal = sprintIssues.length;
  const activeSprintDone = sprintIssues.filter(i => i.status === 'Done').length;
  const sprintCompletionPercent = activeSprintTotal > 0 ? Math.round((activeSprintDone / activeSprintTotal) * 100) : 0;

  // Find user by id utility
  const getUser = (id: string | null): User | undefined => {
    return users.find(u => u.id === id);
  };

  // Format date readable
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Highest': return '#ff4d4f';
      case 'High': return '#ff7a45';
      case 'Medium': return '#ffec3d';
      case 'Low': return '#bae637';
      case 'Lowest': return '#73d13d';
      default: return '#d9d9d9';
    }
  };

  return (
    <div className="view-container fade-in">
      <div className="welcome-banner">
        <div>
          <Title level={2} style={{ margin: 0 }}>Welcome back, {currentUser?.name} 👋</Title>
          <Text type="secondary">Here is an overview of {currentProject?.name || 'your project'} today.</Text>
        </div>
        <div>
          <Badge count={notifications.filter(n => !n.read_flag).length}>
            <Button 
              type="primary" 
              shape="circle" 
              icon={<BellOutlined />} 
              size="large" 
              onClick={() => setNotifDrawerVisible(true)} 
              className="notif-btn"
            />
          </Badge>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {/* KPI Panel */}
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="kpi-card purple-gradient">
            <Statistic 
              title={<span style={{ color: '#fff' }}>Total Issues</span>} 
              value={totalIssues} 
              prefix={<FileTextOutlined style={{ marginRight: 8 }} />}
              valueStyle={{ color: '#fff' }}
            />
            <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.8)' }}>
              {doneIssues} Done / {totalIssues - doneIssues} Open
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="kpi-card blue-gradient">
            <Statistic 
              title={<span style={{ color: '#fff' }}>Active Sprint Progress</span>} 
              value={`${sprintCompletionPercent}%`} 
              prefix={<CheckCircleOutlined style={{ marginRight: 8 }} />}
              valueStyle={{ color: '#fff' }}
            />
            <Progress percent={sprintCompletionPercent} size="small" showInfo={false} strokeColor="#fff" trailColor="rgba(255,255,255,0.3)" style={{ marginTop: 12 }} />
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="kpi-card green-gradient">
            <Statistic 
              title={<span style={{ color: '#fff' }}>Work in Progress</span>} 
              value={inProgressIssues} 
              prefix={<ProjectOutlined style={{ marginRight: 8 }} />}
              valueStyle={{ color: '#fff' }}
            />
            <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.8)' }}>
              Across all boards & backlogs
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} className="kpi-card orange-gradient">
            <Statistic 
              title={<span style={{ color: '#fff' }}>Sprint Scope</span>} 
              value={activeSprintTotal} 
              prefix={<CalendarOutlined style={{ marginRight: 8 }} />}
              valueStyle={{ color: '#fff' }}
            />
            <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.8)' }}>
              Goal: {activeSprint ? activeSprint.goal.substring(0, 30) + '...' : 'No active sprint'}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {/* Sprint Overview */}
        <Col xs={24} lg={16}>
          <Card title="Active Sprint Goal & Status" bordered={false} className="dashboard-subcard">
            {activeSprint ? (
              <div className="sprint-details">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Title level={4} style={{ margin: 0, color: '#1677ff' }}>{activeSprint.name}</Title>
                  <Tag color="blue"><CalendarOutlined style={{ marginRight: 6 }} /> {formatDate(activeSprint.start_date)} - {formatDate(activeSprint.end_date)}</Tag>
                </div>
                <Paragraph><strong>Sprint Goal:</strong> {activeSprint.goal}</Paragraph>
                
                <Divider style={{ margin: '16px 0' }} />
                
                <Title level={5}>Current Progress</Title>
                <Row gutter={16} align="middle">
                  <Col xs={24} sm={12}>
                    <div style={{ textAlign: 'center', padding: '16px 0' }}>
                      <Progress type="dashboard" percent={sprintCompletionPercent} strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} />
                    </div>
                  </Col>
                  <Col xs={24} sm={12}>
                    <List size="small">
                      <List.Item><Badge status="default" text="To Do" /> <strong>{toDoIssues}</strong> issues</List.Item>
                      <List.Item><Badge status="processing" text="In Progress" /> <strong>{inProgressIssues}</strong> issues</List.Item>
                      <List.Item><Badge status="warning" text="In Review" /> <strong>{inReviewIssues}</strong> issues</List.Item>
                      <List.Item><Badge status="success" text="Done" /> <strong>{doneIssues}</strong> issues</List.Item>
                    </List>
                  </Col>
                </Row>
              </div>
            ) : (
              <Empty description="No active sprint for this project. Head over to the Backlog tab to start a sprint!" style={{ padding: '24px 0' }} />
            )}
          </Card>

          {/* Assigned issues list */}
          <Card title="My Work Items" bordered={false} className="dashboard-subcard" style={{ marginTop: 24 }}>
            <List
              dataSource={projectIssues.filter(i => i.assignee_id === currentUser?.id && i.status !== 'Done')}
              renderItem={(item: Issue) => (
                <List.Item
                  key={item.id}
                  actions={[
                    <Tag color={getPriorityColor(item.priority)}>{item.priority}</Tag>,
                    <Tag color="cyan">{item.status}</Tag>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar shape="square" src={currentUser?.avatarUrl} />}
                    title={<span style={{ fontWeight: 600 }}>{item.key} - {item.title}</span>}
                    description={item.description ? item.description.substring(0, 100) + '...' : 'No description provided'}
                  />
                </List.Item>
              )}
              locale={{ emptyText: <Empty description="You have no pending assignments! Great job." /> }}
            />
          </Card>
        </Col>

        {/* Recent Activity Logs */}
        <Col xs={24} lg={8}>
          <Card title="Activity Feed" bordered={false} className="dashboard-subcard" extra={<HistoryOutlined />}>
            {activityLogs.length > 0 ? (
              <Timeline mode="left" style={{ marginTop: 16 }}>
                {activityLogs.slice(-6).reverse().map((log) => {
                  const actor = getUser(log.user_id);
                  const issue = issues.find(i => i.id === log.issue_id);
                  return (
                    <Timeline.Item key={log.id}>
                      <div className="activity-item">
                        <span className="activity-time">{formatDate(log.timestamp)}</span>
                        <div className="activity-details">
                          <Avatar size="small" src={actor?.avatarUrl} style={{ marginRight: 6 }} />
                          <strong>{actor?.name || 'System'}</strong> {log.action}
                          {issue && <span className="activity-issue"> in <strong>{issue.key}</strong></span>}
                        </div>
                      </div>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            ) : (
              <Empty description="No recent updates." />
            )}
          </Card>
        </Col>
      </Row>

      {/* Notifications Drawer */}
      <Drawer
        title="Notifications"
        placement="right"
        onClose={() => setNotifDrawerVisible(false)}
        open={notifDrawerVisible}
        width={380}
        extra={
          <Button onClick={clearNotifications} size="small">Clear All</Button>
        }
      >
        {notifications.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item 
                onClick={() => { markNotificationRead(item.id); }} 
                className={`notif-item ${!item.read_flag ? 'unread' : ''}`}
                style={{ cursor: 'pointer', padding: '12px 16px', borderRadius: 4, marginBottom: 8 }}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<InfoCircleOutlined />} style={{ backgroundColor: item.type === 'assignment' ? '#1677ff' : '#722ed1' }} />}
                  title={<span style={{ fontSize: 13, fontWeight: !item.read_flag ? 600 : 400 }}>{item.message}</span>}
                  description={<Text type="secondary" style={{ fontSize: 11 }}>{formatDate(item.created_at)}</Text>}
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No notifications found." style={{ marginTop: 80 }} />
        )}
      </Drawer>
    </div>
  );
};
