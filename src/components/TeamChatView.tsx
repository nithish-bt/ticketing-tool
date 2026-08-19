import React, { useState, useRef, useEffect } from 'react';
import { Card, Layout, List, Avatar, Input, Button, Typography, Space, Divider, Modal, Form, Tooltip } from 'antd';
import { SendOutlined, UserOutlined, TeamOutlined, PlusOutlined, VideoCameraOutlined, NumberOutlined } from '@ant-design/icons';
import { useTaskFlow } from '../context/TaskFlowContext';
import type { User, Channel } from '../types';

const { Sider, Content } = Layout;
const { Text, Title } = Typography;

export const TeamChatView: React.FC = () => {
  const { 
    currentUser, users, currentProject, projectMembers, 
    chatMessages, sendMessage, channels, createChannel,
    scheduleMeeting
  } = useTaskFlow();

  const projectChannels = channels.filter(c => c.project_id === currentProject?.id);
  const [selectedTarget, setSelectedTarget] = useState<{ type: 'channel' | 'dm', id: string }>({ 
    type: 'channel', 
    id: projectChannels[0]?.id || '' 
  });
  
  const [messageText, setMessageText] = useState('');
  const [isAddChannelVisible, setIsAddChannelVisible] = useState(false);
  const [form] = Form.useForm();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, selectedTarget]);

  // Handle case where project changes or channels are empty
  useEffect(() => {
    if (projectChannels.length > 0 && selectedTarget.type === 'channel' && !projectChannels.find(c => c.id === selectedTarget.id)) {
      setSelectedTarget({ type: 'channel', id: projectChannels[0].id });
    }
  }, [currentProject?.id, channels]);

  if (!currentProject || !currentUser) return null;

  const memberIds = projectMembers.filter(m => m.project_id === currentProject.id).map(m => m.user_id);
  const teamUsers = users.filter(u => memberIds.includes(u.id) && u.id !== currentUser.id);

  const currentChatMessages = chatMessages.filter(msg => {
    if (msg.project_id !== currentProject.id) return false;
    
    if (selectedTarget.type === 'channel') {
      return msg.channel_id === selectedTarget.id;
    } else {
      return (msg.sender_id === currentUser.id && msg.receiver_id === selectedTarget.id) ||
             (msg.sender_id === selectedTarget.id && msg.receiver_id === currentUser.id);
    }
  });

  const handleSend = () => {
    if (!messageText.trim()) return;
    if (selectedTarget.type === 'channel') {
      sendMessage(currentProject.id, selectedTarget.id, null, messageText);
    } else {
      sendMessage(currentProject.id, null, selectedTarget.id, messageText);
    }
    setMessageText('');
  };

  const handleCreateChannel = (values: any) => {
    createChannel(currentProject.id, values.name, values.description || '');
    setIsAddChannelVisible(false);
    form.resetFields();
    // Select newly created channel? (handled roughly via state, but we can't get ID easily here)
  };

  const handleMeetNow = () => {
    if (selectedTarget.type !== 'channel') return;
    
    const channel = projectChannels.find(c => c.id === selectedTarget.id);
    if (!channel) return;

    // Instantly create an in-app meeting for this channel
    const meetingTitle = `Meet: ${channel.name}`;
    
    scheduleMeeting({
      project_id: currentProject.id,
      channel_id: channel.id,
      title: meetingTitle,
      description: `Instant channel meeting for ${channel.name}`,
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      platform: 'In-App Room',
      link: '#',
      organizer_id: currentUser.id,
      attendee_ids: memberIds
    });
    
    sendMessage(currentProject.id, selectedTarget.id, null, `🎥 I've started an instant meeting for this channel. Go to the Meetings tab to join!`);
  };

  const getSenderName = (senderId: string) => users.find(u => u.id === senderId)?.name || 'Unknown User';
  const getSenderAvatar = (senderId: string) => users.find(u => u.id === senderId)?.avatarUrl;

  const currentChannelName = selectedTarget.type === 'channel' 
    ? projectChannels.find(c => c.id === selectedTarget.id)?.name || 'Unknown Channel'
    : null;

  return (
    <Card 
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }} 
      bodyStyle={{ padding: 0, flex: 1, display: 'flex', height: '100%' }}
    >
      <Layout style={{ background: 'transparent', height: '100%' }}>
        <Sider width={260} style={{ background: 'var(--ant-color-bg-container)', borderRight: '1px solid var(--ant-color-border-secondary)', padding: '16px 0', overflowY: 'auto' }}>
          
          <div style={{ padding: '0 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={5} style={{ margin: 0, color: 'var(--ant-color-text-secondary)' }}>Channels</Title>
            <Tooltip title="Create Channel">
              <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => setIsAddChannelVisible(true)} />
            </Tooltip>
          </div>
          
          <List
            size="small"
            dataSource={projectChannels}
            renderItem={(channel: Channel) => (
              <List.Item 
                onClick={() => setSelectedTarget({ type: 'channel', id: channel.id })}
                style={{ 
                  padding: '10px 24px', 
                  cursor: 'pointer',
                  background: selectedTarget.type === 'channel' && selectedTarget.id === channel.id ? 'var(--ant-color-primary-bg)' : 'transparent',
                  borderLeft: selectedTarget.type === 'channel' && selectedTarget.id === channel.id ? '3px solid var(--ant-color-primary)' : '3px solid transparent'
                }}
              >
                <Space>
                  <Avatar icon={<NumberOutlined />} size="small" style={{ background: selectedTarget.type === 'channel' && selectedTarget.id === channel.id ? 'var(--ant-color-primary)' : '#bfbfbf' }} />
                  <Text strong={selectedTarget.type === 'channel' && selectedTarget.id === channel.id}>{channel.name}</Text>
                </Space>
              </List.Item>
            )}
          />

          <Divider style={{ margin: '16px 0 8px' }} />

          <div style={{ padding: '0 16px 8px' }}>
            <Title level={5} style={{ margin: 0, color: 'var(--ant-color-text-secondary)' }}>Direct Messages</Title>
          </div>
          <List
            size="small"
            dataSource={teamUsers}
            renderItem={(user: User) => (
              <List.Item 
                onClick={() => setSelectedTarget({ type: 'dm', id: user.id })}
                style={{ 
                  padding: '10px 24px', 
                  cursor: 'pointer',
                  background: selectedTarget.type === 'dm' && selectedTarget.id === user.id ? 'var(--ant-color-primary-bg)' : 'transparent',
                  borderLeft: selectedTarget.type === 'dm' && selectedTarget.id === user.id ? '3px solid var(--ant-color-primary)' : '3px solid transparent'
                }}
              >
                <Space>
                  <Avatar src={user.avatarUrl} icon={<UserOutlined />} size="small" />
                  <Text strong={selectedTarget.type === 'dm' && selectedTarget.id === user.id}>{user.name}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Sider>

        <Content style={{ display: 'flex', flexDirection: 'column', background: 'var(--ant-color-bg-layout)', position: 'relative' }}>
          
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--ant-color-border-secondary)', background: 'var(--ant-color-bg-container)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar icon={selectedTarget.type === 'channel' ? <NumberOutlined /> : <UserOutlined />} size="large" style={{ background: 'var(--ant-color-primary)' }} />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {selectedTarget.type === 'channel' ? currentChannelName : getSenderName(selectedTarget.id)}
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {selectedTarget.type === 'channel' ? projectChannels.find(c => c.id === selectedTarget.id)?.description || 'Team Channel' : 'Direct Message'}
                </Text>
              </div>
            </div>

            {selectedTarget.type === 'channel' && (
              <Button type="primary" icon={<VideoCameraOutlined />} onClick={handleMeetNow} className="gradient-btn" style={{ boxShadow: '0 4px 14px 0 rgba(22, 119, 255, 0.39)' }}>
                Meet Now
              </Button>
            )}
          </div>

          <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {currentChatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar size={64} icon={selectedTarget.type === 'channel' ? <TeamOutlined /> : <UserOutlined />} style={{ background: '#e6f4ff', color: 'var(--ant-color-primary)', marginBottom: 16 }} />
                <Title level={5}>Welcome to the beginning of this conversation!</Title>
                <Text type="secondary">Be the first to say hello.</Text>
              </div>
            ) : (
              currentChatMessages.map(msg => {
                const isMine = msg.sender_id === currentUser.id;
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 12, maxWidth: '75%', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                      <Avatar src={getSenderAvatar(msg.sender_id)} icon={<UserOutlined />} />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                          <Text strong style={{ fontSize: 13 }}>{getSenderName(msg.sender_id)}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </div>
                        <div style={{ 
                          padding: '12px 16px', 
                          background: isMine ? 'var(--ant-color-primary)' : 'var(--ant-color-bg-container)', 
                          color: isMine ? '#fff' : 'inherit',
                          borderRadius: isMine ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          fontSize: 14,
                          lineHeight: 1.5
                        }}>
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '16px 24px', background: 'var(--ant-color-bg-container)', borderTop: '1px solid var(--ant-color-border-secondary)' }}>
            <Input.Group compact style={{ display: 'flex', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderRadius: 8 }}>
              <Input 
                value={messageText} 
                onChange={e => setMessageText(e.target.value)}
                onPressEnter={handleSend}
                placeholder={selectedTarget.type === 'channel' ? `Message #${currentChannelName}...` : `Message ${getSenderName(selectedTarget.id)}...`}
                style={{ flex: 1, borderRadius: '8px 0 0 8px', borderRight: 0 }}
                size="large"
                bordered={false}
                className="chat-input"
              />
              <Button type="primary" size="large" icon={<SendOutlined />} onClick={handleSend} style={{ borderRadius: '0 8px 8px 0', height: 40 }}>
                Send
              </Button>
            </Input.Group>
          </div>
        </Content>
      </Layout>

      <Modal
        title="Create a Channel"
        open={isAddChannelVisible}
        onCancel={() => { setIsAddChannelVisible(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateChannel}>
          <Form.Item name="name" label="Channel Name" rules={[{ required: true, message: 'Please enter channel name' }]}>
            <Input placeholder="e.g. general, marketing-campaign" prefix={<NumberOutlined style={{ color: '#bfbfbf' }}/>} />
          </Form.Item>
          <Form.Item name="description" label="Description (optional)">
            <Input.TextArea placeholder="What is this channel about?" />
          </Form.Item>
          <Form.Item style={{ display: 'flex', justifyContent: 'flex-end', margin: 0 }}>
            <Space>
              <Button onClick={() => setIsAddChannelVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">Create</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};
