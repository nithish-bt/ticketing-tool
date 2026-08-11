import React from 'react';
import { Typography, Card, Timeline, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useTaskFlow } from '../context/TaskFlowContext';

const { Title, Text } = Typography;

export const TimelineView: React.FC = () => {
  const { activityLogs, users, issues } = useTaskFlow();

  // Sort logs by timestamp descending
  const sortedLogs = [...activityLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const timelineItems = sortedLogs.map(log => {
    const user = users.find(u => u.id === log.user_id);
    const issue = issues.find(i => i.id === log.issue_id);

    return {
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar src={user?.avatarUrl} icon={!user?.avatarUrl && <UserOutlined />} size="small" />
            <Text strong>{user?.name || 'System'}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {new Date(log.timestamp).toLocaleString()}
            </Text>
          </div>
          <Text>
            {log.action} {issue ? <strong>({issue.key})</strong> : ''}
          </Text>
        </div>
      )
    };
  });

  return (
    <Card 
      title={<Title level={4} style={{ margin: 0 }}>Project Activity Timeline</Title>}
      style={{ minHeight: '100%', borderRadius: 12 }}
    >
      <div style={{ padding: '24px 16px' }}>
        {timelineItems.length > 0 ? (
          <Timeline mode="alternate" items={timelineItems} />
        ) : (
          <Text type="secondary">No activity logs found.</Text>
        )}
      </div>
    </Card>
  );
};
