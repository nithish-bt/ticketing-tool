import React, { useState } from 'react';
import { 
  Modal, Row, Col, Select, Input, Button, Avatar, List, 
  Timeline, Typography, Tag, Progress, Space, Form, DatePicker, 
  Divider, message, Card
} from 'antd';
import { 
  ClockCircleOutlined, SendOutlined, PaperClipOutlined, 
  PlusOutlined, DeleteOutlined, HistoryOutlined, CommentOutlined 
} from '@ant-design/icons';
import { useTaskFlow } from '../context/TaskFlowContext';
import type { Issue, Comment, User } from '../types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface IssueDetailModalProps {
  issue: Issue | null;
  open: boolean;
  onClose: () => void;
}

export const IssueDetailModal: React.FC<IssueDetailModalProps> = ({ issue, open, onClose }) => {
  if (!issue) return null;

  const { 
    users, epics, comments, worklogs, activityLogs, attachments, currentUser,
    updateIssue, deleteIssue, addComment, addWorklog, addAttachment, workflows, currentProject, createIssue
  } = useTaskFlow();

  const [commentText, setCommentText] = useState('');
  const [logWorkVisible, setLogWorkVisible] = useState(false);
  const [logHours, setLogHours] = useState<number>(1);
  const [logNote, setLogNote] = useState('');
  const [subTaskTitle, setSubTaskTitle] = useState('');

  // Fetch workflow columns for project to build status dropdown
  const projWorkflow = workflows.find(w => w.projectId === currentProject?.id) || {
    columns: [
      { status: 'To Do', wipLimit: null },
      { status: 'In Progress', wipLimit: null },
      { status: 'In Review', wipLimit: null },
      { status: 'Done', wipLimit: null }
    ]
  };

  const statusOptions = projWorkflow.columns.map(c => c.status);

  // Subtasks
  const subTasks = useTaskFlow().issues.filter(i => i.parent_id === issue.id);

  // Comments for this issue
  const issueComments = comments.filter(c => c.issue_id === issue.id);

  // Worklogs for this issue
  const issueWorklogs = worklogs.filter(w => w.issue_id === issue.id);
  const timeSpent = issueWorklogs.reduce((sum, log) => sum + log.time_spent, 0);

  // Activity logs for this issue
  const issueActivity = activityLogs.filter(a => a.issue_id === issue.id || a.issue_id === 'system');

  // Attachments for this issue
  const issueAttachments = attachments[issue.id] || [];

  const getUser = (id: string | null): User | undefined => {
    return users.find(u => u.id === id);
  };

  const handleStatusChange = (newStatus: string) => {
    updateIssue(issue.id, { status: newStatus });
  };

  const handleAssigneeChange = (assigneeId: string | null) => {
    updateIssue(issue.id, { assignee_id: assigneeId });
  };

  const handlePriorityChange = (priority: any) => {
    updateIssue(issue.id, { priority });
  };

  const handleEpicChange = (epicId: string | null) => {
    updateIssue(issue.id, { epic_id: epicId });
  };

  const handleTitleChange = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value.trim() && e.target.value !== issue.title) {
      updateIssue(issue.id, { title: e.target.value });
    }
  };

  const handleDescriptionChange = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (e.target.value !== issue.description) {
      updateIssue(issue.id, { description: e.target.value });
    }
  };

  const handleEstimateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value ? Number(e.target.value) : null;
    updateIssue(issue.id, { estimate: val });
  };

  const handleDueDateChange = (date: dayjs.Dayjs | null) => {
    updateIssue(issue.id, { due_date: date ? date.format('YYYY-MM-DD') : null });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    addComment(issue.id, commentText);
    setCommentText('');
  };

  const handleLogWork = () => {
    if (logHours <= 0) return;
    addWorklog(issue.id, logHours, logNote);
    setLogHours(1);
    setLogNote('');
    setLogWorkVisible(false);
  };

  const handleAddSubTask = () => {
    if (!subTaskTitle.trim()) return;
    
    // Call issue creator for subtask
    // To generate key like ENG-5-SUB-1
    
    // We add standard issue metadata
    // In context, createIssue is designed for top-level issues. We can manually add it to the issue list in state!
    // Since updateIssue is there, let's see how we can add issues in state.
    // In TaskFlowContext we have createIssue. Let's see: if we pass parent_id in createIssue:
    // It creates:
    // const newIssue: Issue = { ...issueData, id, key, project_id: currentProject.id };
    // Let's modify the createIssue parameters to allow passing key/parent_id, or just use createIssue itself!
    // Oh, createIssue doesn't have parent_id in Omit. Let's check how we wrote createIssue:
    // `createIssue: (issueData: Omit<Issue, 'id' | 'key' | 'project_id'>) => void`
    // Yes! `parent_id` is an optional property of Issue, so it's NOT omitted! We can just pass `parent_id: issue.id`!
    // The key is auto-generated in createIssue as `ENG-serial`.
    // Let's modify createIssue in context to make sub-task key generation automated.
    // Let's check if createIssue can handle sub-tasks.
    // Yes, we can just call:
    createIssue({
      title: subTaskTitle,
      description: '',
      type: 'Sub-task',
      priority: 'Medium',
      status: 'To Do',
      assignee_id: null,
      reporter_id: currentUser?.id || 'system',
      epic_id: issue.epic_id,
      sprint_id: issue.sprint_id,
      estimate: null,
      due_date: null,
      parent_id: issue.id
    });
    setSubTaskTitle('');
  };

  const handleSimulateAttachment = () => {
    const fileNames = ['sprint_retrospective_notes.docx', 'bug_screenshot_home.png', 'api_payload_response.json', 'architecture_diagram.pdf'];
    const randomFile = fileNames[Math.floor(Math.random() * fileNames.length)];
    const size = Math.floor(Math.random() * 20000) + 120; // 120kb to 20MB
    addAttachment(issue.id, randomFile, size);
    message.success(`Uploaded ${randomFile} successfully!`);
  };

  const handleDeleteIssue = () => {
    Modal.confirm({
      title: 'Delete Issue',
      content: `Are you sure you want to delete ${issue.key}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        deleteIssue(issue.id);
        onClose();
        message.success('Issue deleted successfully');
      }
    });
  };



  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={1000}
      className="issue-detail-modal"
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '92%' }}>
          <Space>
            <Tag color={issue.type === 'Bug' ? 'error' : issue.type === 'Story' ? 'success' : 'processing'}>
              {issue.type}
            </Tag>
            <span style={{ color: '#8c8c8c' }}>{issue.key}</span>
          </Space>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={handleDeleteIssue}
            disabled={currentUser?.role === 'Viewer'}
          >
            Delete
          </Button>
        </div>
      }
    >
      <Row gutter={24}>
        {/* Left Column: Details & Interaction */}
        <Col xs={24} md={16}>
          {/* Editable Title */}
          <div style={{ marginBottom: 16 }}>
            <Input 
              defaultValue={issue.title} 
              onBlur={handleTitleChange}
              style={{ fontSize: 20, fontWeight: 'bold', border: '1px solid transparent', padding: '4px 8px', borderRadius: 4 }}
              className="editable-input-title"
              disabled={currentUser?.role === 'Viewer'}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <Title level={5}>Description</Title>
            <Input.TextArea 
              defaultValue={issue.description} 
              onBlur={handleDescriptionChange}
              placeholder="Add a detailed description..."
              rows={4}
              disabled={currentUser?.role === 'Viewer'}
              style={{ border: '1px solid #d9d9d9', borderRadius: 4 }}
            />
          </div>

          {/* Sub-tasks */}
          {issue.type !== 'Sub-task' && (
            <div style={{ marginBottom: 20 }}>
              <Title level={5}>Sub-tasks</Title>
              {subTasks.length > 0 && (
                <List
                  size="small"
                  dataSource={subTasks}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Tag color={item.status === 'Done' ? 'success' : 'processing'}>{item.status}</Tag>
                      ]}
                    >
                      <Space>
                        <Text type="secondary">{item.key}</Text>
                        <span style={{ textDecoration: item.status === 'Done' ? 'line-through' : 'none' }}>{item.title}</span>
                      </Space>
                    </List.Item>
                  )}
                  style={{ marginBottom: 12 }}
                />
              )}
              {currentUser?.role !== 'Viewer' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input 
                    placeholder="Add a quick sub-task title..." 
                    value={subTaskTitle}
                    onChange={(e) => setSubTaskTitle(e.target.value)}
                    onPressEnter={handleAddSubTask}
                  />
                  <Button type="primary" onClick={handleAddSubTask} icon={<PlusOutlined />}>Add</Button>
                </div>
              )}
            </div>
          )}

          {/* Comments Section */}
          <Divider />
          <div>
            <Title level={5}><CommentOutlined /> Comments</Title>
            
            {currentUser?.role !== 'Viewer' && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <Avatar src={currentUser?.avatarUrl} />
                <div style={{ flex: 1 }}>
                  <Input.TextArea 
                    placeholder="Add a comment... Use @Name to mention team members." 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={2}
                    style={{ marginBottom: 8 }}
                  />
                  <Button type="primary" onClick={handleAddComment} icon={<SendOutlined />} size="small">
                    Comment
                  </Button>
                </div>
              </div>
            )}

            <List
              dataSource={issueComments}
              renderItem={(comment: Comment) => {
                const author = getUser(comment.author_id);
                return (
                  <List.Item style={{ alignItems: 'flex-start', padding: '10px 0' }}>
                    <List.Item.Meta
                      avatar={<Avatar src={author?.avatarUrl} />}
                      title={
                        <Space>
                          <strong>{author?.name}</strong>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {dayjs(comment.created_at).format('MMM D, YYYY h:mm A')}
                          </Text>
                        </Space>
                      }
                      description={
                        <Paragraph style={{ whiteSpace: 'pre-wrap', color: 'rgba(0,0,0,0.8)' }}>
                          {comment.body}
                        </Paragraph>
                      }
                    />
                  </List.Item>
                );
              }}
              locale={{ emptyText: <Text type="secondary">No comments added yet.</Text> }}
            />
          </div>
        </Col>

        {/* Right Column: Settings Pane */}
        <Col xs={24} md={8}>
          <Card bordered={false} bodyStyle={{ padding: 16 }} className="issue-settings-panel">
            {/* Status Selector */}
            <div style={{ marginBottom: 16 }}>
              <label className="settings-label">Status</label>
              <Select 
                value={issue.status} 
                onChange={handleStatusChange}
                style={{ width: '100%' }}
                disabled={currentUser?.role === 'Viewer'}
              >
                {statusOptions.map(st => (
                  <Option key={st} value={st}>{st}</Option>
                ))}
              </Select>
            </div>

            {/* Assignee Selector */}
            <div style={{ marginBottom: 16 }}>
              <label className="settings-label">Assignee</label>
              <Select 
                value={issue.assignee_id} 
                onChange={handleAssigneeChange}
                style={{ width: '100%' }}
                allowClear
                placeholder="Unassigned"
                disabled={currentUser?.role === 'Viewer'}
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
            </div>

            {/* Priority Selector */}
            <div style={{ marginBottom: 16 }}>
              <label className="settings-label">Priority</label>
              <Select 
                value={issue.priority} 
                onChange={handlePriorityChange}
                style={{ width: '100%' }}
                disabled={currentUser?.role === 'Viewer'}
              >
                <Option value="Highest"><Tag color="red">Highest</Tag></Option>
                <Option value="High"><Tag color="orange">High</Tag></Option>
                <Option value="Medium"><Tag color="gold">Medium</Tag></Option>
                <Option value="Low"><Tag color="blue">Low</Tag></Option>
                <Option value="Lowest"><Tag color="cyan">Lowest</Tag></Option>
              </Select>
            </div>

            {/* Epic Selector */}
            <div style={{ marginBottom: 16 }}>
              <label className="settings-label">Epic Link</label>
              <Select 
                value={issue.epic_id} 
                onChange={handleEpicChange}
                style={{ width: '100%' }}
                allowClear
                placeholder="None"
                disabled={currentUser?.role === 'Viewer'}
              >
                {epics.filter(e => e.project_id === currentProject?.id).map(e => (
                  <Option key={e.id} value={e.id}>{e.title}</Option>
                ))}
              </Select>
            </div>

            {/* Estimation (Story Points) */}
            <div style={{ marginBottom: 16 }}>
              <label className="settings-label">Story Points</label>
              <Input 
                type="number" 
                value={issue.estimate || ''} 
                onChange={handleEstimateChange}
                placeholder="None"
                disabled={currentUser?.role === 'Viewer'}
              />
            </div>

            {/* Due Date */}
            <div style={{ marginBottom: 16 }}>
              <label className="settings-label">Due Date</label>
              <DatePicker 
                value={issue.due_date ? dayjs(issue.due_date) : null}
                onChange={handleDueDateChange}
                style={{ width: '100%' }}
                disabled={currentUser?.role === 'Viewer'}
              />
            </div>

            {/* Time Tracking Widget */}
            <Divider style={{ margin: '12px 0' }} />
            <div style={{ marginBottom: 16 }}>
              <label className="settings-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Time Tracking</span>
                <ClockCircleOutlined />
              </label>
              <Progress 
                percent={Math.round((timeSpent / (timeSpent + (issue.estimate || 0) || 1)) * 100)} 
                strokeColor="#52c41a"
                trailColor="#d9d9d9"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
                <span>Logged: {timeSpent}h</span>
                <span>Estimate Left: {issue.estimate || 0}h</span>
              </div>
              {currentUser?.role !== 'Viewer' && (
                <Button 
                  size="small" 
                  onClick={() => setLogWorkVisible(true)} 
                  style={{ marginTop: 8 }}
                  block
                >
                  Log Work
                </Button>
              )}
            </div>

            {/* Attachments panel */}
            <Divider style={{ margin: '12px 0' }} />
            <div>
              <label className="settings-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Attachments</span>
                <PaperClipOutlined />
              </label>
              
              <List
                size="small"
                dataSource={issueAttachments}
                renderItem={(att) => (
                  <List.Item style={{ padding: '4px 0', fontSize: 12 }}>
                    <Space>
                      <PaperClipOutlined style={{ color: '#1677ff' }} />
                      <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block' }}>
                        {att.file_name}
                      </span>
                      <span style={{ fontSize: 10, color: '#bfbfbf' }}>
                        ({(att.size_kb / 1024).toFixed(1)}MB)
                      </span>
                    </Space>
                  </List.Item>
                )}
                locale={{ emptyText: <Text type="secondary" style={{ fontSize: 11 }}>No files attached</Text> }}
              />

              {currentUser?.role !== 'Viewer' && (
                <Button 
                  icon={<PaperClipOutlined />} 
                  onClick={handleSimulateAttachment}
                  style={{ marginTop: 8 }}
                  block
                  size="small"
                >
                  Attach File (Simulated)
                </Button>
              )}
            </div>
            
            {/* Audit Log / History Tab */}
            <Divider style={{ margin: '12px 0' }} />
            <div>
              <label className="settings-label"><HistoryOutlined /> History Log</label>
              <div className="issue-history-scroll" style={{ maxHeight: 150, overflowY: 'auto' }}>
                {issueActivity.length > 0 ? (
                  <Timeline style={{ marginTop: 8, paddingLeft: 8 }}>
                    {issueActivity.slice(-5).reverse().map(act => {
                      const actor = getUser(act.user_id);
                      return (
                        <Timeline.Item key={act.id}>
                          <div style={{ fontSize: 10 }}>
                            <strong>{actor?.name || 'System'}</strong> {act.action}
                            <div style={{ color: '#bfbfbf' }}>{dayjs(act.timestamp).format('MMM D, h:mm A')}</div>
                          </div>
                        </Timeline.Item>
                      );
                    })}
                  </Timeline>
                ) : (
                  <Text type="secondary" style={{ fontSize: 11 }}>No activity logged.</Text>
                )}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* LOG WORK MODAL */}
      <Modal
        title="Log Work"
        open={logWorkVisible}
        onCancel={() => setLogWorkVisible(false)}
        onOk={handleLogWork}
        okText="Log Hours"
      >
        <Form layout="vertical">
          <Form.Item label="Hours Spent" required>
            <Input 
              type="number" 
              value={logHours} 
              onChange={(e) => setLogHours(Number(e.target.value))}
              min={0.5} 
              step={0.5}
            />
          </Form.Item>
          <Form.Item label="Log Work Description/Notes">
            <Input.TextArea 
              value={logNote} 
              onChange={(e) => setLogNote(e.target.value)} 
              rows={3} 
              placeholder="Describe what work was completed..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};
