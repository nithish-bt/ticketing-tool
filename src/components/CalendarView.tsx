import React from 'react';
import { Typography, Card, Calendar, Badge } from 'antd';
import type { Dayjs } from 'dayjs';
import { useTaskFlow } from '../context/TaskFlowContext';

const { Title } = Typography;

export const CalendarView: React.FC = () => {
  const { issues, currentProject } = useTaskFlow();

  const getListData = (value: Dayjs) => {
    let listData: { type: string; content: string }[] = [];
    const dateString = value.format('YYYY-MM-DD');

    const dayIssues = issues.filter(
      (iss) => iss.project_id === currentProject?.id && iss.due_date === dateString
    );

    dayIssues.forEach((iss) => {
      let type: 'success' | 'processing' | 'error' | 'default' | 'warning' = 'processing';
      if (iss.status === 'Done') type = 'success';
      else if (iss.priority === 'Highest') type = 'error';
      else if (iss.status === 'To Do') type = 'default';

      listData.push({ type, content: `${iss.key}: ${iss.title}` });
    });

    return listData || [];
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    return (
      <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {listData.map((item, index) => (
          <li key={index}>
            <Badge 
              status={item.type as 'success' | 'processing' | 'error' | 'default' | 'warning'} 
              text={
                <span style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '100%' }}>
                  {item.content}
                </span>
              } 
            />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card 
      title={<Title level={4} style={{ margin: 0 }}>Project Calendar</Title>}
      style={{ minHeight: '100%', borderRadius: 12 }}
    >
      <div style={{ padding: '0 16px 24px' }}>
        <Calendar cellRender={dateCellRender} />
      </div>
    </Card>
  );
};
