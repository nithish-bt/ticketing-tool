import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, Button, InputNumber, Input, Select, 
  Typography, Row, Col, Progress, Space, Divider, 
  Tooltip, message, Tag, Badge
} from 'antd';
import { 
  LeftOutlined, RightOutlined, PlusOutlined, 
  ClockCircleOutlined, PlayCircleOutlined, 
  CheckCircleOutlined, CloseCircleOutlined, 
  CalendarOutlined, SaveOutlined 
} from '@ant-design/icons';
import { useTaskFlow } from '../context/TaskFlowContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const TimesheetView: React.FC = () => {
  const { 
    currentProject, issues, worklogs, currentUser,
    addWorklog, activeTimer, startTimer, stopTimer, cancelTimer 
  } = useTaskFlow();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [timesheetRows, setTimesheetRows] = useState<string[]>([]); // list of issue IDs in timesheet
  
  // Grid input states: mapping of issueId -> dayIndex (0-6) -> hours (number)
  const [gridInputs, setGridInputs] = useState<Record<string, number[]>>({});
  // Notes mapping: issueId -> note string
  const [gridNotes, setGridNotes] = useState<Record<string, string>>({});
  // Selected issue to add to timesheet
  const [selectedIssueId, setSelectedIssueId] = useState<string | undefined>(undefined);
  
  // Local timer ticking state
  const [timerNotes, setTimerNotes] = useState('');
  const [elapsedTimeStr, setElapsedTimeStr] = useState('00:00:00');
  const timerIntervalRef = useRef<any>(null);

  // Helper: Get start of week (Monday)
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const startOfWeek = getStartOfWeek(currentDate);

  // Helper: Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  const weekDayShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Format date to YYYY-MM-DD local format
  const formatLocalDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Filter issues for project
  const projectIssues = issues.filter(i => i.project_id === currentProject?.id);
  // Auto-populate timesheet with tasks assigned to the user
  useEffect(() => {
    if (currentUser) {
      const assignedIssueIds = projectIssues
        .filter(i => i.assignee_id === currentUser.id && i.status !== 'Done')
        .map(i => i.id);
      
      // Merge unique
      setTimesheetRows(prev => {
        const unique = new Set([...prev, ...assignedIssueIds]);
        return Array.from(unique);
      });
    }
  }, [currentProject, currentUser, issues]);

  // Load existing worklogs for the current week to show as "already logged"
  const getExistingLoggedHours = (issueId: string, dayIndex: number): number => {
    if (!currentUser) return 0;
    const dateStr = formatLocalDate(weekDays[dayIndex]);
    const dayLogs = worklogs.filter(w => 
      w.issue_id === issueId && 
      w.user_id === currentUser.id && 
      w.logged_date === dateStr
    );
    return dayLogs.reduce((sum, log) => sum + log.time_spent, 0);
  };

  // Update elapsed time for live timer
  useEffect(() => {
    if (activeTimer) {
      const updateElapsed = () => {
        const diffMs = Date.now() - new Date(activeTimer.startTime).getTime();
        const totalSecs = Math.floor(diffMs / 1000);
        const hrs = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
        const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
        const secs = String(totalSecs % 60).padStart(2, '0');
        setElapsedTimeStr(`${hrs}:${mins}:${secs}`);
      };

      updateElapsed();
      timerIntervalRef.current = setInterval(updateElapsed, 1000);
    } else {
      setElapsedTimeStr('00:00:00');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [activeTimer]);

  const handleWeekPrev = () => {
    const prev = new Date(currentDate);
    prev.setDate(currentDate.getDate() - 7);
    setCurrentDate(prev);
  };

  const handleWeekNext = () => {
    const next = new Date(currentDate);
    next.setDate(currentDate.getDate() + 7);
    setCurrentDate(next);
  };

  const handleInputChange = (issueId: string, dayIndex: number, val: number | null) => {
    setGridInputs(prev => {
      const row = prev[issueId] ? [...prev[issueId]] : Array(7).fill(0);
      row[dayIndex] = val || 0;
      return { ...prev, [issueId]: row };
    });
  };

  const handleNoteChange = (issueId: string, val: string) => {
    setGridNotes(prev => ({ ...prev, [issueId]: val }));
  };

  const handleAddRow = () => {
    if (!selectedIssueId) return;
    if (timesheetRows.includes(selectedIssueId)) {
      message.warning('This task is already in your timesheet.');
      return;
    }
    setTimesheetRows(prev => [...prev, selectedIssueId]);
    setSelectedIssueId(undefined);
    message.success('Task added to timesheet.');
  };

  const handleRemoveRow = (issueId: string) => {
    setTimesheetRows(prev => prev.filter(id => id !== issueId));
    // Clean up input fields
    setGridInputs(prev => {
      const next = { ...prev };
      delete next[issueId];
      return next;
    });
    setGridNotes(prev => {
      const next = { ...prev };
      delete next[issueId];
      return next;
    });
  };

  const handleSaveTimesheet = () => {
    if (!currentUser) return;
    let logCount = 0;

    Object.keys(gridInputs).forEach(issueId => {
      const hoursArray = gridInputs[issueId];
      const note = gridNotes[issueId] || 'Logged hours via weekly timesheet';

      hoursArray.forEach((hours, dayIdx) => {
        if (hours > 0) {
          const targetDateStr = formatLocalDate(weekDays[dayIdx]);
          addWorklog(issueId, hours, note, targetDateStr);
          logCount++;
        }
      });
    });

    if (logCount > 0) {
      message.success(`Successfully logged ${logCount} work entries!`);
      // Reset inputs
      setGridInputs({});
      setGridNotes({});
    } else {
      message.info('No hours entered to log.');
    }
  };

  // Calculate stats for this week
  const getLoggedTotalForDay = (dayIdx: number): number => {
    let sum = 0;
    timesheetRows.forEach(id => {
      sum += getExistingLoggedHours(id, dayIdx);
    });
    return sum;
  };

  const getNewInputTotalForDay = (dayIdx: number): number => {
    let sum = 0;
    Object.keys(gridInputs).forEach(issueId => {
      sum += gridInputs[issueId][dayIdx] || 0;
    });
    return sum;
  };

  const totalLoggedThisWeek = weekDays.reduce((sum, _, idx) => sum + getLoggedTotalForDay(idx), 0);
  const totalNewThisWeek = weekDays.reduce((sum, _, idx) => sum + getNewInputTotalForDay(idx), 0);
  
  const weekTotal = totalLoggedThisWeek + totalNewThisWeek;
  const progressPercent = Math.min(100, Math.round((weekTotal / 40) * 100));

  // Render SVG Weekly Chart
  const renderWeeklyBreakdownChart = () => {
    const chartHeight = 160;
    const chartWidth = 320;
    const padding = 30;
    const maxHours = Math.max(12, ...weekDays.map((_, idx) => getLoggedTotalForDay(idx) + getNewInputTotalForDay(idx)));

    const getX = (idx: number) => padding + 15 + idx * ((chartWidth - padding * 2) / 7);
    const barWidth = 14;

    return (
      <svg width="100%" height={chartHeight} style={{ background: 'transparent' }}>
        {/* Y Axis Grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padding + ratio * (chartHeight - 2 * padding);
          const val = Math.round(maxHours * (1 - ratio));
          return (
            <g key={idx}>
              <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="rgba(0,0,0,0.06)" />
              <text x={padding - 6} y={y + 4} fill="rgba(0,0,0,0.45)" fontSize="9" textAnchor="end">{val}h</text>
            </g>
          );
        })}

        {/* X Axis labels & bars */}
        {weekDays.map((_, idx) => {
          const x = getX(idx);
          const loggedVal = getLoggedTotalForDay(idx);
          const newVal = getNewInputTotalForDay(idx);
          
          const loggedHeight = (loggedVal * (chartHeight - padding * 2)) / maxHours;
          const newHeight = (newVal * (chartHeight - padding * 2)) / maxHours;
          const yBaseline = chartHeight - padding;

          return (
            <g key={idx}>
              {/* Logged hours bar */}
              <rect 
                x={x - barWidth / 2} 
                y={yBaseline - loggedHeight} 
                width={barWidth} 
                height={loggedHeight} 
                fill="#52c41a" 
                rx="2"
              />
              {/* New hours bar (stacked) */}
              <rect 
                x={x - barWidth / 2} 
                y={yBaseline - loggedHeight - newHeight} 
                width={barWidth} 
                height={newHeight} 
                fill="#1677ff" 
                rx="2"
                opacity="0.8"
              />
              {/* Short day label */}
              <text x={x} y={chartHeight - 10} fill="rgba(0,0,0,0.45)" fontSize="9" textAnchor="middle">
                {weekDayShort[idx]}
              </text>
              {/* Value label if > 0 */}
              {(loggedVal + newVal > 0) && (
                <text x={x} y={yBaseline - loggedHeight - newHeight - 4} fill="rgba(0,0,0,0.85)" fontSize="9" textAnchor="middle">
                  {loggedVal + newVal}h
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="view-container fade-in">
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Timesheet Board</Title>
          <Text type="secondary">Track weekly work hours and monitor active tasks for project <strong>{currentProject?.name}</strong>.</Text>
        </div>
        
        {/* Date Selector */}
        <Card size="small" bodyStyle={{ padding: '6px 12px' }} style={{ borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
          <Space>
            <Button type="text" size="small" icon={<LeftOutlined />} onClick={handleWeekPrev} />
            <Text style={{ fontWeight: 600 }}>
              <CalendarOutlined style={{ marginRight: 6 }} />
              {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
            <Button type="text" size="small" icon={<RightOutlined />} onClick={handleWeekNext} />
          </Space>
        </Card>
      </div>

      <Row gutter={[16, 16]}>
        {/* Main Timesheet Card */}
        <Col xs={24} lg={17}>
          <Card 
            title={<strong>Timesheet Grid</strong>} 
            bordered={false} 
            bodyStyle={{ padding: 0 }}
            style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}
            extra={
              <Space>
                <Select 
                  placeholder="Select task to add" 
                  style={{ width: 280 }}
                  value={selectedIssueId}
                  onChange={setSelectedIssueId}
                  allowClear
                >
                  {projectIssues.filter(i => i.type !== 'Sub-task').map(i => (
                    <Option key={i.id} value={i.id}>{i.key} — {i.title}</Option>
                  ))}
                </Select>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRow} disabled={!selectedIssueId}>
                  Add Row
                </Button>
              </Space>
            }
          >
            {timesheetRows.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="timesheet-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                      <th style={{ padding: '16px 12px', width: 280 }}>Task / Issue</th>
                      {weekDays.map((day, idx) => (
                        <th key={idx} style={{ padding: '16px 8px', textAlign: 'center', width: 70 }}>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{weekDayShort[idx]}</div>
                          <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)', fontWeight: 400 }}>{day.getDate()}</div>
                        </th>
                      ))}
                      <th style={{ padding: '16px 12px', textAlign: 'center', width: 80 }}>Total</th>
                      <th style={{ padding: '16px 12px', width: 50 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {timesheetRows.map(issueId => {
                      const issue = issues.find(i => i.id === issueId);
                      if (!issue) return null;

                      // Calculate row totals
                      const rowLoggedTotal = weekDays.reduce((sum, _, idx) => sum + getExistingLoggedHours(issueId, idx), 0);
                      const rowNewTotal = weekDays.reduce((sum, _, idx) => sum + (gridInputs[issueId]?.[idx] || 0), 0);

                      return (
                        <React.Fragment key={issueId}>
                          {/* Logged Hours Row */}
                          <tr style={{ borderBottom: '1px dashed #f0f0f0', background: 'rgba(250,250,250,0.4)' }}>
                            <td style={{ padding: '12px 12px' }}>
                              <div>
                                <Tag color={issue.type === 'Story' ? 'blue' : issue.type === 'Bug' ? 'red' : 'green'} style={{ fontSize: 10 }}>
                                  {issue.key}
                                </Tag>
                                <span style={{ fontWeight: 500, fontSize: 13 }}>{issue.title}</span>
                              </div>
                              <div style={{ fontSize: 11, color: '#52c41a', marginTop: 4 }}>
                                <CheckCircleOutlined style={{ marginRight: 4 }} /> Already Logged
                              </div>
                            </td>
                            {weekDays.map((_, idx) => {
                              const logged = getExistingLoggedHours(issueId, idx);
                              return (
                                <td key={idx} style={{ padding: '12px 8px', textAlign: 'center', color: '#52c41a', fontWeight: 600 }}>
                                  {logged > 0 ? `${logged}h` : '-'}
                                </td>
                              );
                            })}
                            <td style={{ padding: '12px 12px', textAlign: 'center', color: '#52c41a', fontWeight: 600 }}>
                              {rowLoggedTotal > 0 ? `${rowLoggedTotal}h` : '-'}
                            </td>
                            <td style={{ padding: '12px 12px' }}></td>
                          </tr>
                          
                          {/* Log New Hours Row */}
                          <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '12px 12px' }}>
                              <Input 
                                size="small" 
                                placeholder="Add worklog description..." 
                                value={gridNotes[issueId] || ''}
                                onChange={(e) => handleNoteChange(issueId, e.target.value)}
                                style={{ borderRadius: 4 }}
                              />
                            </td>
                            {weekDays.map((_, idx) => (
                              <td key={idx} style={{ padding: '8px', textAlign: 'center' }}>
                                <InputNumber 
                                  size="small"
                                  min={0}
                                  max={24}
                                  precision={1}
                                  value={gridInputs[issueId]?.[idx]}
                                  onChange={(val) => handleInputChange(issueId, idx, val)}
                                  placeholder="0"
                                  style={{ width: '100%', borderRadius: 4 }}
                                />
                              </td>
                            ))}
                            <td style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 700, color: '#1677ff' }}>
                              {rowNewTotal > 0 ? `+${rowNewTotal}h` : '-'}
                            </td>
                            <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                              <Tooltip title="Remove row from timesheet">
                                <Button 
                                  type="text" 
                                  danger 
                                  size="small" 
                                  icon={<CloseCircleOutlined />} 
                                  onClick={() => handleRemoveRow(issueId)} 
                                />
                              </Tooltip>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 20 }}>
                  <Button 
                    type="primary" 
                    icon={<SaveOutlined />} 
                    onClick={handleSaveTimesheet}
                    className="gradient-btn"
                  >
                    Save Timesheet Logs
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <CalendarOutlined style={{ fontSize: 40, color: 'rgba(0,0,0,0.15)', marginBottom: 16 }} />
                <Paragraph type="secondary">No active work items added to your timesheet yet.</Paragraph>
                <Text type="secondary" style={{ fontSize: 12 }}>Select a project task from the dropdown at the top right to start logging hours.</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Sidebar Summary & Work Timer Cards */}
        <Col xs={24} lg={7}>
          {/* Card 1: Time Summary */}
          <Card 
            title={<strong>Timesheet Summary</strong>} 
            bordered={false} 
            style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 16 }}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Hours Logged This Week</div>
              <div style={{ fontSize: 36, fontWeight: 700, margin: '8px 0', color: '#1677ff' }}>
                {weekTotal} <span style={{ fontSize: 16, fontWeight: 500, color: 'rgba(0,0,0,0.45)' }}>/ 40h</span>
              </div>
              <Progress percent={progressPercent} strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            {/* Daily Breakdown SVG mini chart */}
            <div style={{ padding: '8px 0' }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>Daily Logging Breakdown</div>
              {renderWeeklyBreakdownChart()}
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'space-between', fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, background: '#52c41a', marginRight: 4, borderRadius: 2 }}></span>Logged</span>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, background: '#1677ff', marginRight: 4, borderRadius: 2 }}></span>New (Draft)</span>
            </div>
          </Card>

          {/* Card 2: Live Work Timer */}
          <Card 
            title={<strong>Live Work Timer</strong>} 
            bordered={false} 
            style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            extra={<ClockCircleOutlined style={{ color: activeTimer ? '#ff4d4f' : 'inherit' }} />}
          >
            {activeTimer ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ padding: '8px 12px', background: 'rgba(255, 77, 79, 0.05)', borderRadius: 6, border: '1px solid rgba(255, 77, 79, 0.15)', display: 'inline-block', marginBottom: 12 }}>
                  <Badge dot status="processing" style={{ marginRight: 8 }} />
                  <Text style={{ fontWeight: 600, color: '#ff4d4f' }}>WORKING ON {activeTimer.title.split(' ')[0]}</Text>
                </div>
                
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)', fontWeight: 500, marginBottom: 4 }}>
                  {activeTimer.title.substring(activeTimer.title.indexOf('-') + 1)}
                </div>

                <div className="timer-display" style={{ fontSize: 32, fontFamily: 'monospace', fontWeight: 'bold', margin: '12px 0', letterSpacing: 1 }}>
                  {elapsedTimeStr}
                </div>

                <Input 
                  placeholder="What are you working on? (Optional note)" 
                  value={timerNotes}
                  onChange={(e) => setTimerNotes(e.target.value)}
                  style={{ marginBottom: 16, borderRadius: 4 }}
                />

                <Space size="middle" style={{ width: '100%', justifyContent: 'center' }}>
                  <Button 
                    type="primary" 
                    danger 
                    icon={<PlayCircleOutlined rotate={90} />} 
                    onClick={() => {
                      stopTimer(timerNotes);
                      setTimerNotes('');
                      message.success('Work timer stopped and logged successfully!');
                    }}
                    style={{ borderRadius: 6 }}
                  >
                    Stop & Log Work
                  </Button>
                  <Button 
                    type="default" 
                    onClick={() => {
                      cancelTimer();
                      setTimerNotes('');
                      message.info('Work timer discarded.');
                    }}
                    style={{ borderRadius: 6 }}
                  >
                    Cancel
                  </Button>
                </Space>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <Paragraph type="secondary" style={{ fontSize: 12 }}>
                  Start a real-time work timer on any task in this project to automatically log hours.
                </Paragraph>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'stretch' }}>
                  <Select 
                    placeholder="Select task to start tracking" 
                    style={{ width: '100%', textAlign: 'left' }}
                    value={selectedIssueId}
                    onChange={setSelectedIssueId}
                  >
                    {projectIssues.filter(i => i.type !== 'Sub-task' && i.status !== 'Done').map(i => (
                      <Option key={i.id} value={i.id}>{i.key} — {i.title}</Option>
                    ))}
                  </Select>

                  <Button 
                    type="primary" 
                    icon={<PlayCircleOutlined />} 
                    onClick={() => {
                      if (selectedIssueId) {
                        startTimer(selectedIssueId);
                        setSelectedIssueId(undefined);
                      }
                    }} 
                    disabled={!selectedIssueId}
                    className="gradient-btn"
                    style={{ width: '100%', borderRadius: 6 }}
                  >
                    Start Timer
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};
