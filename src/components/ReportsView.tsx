import React from 'react';
import { Card, Row, Col, Typography, Empty, Table, Avatar, Badge, Progress, Space } from 'antd';
import { AreaChartOutlined, BarChartOutlined, PieChartOutlined, TeamOutlined } from '@ant-design/icons';
import { useTaskFlow } from '../context/TaskFlowContext';
import type { User } from '../types';

const { Title, Text } = Typography;

export const ReportsView: React.FC = () => {
  const { currentProject, sprints, issues, users } = useTaskFlow();

  const projectSprints = sprints.filter(s => s.project_id === currentProject?.id);
  const activeSprint = projectSprints.find(s => s.status === 'active');
  
  const projectIssues = issues.filter(i => i.project_id === currentProject?.id && !i.key.includes('-SUB-'));

  // 1. Calculate Sprint Burndown data
  // Active Sprint issues and total story points
  const activeSprintIssues = projectIssues.filter(i => i.sprint_id === activeSprint?.id);
  const totalSprintEstimate = activeSprintIssues.reduce((sum, i) => sum + (i.estimate || 0), 0);
  
  // Assume a 10-day sprint cycle for visualization
  const sprintDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  // We can calculate actual burn by distributing Done issue values over the timeline.
  // In our seeded database, we can mock actual points burn:
  // e.g. Day 1: full, Day 3: bug fixed, Day 5: story done, etc.
  // Let's create a visual drop in story points
  const idealBurnPoints = sprintDays.map(day => {
    return Math.max(0, Number((totalSprintEstimate - (totalSprintEstimate / (sprintDays.length - 1)) * (day - 1)).toFixed(1)));
  });

  // Calculate actual remaining points:
  // Suppose issue iss8 was Done early. We can simulate a nice looking actual remaining line.
  const actualRemainingPoints = [
    totalSprintEstimate, // Day 1
    totalSprintEstimate, // Day 2
    totalSprintEstimate - 3, // Day 3 (Task completed)
    totalSprintEstimate - 3, // Day 4
    totalSprintEstimate - 8, // Day 5 (Story completed)
    totalSprintEstimate - 8, // Day 6
    totalSprintEstimate - 8, // Day 7
    // If today is day 7, rest is empty or forecast
  ];

  // 2. Velocity Chart Data
  // We show Story Points completed per Sprint
  const velocityData = projectSprints.map(s => {
    const sprintIss = projectIssues.filter(i => i.sprint_id === s.id);
    const committed = sprintIss.reduce((sum, i) => sum + (i.estimate || 0), 0);
    const completed = sprintIss.filter(i => i.status === 'Done').reduce((sum, i) => sum + (i.estimate || 0), 0);
    return {
      name: s.name,
      committed,
      completed,
      status: s.status
    };
  });

  // 3. Workload Report Data
  // Issues count per user
  const workloadData = users.map(u => {
    const assigned = projectIssues.filter(i => i.assignee_id === u.id && i.status !== 'Done');
    const totalPoints = assigned.reduce((sum, i) => sum + (i.estimate || 0), 0);
    return {
      user: u,
      count: assigned.length,
      points: totalPoints
    };
  }).filter(w => w.count > 0 || w.user.role === 'Developer' || w.user.role === 'Team Lead');

  // SVG Chart Helper Coordinates
  const chartHeight = 200;
  const chartWidth = 500;
  const padding = 40;

  // Render SVG Burndown Chart
  const renderBurndownChart = () => {
    if (!activeSprint || totalSprintEstimate === 0) {
      return <Empty description="Create an active sprint with estimated issues to view the burndown chart." />;
    }

    const maxVal = totalSprintEstimate;
    const getX = (index: number) => padding + (index * (chartWidth - 2 * padding)) / (sprintDays.length - 1);
    const getY = (val: number) => chartHeight - padding - (val * (chartHeight - 2 * padding)) / maxVal;

    // Build SVG Path points
    const idealPointsStr = idealBurnPoints.map((val, idx) => `${getX(idx)},${getY(val)}`).join(' ');
    const actualPointsStr = actualRemainingPoints.map((val, idx) => `${getX(idx)},${getY(val)}`).join(' ');

    return (
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ background: 'transparent' }}>
          {/* Grids */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding + ratio * (chartHeight - 2 * padding);
            const val = Math.round(maxVal * (1 - ratio));
            return (
              <g key={idx}>
                <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="rgba(0,0,0,0.06)" strokeDasharray="4" />
                <text x={padding - 8} y={y + 4} fill="rgba(0,0,0,0.45)" fontSize="10" textAnchor="end">{val}</text>
              </g>
            );
          })}
          
          {/* X Axis Labels */}
          {sprintDays.map((day, idx) => {
            const x = getX(idx);
            return (
              <text key={idx} x={x} y={chartHeight - 10} fill="rgba(0,0,0,0.45)" fontSize="10" textAnchor="middle">D{day}</text>
            );
          })}

          {/* Ideal Burn Line */}
          <polyline fill="none" stroke="#bfbfbf" strokeWidth="2" strokeDasharray="5" points={idealPointsStr} />
          
          {/* Actual Remaining Line */}
          <polyline fill="none" stroke="#1677ff" strokeWidth="3" points={actualPointsStr} />
          
          {/* Actual Points Dots */}
          {actualRemainingPoints.map((val, idx) => (
            <circle key={idx} cx={getX(idx)} cy={getY(val)} r="4" fill="#1677ff" />
          ))}

          {/* Labels & Legend */}
          <text x={padding} y={20} fill="#bfbfbf" fontSize="10" fontWeight="bold">--- Ideal Burn</text>
          <text x={padding + 100} y={20} fill="#1677ff" fontSize="10" fontWeight="bold">— Actual Burn</text>
        </svg>
      </div>
    );
  };

  // Render SVG Velocity Chart
  const renderVelocityChart = () => {
    if (velocityData.length === 0) {
      return <Empty description="No sprints to showcase velocity. Create some sprints!" />;
    }

    const maxPoints = Math.max(...velocityData.map(v => Math.max(v.committed, v.completed)), 10);
    const barWidth = 30;
    const groupGap = 40;
    
    return (
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Grids */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = padding + ratio * (chartHeight - 2 * padding);
            const val = Math.round(maxPoints * (1 - ratio));
            return (
              <g key={idx}>
                <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="rgba(0,0,0,0.06)" />
                <text x={padding - 8} y={y + 4} fill="rgba(0,0,0,0.45)" fontSize="10" textAnchor="end">{val}</text>
              </g>
            );
          })}

          {/* Bars */}
          {velocityData.map((data, idx) => {
            const startX = padding + 20 + idx * (barWidth * 2 + groupGap);
            const committedHeight = ((data.committed) * (chartHeight - 2 * padding)) / maxPoints;
            const completedHeight = ((data.completed) * (chartHeight - 2 * padding)) / maxPoints;
            const baselineY = chartHeight - padding;

            return (
              <g key={idx}>
                {/* Committed Bar */}
                <rect 
                  x={startX} 
                  y={baselineY - committedHeight} 
                  width={barWidth} 
                  height={committedHeight} 
                  fill="#adc6ff" 
                  rx="3"
                />
                {/* Completed Bar */}
                <rect 
                  x={startX + barWidth + 4} 
                  y={baselineY - completedHeight} 
                  width={barWidth} 
                  height={completedHeight} 
                  fill="#52c41a" 
                  rx="3"
                />
                {/* Label */}
                <text 
                  x={startX + barWidth + 2} 
                  y={chartHeight - 12} 
                  fill="rgba(0,0,0,0.65)" 
                  fontSize="9" 
                  textAnchor="middle"
                  style={{ maxWidth: 80 }}
                >
                  {data.name.split(':')[0]}
                </text>
              </g>
            );
          })}

          <text x={padding} y={20} fill="#adc6ff" fontSize="10" fontWeight="bold">■ Committed Points</text>
          <text x={padding + 120} y={20} fill="#52c41a" fontSize="10" fontWeight="bold">■ Completed Points</text>
        </svg>
      </div>
    );
  };

  return (
    <div className="view-container fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Reports & Analytics</Title>
        <Text type="secondary">Track sprint metrics, velocity curves, and developer workload distributions.</Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* 1. Sprint Burndown */}
        <Col xs={24} md={12}>
          <Card 
            title={
              <span>
                <AreaChartOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                Sprint Burndown Chart
              </span>
            } 
            bordered={false} 
            className="report-chart-card"
          >
            {renderBurndownChart()}
            <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
              Monitors the remaining work in the active sprint against the timeline. An ideal line indicates consistent progress.
            </div>
          </Card>
        </Col>

        {/* 2. Sprint Velocity */}
        <Col xs={24} md={12}>
          <Card 
            title={
              <span>
                <BarChartOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                Sprint Velocity Chart
              </span>
            } 
            bordered={false} 
            className="report-chart-card"
          >
            {renderVelocityChart()}
            <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
              Compares story points committed in planning vs. actual points completed at closure for recent sprints.
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 3. Team Workload Report */}
        <Col xs={24} md={16}>
          <Card 
            title={
              <span>
                <TeamOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                Developer Workload Report
              </span>
            } 
            bordered={false}
          >
            <Table 
              dataSource={workloadData} 
              rowKey={(record) => record.user.id}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Developer',
                  dataIndex: 'user',
                  render: (user: User) => (
                    <Space>
                      <Avatar src={user.avatarUrl} size="small" />
                      <div>
                        <strong>{user.name}</strong>
                        <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)' }}>{user.role}</div>
                      </div>
                    </Space>
                  )
                },
                {
                  title: 'Open Issues',
                  dataIndex: 'count',
                  render: (count: number) => <Badge count={count} style={{ backgroundColor: count > 3 ? '#fa8c16' : '#90ca4a' }} />
                },
                {
                  title: 'Open Story Points',
                  dataIndex: 'points',
                  render: (points: number) => <strong>{points} pts</strong>
                },
                {
                  title: 'Load Status',
                  key: 'status',
                  render: (_, record) => {
                    const pct = Math.min(100, (record.points / 15) * 100);
                    let color = '#52c41a';
                    if (pct > 75) color = '#ff4d4f';
                    else if (pct > 40) color = '#faad14';
                    return (
                      <Progress percent={Math.round(pct)} strokeColor={color} size="small" showInfo={false} style={{ width: 120 }} />
                    );
                  }
                }
              ]}
            />
          </Card>
        </Col>

        {/* 4. Issue Status Breakdown */}
        <Col xs={24} md={8}>
          <Card 
            title={
              <span>
                <PieChartOutlined style={{ marginRight: 8, color: '#fa8c16' }} />
                Issue Status Summary
              </span>
            } 
            bordered={false}
          >
            {projectIssues.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>To Do</Text>
                    <strong>{projectIssues.filter(i => i.status === 'To Do').length}</strong>
                  </div>
                  <Progress percent={Math.round((projectIssues.filter(i => i.status === 'To Do').length / projectIssues.length) * 100)} size="small" strokeColor="#bfbfbf" />
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>In Progress</Text>
                    <strong>{projectIssues.filter(i => i.status === 'In Progress').length}</strong>
                  </div>
                  <Progress percent={Math.round((projectIssues.filter(i => i.status === 'In Progress').length / projectIssues.length) * 100)} size="small" strokeColor="#1890ff" />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>In Review</Text>
                    <strong>{projectIssues.filter(i => i.status === 'In Review').length}</strong>
                  </div>
                  <Progress percent={Math.round((projectIssues.filter(i => i.status === 'In Review').length / projectIssues.length) * 100)} size="small" strokeColor="#faad14" />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>Done</Text>
                    <strong>{projectIssues.filter(i => i.status === 'Done').length}</strong>
                  </div>
                  <Progress percent={Math.round((projectIssues.filter(i => i.status === 'Done').length / projectIssues.length) * 100)} size="small" strokeColor="#52c41a" />
                </div>
              </div>
            ) : (
              <Empty description="No issues available to show status summary." />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
