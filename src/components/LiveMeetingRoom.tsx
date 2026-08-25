import React, { useState, useEffect } from 'react';
import { Button, Input, Typography, Tooltip, Select, Row, Col } from 'antd';
import { 
  CloseOutlined, SaveOutlined, AudioOutlined, AudioMutedOutlined, 
  VideoCameraOutlined, DesktopOutlined 
} from '@ant-design/icons';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { useTaskFlow } from '../context/TaskFlowContext';
import { io, Socket } from 'socket.io-client';

const { Title, Text } = Typography;

export const LiveMeetingRoom: React.FC = () => {
  const { activeMeeting, meetings, currentUser, leaveMeeting, updateMeeting } = useTaskFlow();
  const meeting = meetings.find(m => m.id === activeMeeting);
  
  const [notes, setNotes] = useState(meeting?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Pre-join state
  const [micEnabled, setMicEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!meeting || !isJoined) return;

    // Connect to Socket.IO server (fallback to localhost:3001)
    const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
      query: { roomId: meeting.id, userId: currentUser?.id }
    });

    setSocket(newSocket);

    // Listen for remote note updates
    newSocket.on('notesUpdated', (updatedNotes: string) => {
      setNotes(updatedNotes);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [meeting?.id, isJoined, currentUser?.id]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    
    if (socket) {
      socket.emit('updateNotes', { roomId: meeting?.id, notes: newNotes });
    }
  };

  // Auto-save debounce effect
  useEffect(() => {
    if (!meeting) return;
    
    const handler = setTimeout(() => {
      if (notes !== meeting.notes) {
        setIsSaving(true);
        updateMeeting(meeting.id, { notes });
        setTimeout(() => setIsSaving(false), 500); // UI visual feedback
      }
    }, 1500);

    return () => clearTimeout(handler);
  }, [notes, meeting, updateMeeting]);

  if (!meeting || !currentUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000' }}>
        <Text style={{ color: 'white' }}>Meeting not found or you have been disconnected.</Text>
        <Button onClick={leaveMeeting} style={{ marginLeft: 16 }}>Return to Dashboard</Button>
      </div>
    );
  }

  // Use a stable, unique room name based on the meeting ID
  const roomName = `TaskFlowMeeting_${meeting.id.replace(/[^a-zA-Z0-9]/g, '')}`;

  if (!isJoined) {
    return (
      <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 96px)', background: '#fff', borderRadius: 8, padding: 40, alignItems: 'center' }}>
        <Row gutter={48} style={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
          
          {/* Left Side - Video Preview */}
          <Col span={16}>
            <div style={{ 
              width: '100%', 
              aspectRatio: '16/9', 
              background: '#202124', 
              borderRadius: 12, 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <Title level={3} style={{ color: '#fff', fontWeight: 400, margin: 0 }}>
                {videoEnabled ? 'Camera is starting...' : 'Camera is off'}
              </Title>
              
              <div style={{ position: 'absolute', bottom: 24, display: 'flex', gap: 16 }}>
                <Tooltip title={micEnabled ? 'Mute Microphone' : 'Unmute Microphone'}>
                  <Button 
                    shape="circle" 
                    size="large"
                    type={micEnabled ? 'default' : 'primary'}
                    danger={!micEnabled}
                    icon={micEnabled ? <AudioOutlined /> : <AudioMutedOutlined />} 
                    onClick={() => setMicEnabled(!micEnabled)}
                    style={{ width: 56, height: 56, background: micEnabled ? 'rgba(255,255,255,0.1)' : undefined, color: micEnabled ? '#fff' : undefined, border: micEnabled ? '1px solid rgba(255,255,255,0.3)' : undefined }}
                  />
                </Tooltip>
                <Tooltip title={videoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}>
                  <Button 
                    shape="circle" 
                    size="large"
                    type={videoEnabled ? 'default' : 'primary'}
                    danger={!videoEnabled}
                    icon={<VideoCameraOutlined />} 
                    onClick={() => setVideoEnabled(!videoEnabled)}
                    style={{ width: 56, height: 56, background: videoEnabled ? 'rgba(255,255,255,0.1)' : undefined, color: videoEnabled ? '#fff' : undefined, border: videoEnabled ? '1px solid rgba(255,255,255,0.3)' : undefined }}
                  />
                </Tooltip>
                <Tooltip title={screenShareEnabled ? 'Stop Screen Share' : 'Start Screen Share'}>
                  <Button 
                    shape="circle" 
                    size="large"
                    type={screenShareEnabled ? 'default' : 'primary'}
                    danger={!screenShareEnabled}
                    icon={<DesktopOutlined />} 
                    onClick={() => setScreenShareEnabled(!screenShareEnabled)}
                    style={{ width: 56, height: 56, background: screenShareEnabled ? 'rgba(255,255,255,0.1)' : undefined, color: screenShareEnabled ? '#fff' : undefined, border: screenShareEnabled ? '1px solid rgba(255,255,255,0.3)' : undefined }}
                  />
                </Tooltip>
              </div>

              <div style={{ position: 'absolute', top: 20, left: 24 }}>
                <Text style={{ color: 'white', fontWeight: 500 }}>{currentUser.name}</Text>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
              <Select defaultValue="default" style={{ width: 200 }}>
                <Select.Option value="default"><AudioOutlined /> Default Microphone</Select.Option>
              </Select>
              <Select defaultValue="default" style={{ width: 200 }}>
                <Select.Option value="default"><AudioOutlined /> Default Speaker</Select.Option>
              </Select>
              <Select defaultValue="default" style={{ width: 200 }}>
                <Select.Option value="default"><VideoCameraOutlined /> Default Camera</Select.Option>
              </Select>
            </div>
          </Col>

          {/* Right Side - Join Controls */}
          <Col span={8} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <Title level={2} style={{ fontWeight: 400, marginBottom: 12 }}>Ready to join?</Title>
            <Text type="secondary" style={{ fontSize: 16, marginBottom: 32 }}>No one else is here</Text>
            
            <Button 
              type="primary" 
              size="large" 
              style={{ width: 220, height: 48, borderRadius: 24, fontSize: 16, fontWeight: 500, marginBottom: 16 }}
              onClick={() => setIsJoined(true)}
            >
              Join now
            </Button>
            
            <Button 
              size="large" 
              style={{ width: 220, height: 48, borderRadius: 24, fontSize: 16 }}
              onClick={leaveMeeting}
            >
              Cancel
            </Button>
          </Col>
        </Row>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: 'calc(100vh - 96px)', overflow: 'hidden', background: '#1f1f1f', borderRadius: 8 }}>
      
      {/* LEFT PANEL - Jitsi Video Room */}
      <div style={{ flex: 1, position: 'relative' }}>
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: !micEnabled,
            startWithVideoMuted: !videoEnabled,
            disableModeratorIndicator: true,
            startScreenSharing: screenShareEnabled,
            enableEmailInStats: false
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
            ]
          }}
          userInfo={{
            displayName: currentUser.name,
            email: currentUser.email
          }}
          onApiReady={(externalApi: any) => {
            // Can add event listeners here if needed, e.g., videoConferenceLeft
            externalApi.addListener('videoConferenceLeft', () => {
              leaveMeeting();
            });
          }}
          getIFrameRef={(iframeRef: any) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
            iframeRef.style.border = 'none';
          }}
        />
        
        {/* Custom Exit Button Overlay (in case they don't use Jitsi's hangup) */}
        <Tooltip title="Leave Meeting Room">
          <Button 
            danger 
            type="primary" 
            shape="circle" 
            icon={<CloseOutlined />} 
            onClick={leaveMeeting}
            style={{ position: 'absolute', top: 24, left: 24, zIndex: 10, width: 48, height: 48, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
          />
        </Tooltip>
      </div>

      {/* RIGHT PANEL - Collaborative Notes */}
      <div style={{ width: '400px', background: '#ffffff', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #f0f0f0' }}>
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#1f1f1f' }}>Meeting Notes</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>{meeting.title}</Text>
          </div>
          {isSaving ? (
            <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              Saving...
            </Text>
          ) : (
            <Tooltip title="Notes auto-save as you type">
              <Text type="success" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <SaveOutlined /> Saved
              </Text>
            </Tooltip>
          )}
        </div>
        
        <div style={{ flex: 1, padding: 16 }}>
          <Input.TextArea
            value={notes}
            onChange={handleNotesChange}
            placeholder="Type meeting notes, action items, and decisions here..."
            style={{ 
              height: '100%', 
              resize: 'none', 
              border: 'none', 
              boxShadow: 'none', 
              padding: 8,
              fontSize: 15,
              lineHeight: 1.6,
              background: '#fafafa',
              borderRadius: 8
            }}
          />
        </div>
      </div>

    </div>
  );
};
