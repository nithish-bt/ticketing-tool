import React, { useState } from 'react';
import { 
  Card, Button, Tag, Space, Avatar, Input, Select, Modal, Form, 
  DatePicker, Typography, Empty, Row, Col, Badge
} from 'antd';
import { 
  PlusOutlined, CalendarOutlined, FileTextOutlined, UserOutlined, StarOutlined
} from '@ant-design/icons';
import { useTaskFlow } from '../context/TaskFlowContext';
import type { Issue } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface BacklogViewProps {
  onSelectIssue: (issue: Issue) => void;
}

export const BacklogView: React.FC<BacklogViewProps> = ({ onSelectIssue }) => {
  const { 
    currentProject, sprints, issues, epics, users, currentUser,
    createSprint, startSprint, closeSprint, createIssue, updateIssue 
  } = useTaskFlow();

  const [isSprintModalVisible, setIsSprintModalVisible] = useState(false);
  const [isIssueModalVisible, setIsIssueModalVisible] = useState(false);
  const [isCloseSprintModalVisible, setIsCloseSprintModalVisible] = useState(false);
  
  const [selectedSprintToClose, setSelectedSprintToClose] = useState<string | null>(null);
  const [selectedRolloverSprint, setSelectedRolloverSprint] = useState<string | null>(null);

  const [sprintForm] = Form.useForm();
  const [issueForm] = Form.useForm();

  const [epicFilter, setEpicFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sprints
  const projectSprints = sprints.filter(s => s.project_id === currentProject?.id);
  const activeSprint = projectSprints.find(s => s.status === 'active');
  const inactiveSprints = projectSprints.filter(s => s.status === 'inactive');
  
  // Filtered issues
  const projectIssues = issues.filter(i => i.project_id === currentProject?.id && !i.key.includes('-SUB-'));
  
  const filteredIssues = projectIssues.filter(iss => {
    const matchesEpic = epicFilter ? iss.epic_id === epicFilter : true;
    const matchesSearch = searchQuery 
      ? iss.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        iss.key.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesEpic && matchesSearch;
  });

  const backlogIssues = filteredIssues.filter(i => i.sprint_id === null);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, issueId: string) => {
    e.dataTransfer.setData('text/plain', issueId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetSprintId: string | null) => {
    e.preventDefault();
    const issueId = e.dataTransfer.getData('text/plain');
    if (issueId) {
      updateIssue(issueId, { sprint_id: targetSprintId });
    }
  };

  // Submit handers
  const handleSprintSubmit = (values: any) => {
    const { name, dateRange, goal } = values;
    createSprint(
      name, 
      dateRange[0].format('YYYY-MM-DD'), 
      dateRange[1].format('YYYY-MM-DD'), 
      goal || ''
    );
    setIsSprintModalVisible(false);
    sprintForm.resetFields();
  };

  const handleIssueSubmit = (values: any) => {
    createIssue({
      title: values.title,
      description: values.description || '',
      type: values.type,
      priority: values.priority || 'Medium',
      status: 'To Do',
      assignee_id: values.assignee_id || null,
      reporter_id: currentUser?.id || 'system',
      epic_id: values.epic_id || null,
      sprint_id: values.sprint_id || null,
      estimate: values.estimate ? Number(values.estimate) : null,
      due_date: values.due_date ? values.due_date.format('YYYY-MM-DD') : null
    });
    setIsIssueModalVisible(false);
    issueForm.resetFields();
  };

  const handleCloseSprintSubmit = () => {
    if (selectedSprintToClose) {
      closeSprint(selectedSprintToClose, selectedRolloverSprint);
      setIsCloseSprintModalVisible(false);
      setSelectedSprintToClose(null);
      setSelectedRolloverSprint(null);
    }
  };

  const handleStartSprint = (sprintId: string) => {
    // Sprints are restricted: only 1 active sprint allowed
    if (activeSprint) {
      Modal.warning({
        title: 'Active Sprint exists',
        content: 'You can only have one active sprint per project. Please close the current active sprint first.'
      });
      return;
    }
    startSprint(sprintId);
  };

  const getUserAvatar = (userId: string | null) => {
    if (!userId) return <Avatar size="small" icon={<UserOutlined />} />;
    const u = users.find(user => user.id === userId);
    return u ? <Avatar size="small" src={u.avatarUrl} /> : <Avatar size="small" icon={<UserOutlined />} />;
  };

  const renderIssueItem = (issue: Issue) => {
    const epic = epics.find(e => e.id === issue.epic_id);
    return (
      <div 
        key={issue.id}
        draggable
        onDragStart={(e) => handleDragStart(e, issue.id)}
        onClick={() => onSelectIssue(issue)}
        className="backlog-issue-item"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
          <Tag color={issue.type === 'Bug' ? 'error' : issue.type === 'Story' ? 'success' : 'processing'} style={{ textTransform: 'uppercase', fontSize: 10 }}>
            {issue.type}
          </Tag>
          <span className="issue-key-label">{issue.key}</span>
          <span className="issue-title-label">{issue.title}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {epic && (
            <Tag color={epic.color || 'blue'} style={{ fontSize: 10, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {epic.title}
            </Tag>
          )}
          {issue.estimate !== null && (
            <Badge count={issue.estimate} style={{ backgroundColor: '#52c41a' }} />
          )}
          {getUserAvatar(issue.assignee_id)}
        </div>
      </div>
    );
  };


  return (
    <div className="view-container fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Backlog</Title>
          <Text type="secondary">Plan sprints, organize backlogs, and manage epics.</Text>
        </div>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setIsSprintModalVisible(true)}>
            Create Sprint
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsIssueModalVisible(true)} className="gradient-btn">
            Create Issue
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        {/* Left Column: Epics sidebar */}
        <Col xs={24} md={6}>
          <Card title="Epics" bordered={false} className="epic-sidebar-card">
            <div 
              className={`epic-filter-item ${epicFilter === null ? 'active' : ''}`}
              onClick={() => setEpicFilter(null)}
            >
              All Issues
            </div>
            {epics.filter(e => e.project_id === currentProject?.id).map(e => (
              <div 
                key={e.id}
                className={`epic-filter-item ${epicFilter === e.id ? 'active' : ''}`}
                onClick={() => setEpicFilter(e.id)}
                style={{ borderLeft: `4px solid ${e.color || '#1677ff'}` }}
              >
                <div><strong>{e.title}</strong></div>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>{e.description.substring(0, 40)}...</div>
              </div>
            ))}
          </Card>
        </Col>

        {/* Right Column: Sprints and Backlog */}
        <Col xs={24} md={18}>
          <div style={{ marginBottom: 16 }}>
            <Input.Search 
              placeholder="Search by title or key..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ maxWidth: 400 }}
            />
          </div>

          {/* 1. Active Sprint Panel */}
          {activeSprint ? (
            <Card 
              title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Space>
                    <StarOutlined style={{ color: '#1890ff' }} />
                    <span>{activeSprint.name}</span>
                    <Tag color="green">Active</Tag>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(activeSprint.start_date).format('MMM D')} - {dayjs(activeSprint.end_date).format('MMM D')}
                  </Text>
                </div>
              }
              extra={
                <Button 
                  type="primary" 
                  danger 
                  size="small" 
                  onClick={() => {
                    setSelectedSprintToClose(activeSprint.id);
                    setIsCloseSprintModalVisible(true);
                  }}
                >
                  Complete Sprint
                </Button>
              }
              bordered={false}
              className="sprint-planning-card active-sprint"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, activeSprint.id)}
              style={{ marginBottom: 20 }}
            >
              <div className="sprint-goal-banner">
                <strong>Sprint Goal:</strong> {activeSprint.goal || 'No goal set'}
              </div>
              <div className="backlog-issues-list">
                {filteredIssues.filter(i => i.sprint_id === activeSprint.id).length > 0 ? (
                  filteredIssues.filter(i => i.sprint_id === activeSprint.id).map(renderIssueItem)
                ) : (
                  <Empty description="Drag issues here to plan this sprint." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </div>
            </Card>
          ) : null}

          {/* 2. Inactive Sprints */}
          {inactiveSprints.map(s => {
            const sprintIssuesList = filteredIssues.filter(i => i.sprint_id === s.id);
            return (
              <Card 
                key={s.id}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <CalendarOutlined />
                      <span>{s.name}</span>
                      <Tag color="default">Planned</Tag>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(s.start_date).format('MMM D')} - {dayjs(s.end_date).format('MMM D')}
                    </Text>
                  </div>
                }
                extra={
                  <Button 
                    type="primary" 
                    size="small" 
                    onClick={() => {
                      handleStartSprint(s.id);
                    }}
                  >
                    Start Sprint
                  </Button>
                }
                bordered={false}
                className="sprint-planning-card"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, s.id)}
                style={{ marginBottom: 20 }}
              >
                <div className="backlog-issues-list">
                  {sprintIssuesList.length > 0 ? (
                    sprintIssuesList.map(renderIssueItem)
                  ) : (
                    <Empty description="Drag issues here to plan this sprint." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  )}
                </div>
              </Card>
            );
          })}

          {/* 3. Backlog Panel */}
          <Card 
            title={
              <Space>
                <FileTextOutlined />
                <span>Product Backlog</span>
                <Badge count={backlogIssues.length} showZero style={{ backgroundColor: '#108ee9' }} />
              </Space>
            }
            bordered={false}
            className="sprint-planning-card backlog-card"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null)}
          >
            <div className="backlog-issues-list">
              {backlogIssues.length > 0 ? (
                backlogIssues.map(renderIssueItem)
              ) : (
                <Empty description="No issues in the backlog. Click Create Issue to add one!" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* CREATE SPRINT MODAL */}
      <Modal
        title="Create Sprint"
        open={isSprintModalVisible}
        onCancel={() => setIsSprintModalVisible(false)}
        footer={null}
      >
        <Form form={sprintForm} layout="vertical" onFinish={handleSprintSubmit}>
          <Form.Item name="name" label="Sprint Name" rules={[{ required: true, message: 'Please input sprint name!' }]}>
            <Input placeholder="e.g. Sprint 3: Analytics Dashboard" />
          </Form.Item>
          <Form.Item name="dateRange" label="Sprint Duration" rules={[{ required: true, message: 'Please select dates!' }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="goal" label="Sprint Goal">
            <Input.TextArea placeholder="What should be achieved during this sprint?" rows={3} />
          </Form.Item>
          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', margin: 0 }}>
            <Space>
              <Button onClick={() => setIsSprintModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* CREATE ISSUE MODAL */}
      <Modal
        title="Create Issue"
        open={isIssueModalVisible}
        onCancel={() => setIsIssueModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={issueForm} layout="vertical" onFinish={handleIssueSubmit} initialValues={{ type: 'Story', priority: 'Medium' }}>
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
            <Input.TextArea placeholder="Provide detailed steps, user stories, acceptance criteria, etc." rows={4} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assignee_id" label="Assignee">
                <Select placeholder="Select Team Member" allowClear>
                  {users.map(u => (
                    <Option key={u.id} value={u.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar size="small" src={u.avatarUrl} />
                        <span>{u.name} ({u.role})</span>
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
                  {projectSprints.filter(s => s.status !== 'closed').map(s => (
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
              <Button onClick={() => setIsIssueModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* COMPLETE SPRINT MODAL */}
      <Modal
        title="Complete Sprint"
        open={isCloseSprintModalVisible}
        onCancel={() => setIsCloseSprintModalVisible(false)}
        onOk={handleCloseSprintSubmit}
        okText="Complete Sprint"
        cancelText="Cancel"
      >
        <div style={{ marginBottom: 16 }}>
          <p>This will close the active sprint. Any open issues will be rolled over to the selection below.</p>
        </div>
        <Form layout="vertical">
          <Form.Item label="Move open issues to:">
            <Select 
              value={selectedRolloverSprint} 
              onChange={(val) => setSelectedRolloverSprint(val)}
              placeholder="Select Target Sprint"
              allowClear
            >
              <Option value={null}>Product Backlog</Option>
              {projectSprints.filter(s => s.status === 'inactive').map(s => (
                <Option key={s.id} value={s.id}>{s.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
