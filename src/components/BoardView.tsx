import React, { useState } from 'react';
import { 
  Card, Button, Tag, Avatar, Input, Select, 
  Tooltip, Badge, Empty, Typography, Row, Col 
} from 'antd';
import { 
  SearchOutlined, UserOutlined, WarningOutlined, PlusOutlined
} from '@ant-design/icons';
import { useTaskFlow } from '../context/TaskFlowContext';
import type { Issue } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

interface BoardViewProps {
  onSelectIssue: (issue: Issue) => void;
  onQuickCreateIssue: () => void;
}

export const BoardView: React.FC<BoardViewProps> = ({ onSelectIssue, onQuickCreateIssue }) => {
  const { 
    currentProject, issues, workflows, users, changeIssueStatus, sprints 
  } = useTaskFlow();

  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  // Active sprint filter
  const activeSprint = sprints.find(s => s.project_id === currentProject?.id && s.status === 'active');

  // Load workflow columns for project
  const projectWorkflow = workflows.find(w => w.projectId === currentProject?.id) || {
    columns: [
      { status: 'To Do', wipLimit: null },
      { status: 'In Progress', wipLimit: 3 },
      { status: 'In Review', wipLimit: 3 },
      { status: 'Done', wipLimit: null }
    ]
  };

  // Filter issues
  const projectIssues = issues.filter(i => {
    // Show only active sprint issues if Scrum project, otherwise show all if Kanban project
    const isCorrectProject = i.project_id === currentProject?.id;
    const isCorrectSprint = currentProject?.type === 'Scrum' 
      ? (activeSprint ? i.sprint_id === activeSprint.id : i.sprint_id === null)
      : true; // Kanban shows all tasks
    const notSubtask = !i.key.includes('-SUB-'); // Don't show subtasks as cards, they are inside parent issue details
    
    return isCorrectProject && isCorrectSprint && notSubtask;
  });

  const filteredIssues = projectIssues.filter(iss => {
    const matchesSearch = searchQuery 
      ? iss.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        iss.key.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesAssignee = assigneeFilter ? iss.assignee_id === assigneeFilter : true;
    const matchesPriority = priorityFilter ? iss.priority === priorityFilter : true;
    
    return matchesSearch && matchesAssignee && matchesPriority;
  });

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, issueId: string) => {
    e.dataTransfer.setData('text/plain', issueId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const droppedId = e.dataTransfer.getData('text/plain');
    if (droppedId) {
      changeIssueStatus(droppedId, targetStatus);
    }
  };

  const getPriorityTagColor = (priority: string) => {
    switch (priority) {
      case 'Highest': return '#ff4d4f';
      case 'High': return '#ff7a45';
      case 'Medium': return '#faad14';
      case 'Low': return '#a0d911';
      case 'Lowest': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const getUserAvatar = (userId: string | null) => {
    if (!userId) return <Avatar size="small" icon={<UserOutlined />} />;
    const u = users.find(user => user.id === userId);
    return u ? (
      <Tooltip title={`${u.name} (${u.role})`}>
        <Avatar size="small" src={u.avatarUrl} />
      </Tooltip>
    ) : <Avatar size="small" icon={<UserOutlined />} />;
  };

  return (
    <div className="view-container fade-in">
      {/* View Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Active Board</Title>
          <Text type="secondary">
            {currentProject?.type === 'Scrum' 
              ? `Scrum Board — ${activeSprint ? activeSprint.name : 'Backlog Board'}` 
              : 'Continuous Flow Kanban Board'}
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={onQuickCreateIssue} className="gradient-btn">
          Create Issue
        </Button>
      </div>

      {/* Filters Bar */}
      <Card bordered={false} bodyStyle={{ padding: 12 }} style={{ marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Input 
              placeholder="Search by title or key..." 
              prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6}>
            <Select 
              placeholder="Assignee: All" 
              style={{ width: '100%' }} 
              value={assigneeFilter}
              onChange={setAssigneeFilter}
              allowClear
            >
              {users.map(u => (
                <Option key={u.id} value={u.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar size="small" src={u.avatarUrl} />
                    <span>{u.name}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6}>
            <Select 
              placeholder="Priority: All" 
              style={{ width: '100%' }}
              value={priorityFilter}
              onChange={setPriorityFilter}
              allowClear
            >
              <Option value="Highest">Highest</Option>
              <Option value="High">High</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Low">Low</Option>
              <Option value="Lowest">Lowest</Option>
            </Select>
          </Col>
          {(searchQuery || assigneeFilter || priorityFilter) && (
            <Col xs={24} sm={4}>
              <Button onClick={() => { setSearchQuery(''); setAssigneeFilter(null); setPriorityFilter(null); }} block>
                Clear Filters
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {/* Board Columns Grid */}
      <div className="board-grid">
        {projectWorkflow.columns.map(col => {
          const colIssues = filteredIssues.filter(i => i.status === col.status);
          const isWipExceeded = col.wipLimit !== null && colIssues.length > col.wipLimit;
          
          return (
            <div 
              key={col.status} 
              className={`board-column ${isWipExceeded ? 'wip-exceeded' : ''}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              {/* Column Header */}
              <div className="board-column-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="column-title">{col.status}</span>
                  <Badge count={colIssues.length} style={{ backgroundColor: isWipExceeded ? '#ff4d4f' : '#8c8c8c' }} />
                </div>
                {col.wipLimit !== null && (
                  <Tooltip title={`Work-in-progress limit: ${col.wipLimit}`}>
                    <span className={`wip-limit-label ${isWipExceeded ? 'exceeded-text' : ''}`}>
                      {isWipExceeded && <WarningOutlined style={{ marginRight: 4 }} />}
                      Max {col.wipLimit}
                    </span>
                  </Tooltip>
                )}
              </div>

              {/* Column Cards Container */}
              <div className="board-column-cards">
                {colIssues.length > 0 ? (
                  colIssues.map(issue => (
                    <Card
                      key={issue.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, issue.id)}
                      onClick={() => onSelectIssue(issue)}
                      className="board-card"
                      bordered={false}
                      hoverable
                    >
                      <div className="board-card-header">
                        <Tag color={issue.type === 'Bug' ? 'error' : issue.type === 'Story' ? 'success' : 'processing'} style={{ textTransform: 'uppercase', fontSize: 9 }}>
                          {issue.type}
                        </Tag>
                        <span className="board-card-key">{issue.key}</span>
                      </div>
                      
                      <div className="board-card-body">
                        {issue.title}
                      </div>

                      <div className="board-card-footer">
                        <Tag color={getPriorityTagColor(issue.priority)} style={{ border: 'none', fontSize: 9 }}>
                          {issue.priority}
                        </Tag>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {issue.estimate !== null && (
                            <Badge 
                              count={issue.estimate} 
                              style={{ backgroundColor: '#e6f7ff', color: '#1890ff', boxShadow: 'none', fontWeight: 'bold' }} 
                            />
                          )}
                          {getUserAvatar(issue.assignee_id)}
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="empty-column-placeholder">
                    <Empty description={false} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
