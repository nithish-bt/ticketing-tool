import React, { useState } from 'react';
import { Form, Input, Button, Radio, Typography, Alert, Tag, Tooltip } from 'antd';
import {
  UserOutlined,
  KeyOutlined,
  LoginOutlined,
  UserAddOutlined,
  AppstoreOutlined,
  TeamOutlined,
  BarChartOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import { useTaskFlow } from '../context/TaskFlowContext';
import type { Role } from '../types';


const { Text, Link } = Typography;

const DEMO_ACCOUNTS = [
  { username: 'nithish', role: 'Super Admin',    color: '#531dab' },
  { username: 'nithya',  role: 'Project Manager', color: '#1d39c4' },
  { username: 'maya',    role: 'Team Lead',        color: '#0958d9' },
  { username: 'shyam',   role: 'Developer',        color: '#237804' },
  { username: 'vijay',   role: 'Developer',        color: '#237804' },
  { username: 'sara',    role: 'Tester',           color: '#eb2f96' },
  { username: 'anand',   role: 'Viewer',           color: '#ad6800' },
];

const FEATURES = [
  { icon: <BranchesOutlined />, label: 'Sprint Planning' },
  { icon: <AppstoreOutlined />, label: 'Kanban Boards' },
  { icon: <TeamOutlined />,     label: 'Team Collaboration' },
  { icon: <BarChartOutlined />, label: 'Advanced Reporting' },
];

export const LoginScreen: React.FC = () => {
  const { login, register, users } = useTaskFlow();
  const [formMode, setFormMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('Developer');

  const [loginForm] = Form.useForm();

  const onFinishLogin = (values: { username?: string; password?: string }) => {
    setErrorMsg(null);
    if (!values.username || !values.password) {
      setErrorMsg('Please input your username and password.');
      return;
    }
    // Local authentication — match by username (name prefix) or email
    const input = values.username.trim().toLowerCase();
    const matched = users.find(
      u =>
        u.name.toLowerCase() === input ||
        u.name.toLowerCase().startsWith(input) ||
        u.email.toLowerCase().split('@')[0] === input
    );
    if (matched) {
      login(matched.id);
    } else {
      setErrorMsg('Invalid username. Please try one of the demo accounts below.');
    }
  };

  const onFinishRegister = (values: { name: string; email: string }) => {
    setErrorMsg(null);
    if (!values.name || !values.email) { setErrorMsg('Please fill in all fields.'); return; }
    register(values.name, values.email, selectedRole);
  };

  const onFinishReset = (values: { email: string }) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const userExists = users.some(u => u.email.toLowerCase() === values.email.toLowerCase());
    if (userExists) {
      setSuccessMsg('Password reset link sent to your email (simulated).');
    } else {
      setErrorMsg('No account found with this email.');
    }
  };

  const modeTitle: Record<string, string> = {
    login: 'Sign In',
    register: 'Create Account',
    forgot: 'Reset Password',
  };

  const modeSubtitle: Record<string, string> = {
    login: 'Enter your credentials to access TaskFlow',
    register: 'Set up your new TaskFlow account',
    forgot: 'We\'ll send a reset link to your email',
  };

  return (
    <div className="lp-root">
      {/* ── LEFT PANEL ─────────────────────────────── */}
      <div className="lp-left">
        {/* Brand */}
        <div className="lp-brand">
          <div className="lp-brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="rgba(255,255,255,0.9)" />
              <path d="M2 17L12 22L22 17M2 12L12 17L22 12" stroke="rgba(255,255,255,0.7)"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div className="lp-brand-name">TaskFlow</div>
            <div className="lp-brand-edition">Enterprise Edition</div>
          </div>
        </div>

        {/* Hero */}
        <h1 className="lp-hero-title">
          Manage Tasks,<br />Deliver Faster.
        </h1>
        <p className="lp-hero-sub">
          The premier collaborative project &amp; issue tracker trusted by
          software teams worldwide. Plan, track, and ship great software.
        </p>

        {/* Feature Cards */}
        <div className="lp-feature-grid">
          {FEATURES.map(f => (
            <div className="lp-feature-card" key={f.label}>
              <span className="lp-feature-icon">{f.icon}</span>
              <span className="lp-feature-label">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Decorative circles */}
        <div className="lp-circle lp-circle-1" />
        <div className="lp-circle lp-circle-2" />
      </div>

      {/* ── RIGHT PANEL ────────────────────────────── */}
      <div className="lp-right">
        <div className="lp-form-box">
          {/* Form header */}
          <h2 className="lp-form-title">{modeTitle[formMode]}</h2>
          <p className="lp-form-sub">{modeSubtitle[formMode]}</p>

          {errorMsg   && <Alert message={errorMsg}   type="error"   showIcon closable style={{ marginBottom: 16 }} onClose={() => setErrorMsg(null)} />}
          {successMsg && <Alert message={successMsg} type="success" showIcon closable style={{ marginBottom: 16 }} onClose={() => setSuccessMsg(null)} />}

          {/* ── LOGIN ── */}
          {formMode === 'login' && (
            <>
              <Form name="login" form={loginForm} onFinish={onFinishLogin} layout="vertical" size="large" initialValues={{ username: 'nithish', password: 'password123' }}>
                <Form.Item name="username" label={<span className="lp-label">Username</span>}
                  rules={[{ required: true, message: 'Please input your username!' }]}>
                  <Input prefix={<UserOutlined className="lp-input-icon" />} placeholder="Enter your username" className="lp-input" />
                </Form.Item>
                <Form.Item name="password" label={<span className="lp-label">Password</span>}
                  rules={[{ required: true, message: 'Please input your password!' }]}>
                  <Input.Password prefix={<KeyOutlined className="lp-input-icon" />} placeholder="Enter your password" className="lp-input" />
                </Form.Item>
                <Form.Item style={{ marginBottom: 12 }}>
                  <Button type="primary" htmlType="submit" block className="lp-btn">
                    Sign In
                  </Button>
                </Form.Item>
                <div className="lp-links">
                  <Link onClick={() => { setFormMode('register'); setErrorMsg(null); }}>Create Account</Link>
                  <Link onClick={() => { setFormMode('forgot');   setErrorMsg(null); }}>Forgot Password?</Link>
                </div>
              </Form>

              {/* Demo Accounts */}
              <div className="lp-demo-section">
                <div className="lp-demo-label">Demo Accounts <span style={{ fontWeight: 400, opacity: 0.55 }}>— click to fill</span></div>
                <div className="lp-demo-grid">
                  {DEMO_ACCOUNTS.map(acc => (
                    <Tooltip key={acc.username} title={`Login as ${acc.username}`} placement="top">
                      <div className="lp-demo-chip" onClick={() => loginForm.setFieldsValue({ username: acc.username })}>
                        <span className="lp-demo-username">{acc.username}</span>
                        <Tag color={acc.color} style={{ margin: 0, fontSize: 9, lineHeight: '17px', padding: '0 5px' }}>{acc.role}</Tag>
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── REGISTER ── */}
          {formMode === 'register' && (
            <Form name="register" onFinish={onFinishRegister} layout="vertical" size="large">
              <Form.Item name="name" label={<span className="lp-label">Full Name</span>}
                rules={[{ required: true, message: 'Please input your full name!' }]}>
                <Input prefix={<UserAddOutlined className="lp-input-icon" />} placeholder="Your full name" className="lp-input" />
              </Form.Item>
              <Form.Item name="email" label={<span className="lp-label">Email Address</span>}
                rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Enter a valid email!' }]}>
                <Input prefix={<LoginOutlined className="lp-input-icon" />} placeholder="you@example.com" className="lp-input" />
              </Form.Item>
              <Form.Item label={<span className="lp-label">Role</span>} required>
                <Radio.Group value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
                  buttonStyle="solid" style={{ width: '100%', display: 'flex' }}>
                  <Radio.Button value="Developer"      style={{ flex: 1, textAlign: 'center', padding: '0 4px' }}>Dev</Radio.Button>
                  <Radio.Button value="Tester"         style={{ flex: 1, textAlign: 'center', padding: '0 4px' }}>Tester</Radio.Button>
                  <Radio.Button value="Team Lead"      style={{ flex: 1, textAlign: 'center', padding: '0 4px' }}>Lead</Radio.Button>
                  <Radio.Button value="Project Manager" style={{ flex: 1, textAlign: 'center', padding: '0 4px' }}>Mgr</Radio.Button>
                </Radio.Group>
              </Form.Item>
              <Form.Item style={{ marginBottom: 12 }}>
                <Button type="primary" htmlType="submit" block className="lp-btn">Sign Up</Button>
              </Form.Item>
              <div className="lp-links" style={{ justifyContent: 'center' }}>
                <Text>Already have an account? <Link onClick={() => { setFormMode('login'); setErrorMsg(null); }}>Sign In</Link></Text>
              </div>
            </Form>
          )}

          {/* ── FORGOT ── */}
          {formMode === 'forgot' && (
            <Form name="forgot" onFinish={onFinishReset} layout="vertical" size="large">
              <Form.Item name="email" label={<span className="lp-label">Email Address</span>}
                rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Enter a valid email!' }]}>
                <Input prefix={<KeyOutlined className="lp-input-icon" />} placeholder="you@example.com" className="lp-input" />
              </Form.Item>
              <Form.Item style={{ marginBottom: 12 }}>
                <Button type="primary" htmlType="submit" block className="lp-btn">Send Reset Link</Button>
              </Form.Item>
              <div className="lp-links" style={{ justifyContent: 'center' }}>
                <Link onClick={() => { setFormMode('login'); setErrorMsg(null); }}>← Back to Sign In</Link>
              </div>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
};
