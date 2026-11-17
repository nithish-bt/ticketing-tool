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
import { STATIC_ACCOUNTS, STATIC_PASSWORDS, DEFAULT_STATIC_CREDENTIALS } from '../services/login';

const { Text, Link } = Typography;

const DEMO_ACCOUNTS = [
  { username: 'admin',   role: 'Super Admin',     color: '#722ed1' },
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
  const { loginWithUserData, register, users } = useTaskFlow();
  const [formMode, setFormMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role>('Developer');
  const [loading, setLoading] = useState(false);

  const [loginForm] = Form.useForm();

  const onFinishLogin = (values: { username?: string; password?: string }) => {
    setErrorMsg(null);
    const username = values.username?.trim();
    const password = values.password?.trim();

    if (!username || !password) {
      setErrorMsg('Please input your username and password.');
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      const lowerUser = username.toLowerCase();
      const staticAcc = STATIC_ACCOUNTS[lowerUser];
      const matchedUser = users.find(
        u => u.id.toLowerCase() === lowerUser ||
             u.email.toLowerCase() === lowerUser ||
             u.name.toLowerCase() === lowerUser
      );

      const isValidPassword = 
        STATIC_PASSWORDS.includes(password) || 
        (matchedUser?.password && matchedUser.password === password);

      if (staticAcc && isValidPassword) {
        localStorage.setItem('access_token', `static-token-${Date.now()}`);
        loginWithUserData({
          userId: staticAcc.userId,
          userName: staticAcc.userName,
          designation: staticAcc.designation,
          roleId: staticAcc.roleId,
          password: password,
        });
        setLoading(false);
        return;
      }

      if (matchedUser && (isValidPassword || !matchedUser.password)) {
        localStorage.setItem('access_token', `static-token-${Date.now()}`);
        loginWithUserData({
          userId: matchedUser.id,
          userName: matchedUser.name,
          designation: matchedUser.role,
          roleId: matchedUser.role === 'Super Admin' ? '1' : '2',
          password: password,
        });
        setLoading(false);
        return;
      }

      setLoading(false);
      if (!staticAcc && !matchedUser) {
        setErrorMsg(`User "${username}" not found. Static login: username "admin", password "password"`);
      } else {
        setErrorMsg('Invalid password. For static login, please use password: password');
      }
    }, 250);
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
      <main className="lp-card">
        <section className="lp-left">
          <div className="lp-form-box">
            <div className="lp-brand">
              <div className="shiny-logo-container lp-brand-logo">
                <img src="/logo.png" alt="" className="shiny-logo" />
              </div>
              <span className="lp-brand-name">TaskFlow</span>
            </div>

            <h1 className="lp-form-title">{formMode === 'login' ? 'Log in to your Account' : modeTitle[formMode]}</h1>
            <p className="lp-form-sub">{modeSubtitle[formMode]}</p>

            {errorMsg   && <Alert message={errorMsg}   type="error"   showIcon closable style={{ marginBottom: 16 }} onClose={() => setErrorMsg(null)} />}
            {successMsg && <Alert message={successMsg} type="success" showIcon closable style={{ marginBottom: 16 }} onClose={() => setSuccessMsg(null)} />}

            {formMode === 'login' && (
              <>
                <Form name="login" form={loginForm} onFinish={onFinishLogin} layout="vertical" size="large" initialValues={{ username: DEFAULT_STATIC_CREDENTIALS.username, password: DEFAULT_STATIC_CREDENTIALS.password }}>
                  <Form.Item name="username" label={<span className="lp-label">Username</span>}
                    rules={[{ required: true, message: 'Please input your username!' }]}>
                    <Input prefix={<UserOutlined className="lp-input-icon" />} placeholder="Enter your username" className="lp-input" />
                  </Form.Item>
                  <Form.Item name="password" label={<span className="lp-label">Password</span>}
                    rules={[{ required: true, message: 'Please input your password!' }]}>
                    <Input.Password prefix={<KeyOutlined className="lp-input-icon" />} placeholder="Enter your password" className="lp-input" />
                  </Form.Item>
                  <div className="lp-forgot-link">
                    <Link onClick={() => { setFormMode('forgot'); setErrorMsg(null); }}>Forgot Password?</Link>
                  </div>
                  <Form.Item style={{ marginBottom: 12 }}>
                    <Button type="primary" htmlType="submit" block className="lp-btn" loading={loading}>
                      Log In
                    </Button>
                  </Form.Item>
                  <div className="lp-links lp-create-link">
                    <Text>Don&apos;t have an account? <Link onClick={() => { setFormMode('register'); setErrorMsg(null); }}>Create an account</Link></Text>
                  </div>
                </Form>

                <details className="lp-demo-section">
                  <summary className="lp-demo-label">Demo accounts and access</summary>
                  <div className="lp-demo-hint">
                    <span>admin / password</span>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => loginForm.setFieldsValue({ username: 'admin', password: 'password' })}
                    >
                      Fill login
                    </Button>
                  </div>
                  <div className="lp-demo-grid">
                    {DEMO_ACCOUNTS.map(acc => (
                      <Tooltip key={acc.username} title={`Login as ${acc.username} (${acc.role})`} placement="top">
                        <button
                          type="button"
                          className="lp-demo-chip"
                          onClick={() => loginForm.setFieldsValue({ username: acc.username, password: 'password' })}
                        >
                          <span className="lp-demo-username">{acc.username}</span>
                          <Tag color={acc.color} style={{ margin: 0, fontSize: 9, lineHeight: '17px', padding: '0 5px' }}>{acc.role}</Tag>
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                </details>
              </>
            )}

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
        </section>

        <aside className="lp-right">
          <div className="lp-promo">
            <div className="lp-illustration" aria-hidden="true">
              <div className="lp-illustration-glow" />
              <div className="lp-connector lp-connector-horizontal" />
              <div className="lp-connector lp-connector-vertical" />
              <div className="lp-app-node lp-app-node-top"><TeamOutlined /></div>
              <div className="lp-app-node lp-app-node-left"><AppstoreOutlined /></div>
              <div className="lp-app-node lp-app-node-bottom"><BranchesOutlined /></div>
              <div className="lp-task-card">
                <div className="lp-task-card-top"><span /><span /><span /></div>
                <div className="lp-task-row lp-task-row-heading" />
                <div className="lp-task-item"><i className="lp-avatar lp-avatar-blue" /><span /><b /></div>
                <div className="lp-task-item"><i className="lp-avatar lp-avatar-orange" /><span /><b /></div>
                <div className="lp-task-item"><i className="lp-avatar lp-avatar-purple" /><span /><b /></div>
              </div>
            </div>
            <h2 className="lp-promo-title">Connect with every application.</h2>
            <p className="lp-promo-copy">Everything your team needs to plan, track, and deliver great work.</p>
            <div className="lp-feature-list">
              {FEATURES.map(f => (
                <span className="lp-feature-item" key={f.label}>{f.icon}<span>{f.label}</span></span>
              ))}
            </div>
            <div className="lp-promo-dots" aria-hidden="true"><i /><i /><i /></div>
          </div>
        </aside>
      </main>
    </div>
  );
};
