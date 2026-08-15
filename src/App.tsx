import React, { useState, useEffect } from 'react';
import { Layout, Menu, Select, Avatar, Dropdown, Button, ConfigProvider, theme, Modal, Form, Input, DatePicker, Row, Col, Space, Typography, message, Badge, List, Drawer, FloatButton } from 'antd';
import { 
  DashboardOutlined, 
  OrderedListOutlined, 
  ProjectOutlined, 
  BarChartOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  UserOutlined,
  BulbOutlined,
  BulbFilled,
  BellOutlined,
  PlusOutlined,
  CalendarOutlined,
  FolderOutlined,
  ClockCircleOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { TaskFlowProvider, useTaskFlow } from './context/TaskFlowContext';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/DashboardView';
import { BacklogView } from './components/BacklogView';
import { BoardView } from './components/BoardView';
import { ReportsView } from './components/ReportsView';
import { AdminSettingsView } from './components/AdminSettingsView';
import { TimesheetView } from './components/TimesheetView';
import { TimelineView } from './components/TimelineView';
import { CalendarView } from './components/CalendarView';
import { TeamChatView } from './components/TeamChatView';
import { SplashScreen } from './components/SplashScreen';
import { ProjectsView } from './components/ProjectsView';
import { ProfileView } from './components/ProfileView';
import { IssueDetailModal } from './components/IssueDetailModal';
import type { Issue } from './types';
import './App.css';

const { Title, Paragraph } = Typography;

const { Header, Content, Sider } = Layout;
const { Option } = Select;

const TaskFlowApp: React.FC = () => {
  const { 
    currentUser, logout, currentProject, projects, setCurrentProject,
    currentView, setView, darkMode, toggleDarkMode, users, epics, sprints, createIssue,
    activeTimer, stopTimer, cancelTimer, notifications, markNotificationRead
  } = useTaskFlow();

  const [collapsed, setCollapsed] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isQuickCreateVisible, setIsQuickCreateVisible] = useState(false);
  const [quickCreateForm] = Form.useForm();

  // Local timer ticking state
  const [headerTimerStr, setHeaderTimerStr] = useState('00:00:00');
  const [isHeaderTimerModalVisible, setIsHeaderTimerModalVisible] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (activeTimer) {
      const updateElapsed = () => {
        const diffMs = Date.now() - new Date(activeTimer.startTime).getTime();
        const totalSecs = Math.floor(diffMs / 1000);
        const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
        const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
        const secs = String(totalSecs % 60).padStart(2, '0');
        setHeaderTimerStr(`${hrs}:${mins}:${secs}`);
      };
      updateElapsed();
      interval = setInterval(updateElapsed, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  if (!currentUser) {
    return <LoginScreen />;
  }

  // Handle opening issue detail modal
  const handleOpenIssueDetail = (issue: Issue) => {
    setSelectedIssue(issue);
  };

  // Profile menu drop down configuration
  const menuProps = {
    items: [
      {
        key: 'role',
        label: <span style={{ fontSize: 12 }}>Signed in as: <strong>{currentUser.role}</strong></span>,
        disabled: true,
      },
      {
        key: 'profile',
        label: 'My Profile',
        icon: <UserOutlined />,
      },
      {
        type: 'divider' as const,
      },
      {
        key: 'logout',
        label: 'Logout',
        danger: true,
        icon: <LogoutOutlined />,
      }
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') logout();
      else if (key === 'profile') setView('Profile');
    }
  };

  // Submit quick creation
  const handleQuickCreateSubmit = (values: any) => {
    createIssue({
      title: values.title,
      description: values.description || '',
      type: values.type,
      priority: values.priority || 'Medium',
      status: 'To Do',
      assignee_id: values.assignee_id || null,
      reporter_id: currentUser.id,
      epic_id: values.epic_id || null,
      sprint_id: values.sprint_id || null,
      estimate: values.estimate ? Number(values.estimate) : null,
      due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null
    });
    setIsQuickCreateVisible(false);
    quickCreateForm.resetFields();
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sider Navigation */}
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        className="app-layout-sider"
        theme="dark"
      >
        <div className="app-logo-area">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#1677ff" />
            <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="#722ed1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {!collapsed && <span style={{ fontSize: 16, fontWeight: 700, color: 'white', letterSpacing: 0.5 }}>TaskFlow</span>}
        </div>

        <Menu 
          theme="dark" 
          mode="inline" 
          selectedKeys={[currentView]}
          onClick={({ key }) => setView(key)}
        >
          <Menu.Item key="Projects" icon={<FolderOutlined />}>
            Projects
          </Menu.Item>
          <Menu.Item key="Dashboard" icon={<DashboardOutlined />}>
            Dashboard
          </Menu.Item>
          <Menu.Item key="Backlog" icon={<OrderedListOutlined />}>
            Backlog
          </Menu.Item>
          <Menu.Item key="Board" icon={<ProjectOutlined />}>
            Active Board
          </Menu.Item>

          <Menu.Item key="Timesheet" icon={<CalendarOutlined />}>
            Timesheet
          </Menu.Item>
          {(currentUser.role === 'Developer' || currentUser.role === 'Tester') && (
            <>
              <Menu.Item key="Timeline" icon={<ClockCircleOutlined />}>
                Timeline
              </Menu.Item>
              <Menu.Item key="Calendar" icon={<CalendarOutlined />}>
                Calendar
              </Menu.Item>
            </>
          )}
          <Menu.Item key="Reports" icon={<BarChartOutlined />}>
            Reports
          </Menu.Item>
          <Menu.Item key="Profile" icon={<UserOutlined />}>
            My Profile
          </Menu.Item>
          {currentUser.role !== 'Viewer' && (
            <Menu.Item key="Admin" icon={<SettingOutlined />}>
              Settings
            </Menu.Item>
          )}
        </Menu>
      </Sider>

      {/* Main Container */}
      <Layout>
        {/* Header toolbar */}
        <Header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontWeight: 600, color: '#8c8c8c' }}>Project:</span>
            <Select 
              value={currentProject?.id} 
              style={{ width: 220 }}
              onChange={(id) => {
                const proj = projects.find(p => p.id === id);
                if (proj) {
                  setCurrentProject(proj);
                  if (proj.type === 'Timesheet') {
                    setView('Timesheet');
                  } else if (currentView === 'Timesheet') {
                    setView('Dashboard');
                  }
                }
              }}
            >
              {projects.map(p => (
                <Option key={p.id} value={p.id}>{p.name} ({p.key})</Option>
              ))}
            </Select>
            <Button 
              type="primary" 
              size="small" 
              icon={<PlusOutlined />} 
              onClick={() => setIsQuickCreateVisible(true)}
              disabled={currentUser.role === 'Viewer'}
            >
              Quick Create
            </Button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Live Work Timer in Header */}
            {activeTimer && (
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  background: 'rgba(255, 77, 79, 0.08)', 
                  border: '1px solid rgba(255, 77, 79, 0.2)',
                  borderRadius: 20, 
                  padding: '4px 14px',
                  cursor: 'pointer'
                }}
                onClick={() => setIsHeaderTimerModalVisible(true)}
              >
                <span className="timer-pulse-dot" style={{ 
                  display: 'inline-block', 
                  width: 8, 
                  height: 8, 
                  background: '#ff4d4f', 
                  borderRadius: '50%',
                  animation: 'fadeIn 1s infinite alternate' 
                }}></span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#ff4d4f', fontFamily: 'monospace' }}>
                  {headerTimerStr}
                </span>
                <span style={{ fontSize: 11, color: '#8c8c8c', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeTimer.title.split(' - ')[0]}
                </span>
              </div>
            )}

            {/* Notifications */}
            <Dropdown 
              menu={{ 
                items: notifications.filter(n => !n.read_flag && n.user_id === currentUser?.id).length > 0 
                  ? notifications.filter(n => !n.read_flag && n.user_id === currentUser?.id).map(n => ({
                      key: n.id,
                      label: <div onClick={() => markNotificationRead(n.id)} style={{ maxWidth: 250, whiteSpace: 'normal' }}>{n.message}</div>
                    }))
                  : [{ key: 'empty', label: 'No new notifications', disabled: true }]
              }} 
              trigger={['click']}
              placement="bottomRight"
            >
              <Badge count={notifications.filter(n => !n.read_flag && n.user_id === currentUser?.id).length} size="small" style={{ cursor: 'pointer' }}>
                <Button type="text" shape="circle" icon={<BellOutlined />} />
              </Badge>
            </Dropdown>

            {/* Dark Mode toggle */}
            <Button 
              type="text" 
              shape="circle" 
              icon={darkMode ? <BulbFilled style={{ color: '#fadb14' }} /> : <BulbOutlined />} 
              onClick={toggleDarkMode}
            />

            {/* Profile Dropdown */}
            <Dropdown menu={menuProps} trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar src={currentUser.avatarUrl} icon={<UserOutlined />} />
                <span style={{ fontWeight: 500 }}>{currentUser.name}</span>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content routing */}
        <Content style={{ margin: '16px', minHeight: 280 }}>
          {currentView === 'Projects' && <ProjectsView />}
          {currentView === 'Dashboard' && <DashboardView />}
          {currentView === 'Backlog' && <BacklogView onSelectIssue={handleOpenIssueDetail} />}
          {currentView === 'Board' && (
            <BoardView 
              onSelectIssue={handleOpenIssueDetail} 
              onQuickCreateIssue={() => setIsQuickCreateVisible(true)} 
            />
          )}
          {currentView === 'Chat' && <TeamChatView />}
          {currentView === 'Timesheet' && <TimesheetView />}
          {currentView === 'Timeline' && <TimelineView />}
          {currentView === 'Calendar' && <CalendarView />}
          {currentView === 'Reports' && <ReportsView />}
          {currentView === 'Profile' && <ProfileView />}
          {currentView === 'Admin' && <AdminSettingsView />}
        </Content>
      </Layout>

      {/* Global Issue Details Modal */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          open={selectedIssue !== null}
          onClose={() => setSelectedIssue(null)}
        />
      )}

      {/* GLOBAL QUICK CREATE MODAL */}
      <Modal
        title="Quick Create Issue"
        open={isQuickCreateVisible}
        onCancel={() => setIsQuickCreateVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={quickCreateForm} layout="vertical" onFinish={handleQuickCreateSubmit} initialValues={{ type: 'Story', priority: 'Medium' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="Issue Type" rules={[{ required: true }]}>
                <Select>
                  <Option value="Story">Story</Option>
                  <Option value="Task">Task</Option>
                  <Option value="Bug">Bug</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority">
                <Select>
                  <Option value="Highest">Highest</Option>
                  <Option value="High">High</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="Low">Low</Option>
                  <Option value="Lowest">Lowest</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="title" label="Summary" rules={[{ required: true, message: 'Please input issue summary!' }]}>
            <Input placeholder="Keep it short and descriptive" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Provide detailed specifications..." rows={4} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assignee_id" label="Assignee">
                <Select placeholder="Select Member" allowClear>
                  {users.map(u => (
                    <Option key={u.id} value={u.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar size="small" src={u.avatarUrl} />
                        <span>{u.name}</span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="epic_id" label="Epic Link">
                <Select placeholder="Select Epic Link" allowClear>
                  {epics.filter(e => e.project_id === currentProject?.id).map(e => (
                    <Option key={e.id} value={e.id}>{e.title}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="sprint_id" label="Sprint Location">
                <Select placeholder="Backlog" allowClear>
                  {sprints.filter(s => s.project_id === currentProject?.id && s.status !== 'closed').map(s => (
                    <Option key={s.id} value={s.id}>{s.name} ({s.status})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="estimate" label="Story Points">
                <Input type="number" min={0} placeholder="e.g. 5" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="due_date" label="Due Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', margin: 0, marginTop: 12 }}>
            <Space>
              <Button onClick={() => setIsQuickCreateVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* HEADER TIMER MODAL */}
      <Modal
        title="Log Tracked Time"
        open={isHeaderTimerModalVisible}
        onCancel={() => setIsHeaderTimerModalVisible(false)}
        footer={null}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <Title level={2} style={{ fontFamily: 'monospace', margin: '0 0 16px 0', letterSpacing: 1 }}>{headerTimerStr}</Title>
          {activeTimer && (
            <Paragraph type="secondary">
              Tracked time for task: <br /><strong>{activeTimer.title}</strong>
            </Paragraph>
          )}
          <Form layout="vertical" onFinish={(values) => {
            stopTimer(values.note);
            setIsHeaderTimerModalVisible(false);
            message.success('Tracked time logged successfully!');
          }}>
            <Form.Item name="note" label="What were you working on?">
              <Input.TextArea placeholder="Provide a brief description of the work completed..." rows={3} />
            </Form.Item>
            <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 0 }}>
              <Space>
                <Button onClick={() => {
                  cancelTimer();
                  setIsHeaderTimerModalVisible(false);
                  message.info('Work timer discarded.');
                }} danger type="text">
                  Discard
                </Button>
                <Button onClick={() => setIsHeaderTimerModalVisible(false)}>Keep Running</Button>
                <Button type="primary" htmlType="submit" className="gradient-btn">Stop & Log Work</Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      {/* Team Chat Drawer & Floating Button */}
      <Drawer
        title="Team Chat"
        placement="right"
        width={700}
        onClose={() => setIsChatDrawerOpen(false)}
        open={isChatDrawerOpen}
        styles={{ body: { padding: 0 } }}
      >
        <TeamChatView />
      </Drawer>

      <FloatButton
        icon={<MessageOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24, width: 56, height: 56 }}
        onClick={() => setIsChatDrawerOpen(true)}
        tooltip="Open Team Chat"
      />
    </Layout>
  );
};

const App: React.FC = () => {
  const { darkMode } = useTaskFlow();
  
  return (
    <ConfigProvider 
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 8,
          fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif"
        }
      }}
    >
      <TaskFlowApp />
    </ConfigProvider>
  );
};

const AppWithProvider: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <TaskFlowProvider>
      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : (
        <App />
      )}
    </TaskFlowProvider>
  );
};

export default AppWithProvider;
