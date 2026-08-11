import React, { useState, useRef, useEffect } from 'react';
import { Card, Layout, List, Avatar, Input, Button, Typography, Space, Divider } from 'antd';
import { SendOutlined, UserOutlined, TeamOutlined } from '@ant-design/icons';
import { useTaskFlow } from '../context/TaskFlowContext';
import type { User } from '../types';

const { Sider, Content } = Layout;
const { Text, Title } = Typography;

export const TeamChatView: React.FC = () => {
  const { currentUser, users, currentProject, projectMembers, chatMessages, sendMessage } = useTaskFlow();
  const [selectedReceiverId, setSelectedReceiverId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, selectedReceiverId]);

  if (!currentProject || !currentUser) return null;

  // Get project members
  const memberIds = projectMembers.filter(m => m.project_id === currentProject.id).map(m => m.user_id);
  const teamUsers = users.filter(u => memberIds.includes(u.id) && u.id !== currentUser.id);

  // Filter messages for current view
  const currentChatMessages = chatMessages.filter(msg => {
    if (msg.project_id !== currentProject.id) return false;
    
    if (selectedReceiverId === null) {
      // Team Channel: receiver_id is null
      return msg.receiver_id === null;
    } else {
      // Direct Message
      return (msg.sender_id === currentUser.id && msg.receiver_id === selectedReceiverId) ||
             (msg.sender_id === selectedReceiverId && msg.receiver_id === currentUser.id);
    }
  });

  const handleSend = () => {
    if (!messageText.trim()) return;
    sendMessage(currentProject.id, selectedReceiverId, messageText);
    setMessageText('');
  };

  const getSenderName = (senderId: string) => {
    return users.find(u => u.id === senderId)?.name || 'Unknown User';
  };

  const getSenderAvatar = (senderId: string) => {
    return users.find(u => u.id === senderId)?.avatarUrl;
  };

  return (
    <Card 
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }} 
      bodyStyle={{ padding: 0, flex: 1, display: 'flex', height: '100%' }}
    >
      <Layout style={{ background: 'transparent', height: '100%' }}>
        <Sider width={250} style={{ background: 'var(--ant-color-bg-container)', borderRight: '1px solid var(--ant-color-border-secondary)', padding: '16px 0' }}>
          <div style={{ padding: '0 16px 16px' }}>
            <Title level={5} style={{ margin: 0 }}>Channels</Title>
          </div>
          <List
            size="small"
            dataSource={[{ id: null, name: 'Team Channel' }]}
            renderItem={item => (
              <List.Item 
                onClick={() => setSelectedReceiverId(item.id)}
                style={{ 
                  padding: '12px 24px', 
                  cursor: 'pointer',
                  background: selectedReceiverId === null ? 'var(--ant-color-primary-bg)' : 'transparent',
                  borderLeft: selectedReceiverId === null ? '3px solid var(--ant-color-primary)' : '3px solid transparent'
                }}
              >
                <Space>
                  <Avatar icon={<TeamOutlined />} size="small" style={{ background: 'var(--ant-color-primary)' }} />
                  <Text strong={selectedReceiverId === null}>{item.name}</Text>
                </Space>
              </List.Item>
            )}
          />

          <Divider style={{ margin: '12px 0' }} />

          <div style={{ padding: '0 16px 8px' }}>
            <Title level={5} style={{ margin: 0 }}>Direct Messages</Title>
          </div>
          <List
            size="small"
            dataSource={teamUsers}
            style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}
            renderItem={(user: User) => (
              <List.Item 
                onClick={() => setSelectedReceiverId(user.id)}
                style={{ 
                  padding: '12px 24px', 
                  cursor: 'pointer',
                  background: selectedReceiverId === user.id ? 'var(--ant-color-primary-bg)' : 'transparent',
                  borderLeft: selectedReceiverId === user.id ? '3px solid var(--ant-color-primary)' : '3px solid transparent'
                }}
              >
                <Space>
                  <Avatar src={user.avatarUrl} icon={<UserOutlined />} size="small" />
                  <Text strong={selectedReceiverId === user.id}>{user.name}</Text>
                </Space>
              </List.Item>
            )}
          />
        </Sider>

        <Content style={{ display: 'flex', flexDirection: 'column', background: 'var(--ant-color-bg-layout)', position: 'relative' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--ant-color-border-secondary)', background: 'var(--ant-color-bg-container)' }}>
            <Title level={4} style={{ margin: 0 }}>
              {selectedReceiverId === null ? 'Team Channel' : getSenderName(selectedReceiverId)}
            </Title>
          </div>

          <div style={{ flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {currentChatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: 40 }}>
                <Text type="secondary">No messages yet. Start the conversation!</Text>
              </div>
            ) : (
              currentChatMessages.map(msg => {
                const isMine = msg.sender_id === currentUser.id;
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 12, maxWidth: '70%', flexDirection: isMine ? 'row-reverse' : 'row' }}>
                      <Avatar src={getSenderAvatar(msg.sender_id)} icon={<UserOutlined />} />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 4 }}>
                          <Text strong style={{ fontSize: 13 }}>{getSenderName(msg.sender_id)}</Text>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </div>
                        <div style={{ 
                          padding: '10px 16px', 
                          background: isMine ? 'var(--ant-color-primary)' : 'var(--ant-color-bg-container)', 
                          color: isMine ? '#fff' : 'inherit',
                          borderRadius: isMine ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
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
            <Input.Group compact style={{ display: 'flex' }}>
              <Input 
                value={messageText} 
                onChange={e => setMessageText(e.target.value)}
                onPressEnter={handleSend}
                placeholder={selectedReceiverId === null ? "Message the team..." : "Send a direct message..."}
                style={{ flex: 1, borderRadius: '8px 0 0 8px' }}
                size="large"
              />
              <Button type="primary" size="large" icon={<SendOutlined />} onClick={handleSend} style={{ borderRadius: '0 8px 8px 0' }}>
                Send
              </Button>
            </Input.Group>
          </div>
        </Content>
      </Layout>
    </Card>
  );
};
