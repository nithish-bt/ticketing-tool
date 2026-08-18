import React, { useState } from 'react';
import { Card, Button, List, Avatar, Modal, Form, Input, Select, DatePicker, Row, Col, Space, Typography, Tag, Tooltip } from 'antd';
import { VideoCameraOutlined, PlusOutlined, UserOutlined, ClockCircleOutlined, GlobalOutlined } from '@ant-design/icons';
import { useTaskFlow } from '../context/TaskFlowContext';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const MeetingsView: React.FC = () => {
  const { currentProject, meetings, users, currentUser, scheduleMeeting, joinMeeting } = useTaskFlow();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Filter meetings by current project
  const projectMeetings = meetings.filter(m => m.project_id === currentProject?.id);

  const handleScheduleSubmit = (values: any) => {
    if (!currentProject || !currentUser) return;

    scheduleMeeting({
      project_id: currentProject.id,
      title: values.title,
      description: values.description || '',
      start_time: values.dateRange[0].toISOString(),
      end_time: values.dateRange[1].toISOString(),
      platform: values.platform,
      link: values.platform === 'In-App Room' ? '#' : values.link,
      organizer_id: currentUser.id,
      attendee_ids: values.attendee_ids || []
    });

    setIsModalVisible(false);
    form.resetFields();
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'Google Meet': return 'green';
      case 'Microsoft Teams': return 'geekblue';
      case 'Zoom': return 'blue';
      case 'In-App Room': return 'purple';
      default: return 'default';
    }
  };

  return (
    <div className="view-container slide-up-fade-in p-6">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Meetings</Title>
          <Text type="secondary">Schedule and join team meetings for {currentProject?.name}</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => setIsModalVisible(true)}
          disabled={!currentProject || currentUser?.role === 'Viewer'}
        >
          Schedule Meeting
        </Button>
      </div>

      <List
        grid={{ gutter: 24, column: 1, xxl: 2 }}
        dataSource={projectMeetings}
        locale={{ emptyText: 'No meetings scheduled for this project yet.' }}
        renderItem={meeting => {
          const organizer = users.find(u => u.id === meeting.organizer_id);
          const attendees = users.filter(u => meeting.attendee_ids.includes(u.id));
          
          return (
            <List.Item>
              <Card 
                hoverable 
                style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
                bodyStyle={{ padding: 24 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <Tag color={getPlatformColor(meeting.platform)} style={{ borderRadius: 4, padding: '2px 8px' }}>
                        {meeting.platform}
                      </Tag>
                      <Text type="secondary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ClockCircleOutlined /> 
                        {dayjs(meeting.start_time).format('MMM D, YYYY • h:mm A')} - {dayjs(meeting.end_time).format('h:mm A')}
                      </Text>
                    </div>
                    
                    <Title level={4} style={{ margin: '0 0 8px 0' }}>{meeting.title}</Title>
                    <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ marginBottom: 16 }}>
                      {meeting.description || 'No description provided.'}
                    </Paragraph>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Organizer:</Text>
                        <Avatar size="small" src={organizer?.avatarUrl} icon={<UserOutlined />} />
                        <Text strong style={{ fontSize: 13 }}>{organizer?.name}</Text>
                      </div>
                      
                      {attendees.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>Attendees:</Text>
                          <Avatar.Group maxCount={3} size="small" maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf' }}>
                            {attendees.map(a => (
                              <Tooltip key={a.id} title={a.name}>
                                <Avatar src={a.avatarUrl} icon={<UserOutlined />} />
                              </Tooltip>
                            ))}
                          </Avatar.Group>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                    {meeting.platform === 'In-App Room' ? (
                      <Button 
                        type="primary" 
                        shape="round" 
                        icon={<VideoCameraOutlined />} 
                        size="large"
                        onClick={() => joinMeeting(meeting.id)}
                        className="gradient-btn"
                        style={{ boxShadow: '0 4px 14px 0 rgba(22, 119, 255, 0.39)', background: '#722ed1', borderColor: '#722ed1' }}
                      >
                        Join In-App
                      </Button>
                    ) : (
                      <Button 
                        type="primary" 
                        shape="round" 
                        icon={<VideoCameraOutlined />} 
                        size="large"
                        href={meeting.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gradient-btn"
                        style={{ boxShadow: '0 4px 14px 0 rgba(22, 119, 255, 0.39)' }}
                      >
                        Join
                      </Button>
                    )}
                    {meeting.platform !== 'In-App Room' && (
                      <Button 
                        type="text" 
                        icon={<GlobalOutlined />} 
                        href={meeting.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Copy Link
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </List.Item>
          );
        }}
      />

      {/* Schedule Meeting Modal */}
      <Modal
        title="Schedule a Meeting"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleScheduleSubmit} 
          initialValues={{ platform: 'Google Meet' }}
          style={{ marginTop: 16 }}
        >
          <Form.Item 
            name="title" 
            label="Meeting Title" 
            rules={[{ required: true, message: 'Please input meeting title!' }]}
          >
            <Input placeholder="e.g., Sprint Planning, Design Sync" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="platform" 
                label="Platform" 
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="In-App Room">In-App Room</Option>
                  <Option value="Google Meet">Google Meet</Option>
                  <Option value="Microsoft Teams">Microsoft Teams</Option>
                  <Option value="Zoom">Zoom</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="dateRange" 
                label="Date & Time" 
                rules={[{ required: true, message: 'Please select date and time!' }]}
              >
                <DatePicker.RangePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.platform !== currentValues.platform}
          >
            {({ getFieldValue }) => 
              getFieldValue('platform') !== 'In-App Room' ? (
                <Form.Item 
                  name="link" 
                  label="Meeting Link" 
                  rules={[
                    { required: true, message: 'Please provide the meeting link!' },
                    { type: 'url', message: 'Please enter a valid URL!' }
                  ]}
                >
                  <Input placeholder="https://meet.google.com/..." prefix={<GlobalOutlined style={{ color: '#bfbfbf' }} />} />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item name="description" label="Description / Agenda">
            <Input.TextArea placeholder="What is this meeting about?" rows={3} />
          </Form.Item>

          <Form.Item name="attendee_ids" label="Invite Attendees">
            <Select 
              mode="multiple" 
              placeholder="Select team members" 
              allowClear
              optionLabelProp="label"
            >
              {users.map(u => (
                <Option key={u.id} value={u.id} label={u.name}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar size="small" src={u.avatarUrl} />
                    <span>{u.name}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', margin: 0, marginTop: 24 }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Schedule</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
