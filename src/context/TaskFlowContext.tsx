import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  User, Project, Sprint, Epic, Issue, Comment,
  Worklog, Notification, ActivityLog, Role, ProjectMember, ChatMessage
} from '../types';

interface WorkflowColumn {
  status: string;
  wipLimit: number | null;
}

interface ProjectWorkflow {
  projectId: string;
  columns: WorkflowColumn[];
}

interface TaskFlowContextType {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  sprints: Sprint[];
  epics: Epic[];
  issues: Issue[];
  comments: Comment[];
  worklogs: Worklog[];
  activityLogs: ActivityLog[];
  chatMessages: ChatMessage[];
  notifications: Notification[];
  workflows: ProjectWorkflow[];
  currentProject: Project | null;
  currentView: string;
  darkMode: boolean;
  setView: (view: string) => void;
  setCurrentProject: (project: Project | null) => void;
  login: (userId: string) => boolean;
  loginWithUserData: (apiUser: { userId: string; userName: string; designation?: string; roleId?: string; password?: string }) => void;
  logout: () => void;
  register: (name: string, email: string, role: Role) => void;
  createProject: (name: string, key: string, description: string, type: 'Scrum' | 'Kanban' | 'Timesheet') => void;
  deleteProject: (id: string) => void;
  createSprint: (name: string, startDate: string, endDate: string, goal: string) => void;
  startSprint: (sprintId: string) => void;
  closeSprint: (sprintId: string, targetSprintId: string | null) => void;
  createIssue: (issueData: Omit<Issue, 'id' | 'key' | 'project_id'>) => void;
  updateIssue: (issueId: string, updates: Partial<Issue>) => void;
  deleteIssue: (issueId: string) => void;
  changeIssueStatus: (issueId: string, newStatus: string) => void;
  addComment: (issueId: string, body: string) => void;
  addWorklog: (issueId: string, hours: number, note?: string, date?: string) => void;
  addAttachment: (issueId: string, fileName: string, sizeKb: number) => void;
  attachments: Record<string, { id: string; file_name: string; size_kb: number; uploaded_by: string; uploaded_at: string }[]>;
  markNotificationRead: (notificationId: string) => void;
  clearNotifications: () => void;
  toggleDarkMode: () => void;
  updateWorkflowColumns: (projectId: string, columns: WorkflowColumn[]) => void;
  addUser: (name: string, email: string, role: Role) => void;
  removeUser: (userId: string) => void;
  activeTimer: { issueId: string; startTime: string; title: string } | null;
  startTimer: (issueId: string) => void;
  stopTimer: (note?: string) => void;
  cancelTimer: () => void;
  sendMessage: (projectId: string, receiverId: string | null, message: string) => void;
  projectMembers: ProjectMember[];
  addProjectMember: (projectId: string, userId: string, role: Role) => void;
  removeProjectMember: (projectId: string, userId: string) => void;
}

const TaskFlowContext = createContext<TaskFlowContextType | undefined>(undefined);

// Initial Seed Data
const initialUsers: User[] = [
  { id: 'u1', name: 'Nithish SV', email: 'nithish@taskflow.io', role: 'Super Admin', organization_id: 'org1' },
  { id: 'u2', name: 'Nithya Sree', email: 'nithya@taskflow.io', role: 'Project Manager', organization_id: 'org1' },
  { id: 'u3', name: 'Maya', email: 'maya@taskflow.io', role: 'Team Lead', organization_id: 'org1' },
  { id: 'u4', name: 'Shyam', email: 'shyam@taskflow.io', role: 'Developer', organization_id: 'org1'  },
  { id: 'u5', name: 'Vijay', email: 'vijay@taskflow.io', role: 'Developer', organization_id: 'org1' },
  { id: 'u6', name: 'Anand', email: 'anand@taskflow.io', role: 'Viewer', organization_id: 'org1'},
  { id: 'u7', name: 'Sara', email: 'sara@taskflow.io', role: 'Tester', organization_id: 'org1'},
];

const initialProjects: Project[] = [
  { id: 'p1', name: 'Engineering Core Platform', key: 'ENG', type: 'Scrum', description: 'Core infrastructure, state-of-the-art APIs, and front-end interface.', organization_id: 'org1' },
  { id: 'p2', name: 'Marketing Web Site', key: 'MKT', type: 'Kanban', description: 'Public facing corporate website and user onboarding landing page.', organization_id: 'org1' }
];

const initialEpics: Epic[] = [
  { id: 'ep1', project_id: 'p1', title: 'User Authentication & RBAC', description: 'Implement login, register, OAuth, and Role-Based Access Control.', status: 'Done', color: '#1677ff' },
  { id: 'ep2', project_id: 'p1', title: 'Interactive Kanban Boards', description: 'High performance drag-and-drop workflow boards with WIP limits.', status: 'In Progress', color: '#722ed1' },
  { id: 'ep3', project_id: 'p1', title: 'Advanced Reporting Systems', description: 'Implement interactive burndown charts and velocity tracking.', status: 'To Do', color: '#fa8c16' }
];

const initialSprints: Sprint[] = [
  { id: 's1', project_id: 'p1', name: 'Sprint 1: The Foundation', start_date: '2026-07-01', end_date: '2026-07-14', goal: 'Establish project skeleton, db schema, and core styling layout.', status: 'closed' },
  { id: 's2', project_id: 'p1', name: 'Sprint 2: Board Controls', start_date: '2026-07-15', end_date: '2026-07-29', goal: 'Build fully functional drag and drop boards and issue details modal.', status: 'active' },
  { id: 's3', project_id: 'p1', name: 'Sprint 3: Analytics & Admin', start_date: '2026-07-30', end_date: '2026-08-12', goal: 'Complete SVGs reports dashboard and customization admin menus.', status: 'inactive' }
];

const initialIssues: Issue[] = [
  // Sprint 1 (Closed) Issues - all Done
  { id: 'iss1', project_id: 'p1', key: 'ENG-1', type: 'Task', title: 'Set up React framework and install Ant Design', description: 'Initialize Vite template with TS and add UI libs.', status: 'Done', priority: 'Highest', assignee_id: 'u4', reporter_id: 'u2', epic_id: 'ep1', sprint_id: 's1', estimate: 3, due_date: '2026-07-05' },
  { id: 'iss2', project_id: 'p1', key: 'ENG-2', type: 'Story', title: 'Design database entity relationships schema', description: 'Draft SQL schemas for User, Project, Issue and Sprints.', status: 'Done', priority: 'High', assignee_id: 'u3', reporter_id: 'u2', epic_id: 'ep1', sprint_id: 's1', estimate: 5, due_date: '2026-07-10' },
  { id: 'iss3', project_id: 'p1', key: 'ENG-3', type: 'Bug', title: 'Fix broken build error in server deployment scripts', description: 'Correct Docker file reference error.', status: 'Done', priority: 'Medium', assignee_id: 'u5', reporter_id: 'u3', epic_id: null, sprint_id: 's1', estimate: 2, due_date: '2026-07-12' },

  // Sprint 2 (Active) Issues
  { id: 'iss4', project_id: 'p1', key: 'ENG-4', type: 'Story', title: 'Create interactive HTML5 Kanban Drag-and-Drop board', description: 'Integrate custom drag and drop handlers to allow moving cards between statuses. Ensure WIP limit triggers work.', status: 'In Progress', priority: 'Highest', assignee_id: 'u4', reporter_id: 'u2', epic_id: 'ep2', sprint_id: 's2', estimate: 8, due_date: '2026-07-28' },
  { id: 'iss5', project_id: 'p1', key: 'ENG-5', type: 'Story', title: 'Implement issue detail preview side panel/modal', description: 'Create an Antd modal containing comments, time-logging widget, and action details.', status: 'In Review', priority: 'High', assignee_id: 'u5', reporter_id: 'u3', epic_id: 'ep2', sprint_id: 's2', estimate: 5, due_date: '2026-07-25' },
  { id: 'iss6', project_id: 'p1', key: 'ENG-6', type: 'Task', title: 'Establish global state provider and localStorage sync', description: 'Create context wrapper to manage all state edits without an external db API in the demo.', status: 'To Do', priority: 'Medium', assignee_id: 'u3', reporter_id: 'u2', epic_id: 'ep2', sprint_id: 's2', estimate: 3, due_date: '2026-07-27' },
  { id: 'iss7', project_id: 'p1', key: 'ENG-7', type: 'Bug', title: 'Profile page avatar initials alignment bug', description: 'Fix CSS line-height issue causing off-center letters in standard avatar tags.', status: 'To Do', priority: 'Low', assignee_id: 'u4', reporter_id: 'u4', epic_id: null, sprint_id: 's2', estimate: 1, due_date: '2026-07-29' },
  { id: 'iss8', project_id: 'p1', key: 'ENG-8', type: 'Story', title: 'Implement JWT login simulation interface', description: 'Allow logging in as different user roles to verify RBAC access features.', status: 'Done', priority: 'High', assignee_id: 'u5', reporter_id: 'u2', epic_id: 'ep1', sprint_id: 's2', estimate: 5, due_date: '2026-07-20' },

  // Backlog / Unscheduled Issues
  { id: 'iss9', project_id: 'p1', key: 'ENG-9', type: 'Story', title: 'Generate live Burndown charts using SVG elements', description: 'Calculate daily burn-down rate by reading issue estimation history, and draw beautiful SVG lines.', status: 'To Do', priority: 'High', assignee_id: null, reporter_id: 'u3', epic_id: 'ep3', sprint_id: null, estimate: 8, due_date: null },
  { id: 'iss10', project_id: 'p1', key: 'ENG-10', type: 'Task', title: 'Design Admin Settings page for custom columns', description: 'Develop admin controls allowing Super Admins to add/remove workflow board columns dynamically.', status: 'To Do', priority: 'Medium', assignee_id: null, reporter_id: 'u2', epic_id: 'ep3', sprint_id: null, estimate: 5, due_date: null },

  // Sub-task examples
  { id: 'iss5-1', project_id: 'p1', key: 'ENG-5-SUB-1', type: 'Sub-task', title: 'Build Threaded Comment layout widget', description: 'Include @mentions visual tagging.', status: 'Done', priority: 'Medium', assignee_id: 'u5', reporter_id: 'u5', epic_id: null, sprint_id: 's2', estimate: 2, due_date: '2026-07-24', parent_id: 'iss5' },
  { id: 'iss5-2', project_id: 'p1', key: 'ENG-5-SUB-2', type: 'Sub-task', title: 'Add attachment file simulator logic', description: 'Simulate file uploads up to 25MB and verify calculations.', status: 'To Do', priority: 'Medium', assignee_id: 'u5', reporter_id: 'u5', epic_id: null, sprint_id: 's2', estimate: 1, due_date: '2026-07-25', parent_id: 'iss5' }
];

const initialComments: Comment[] = [
  { id: 'c1', issue_id: 'iss4', author_id: 'u3', body: 'The drag-and-drop should use standard HTML5 drag dataTransfer to keep the library dependencies lightweight.', created_at: '2026-07-20T10:00:00Z' },
  { id: 'c2', issue_id: 'iss4', author_id: 'u4', body: 'Understood, starting work on the drop handlers. Will ensure WIP warnings light up beautifully.', created_at: '2026-07-21T14:30:00Z' },
  { id: 'c3', issue_id: 'iss5', author_id: 'u2', body: 'Please ensure we show user avatars next to comments in the feed thread.', created_at: '2026-07-22T09:15:00Z' }
];

const initialWorklogs: Worklog[] = [
  { id: 'w1', issue_id: 'iss4', user_id: 'u4', time_spent: 4, logged_date: '2026-07-22', note: 'Created HTML5 template and layout files' },
  { id: 'w2', issue_id: 'iss4', user_id: 'u4', time_spent: 2, logged_date: '2026-07-23', note: 'Added drag start and drag enter event handlers' },
  { id: 'w3', issue_id: 'iss5', user_id: 'u5', time_spent: 3, logged_date: '2026-07-23', note: 'Created modal base structure with tabs layout' }
];

const initialActivityLogs: ActivityLog[] = [
  { id: 'act1', issue_id: 'iss4', user_id: 'u4', action: 'Created task', timestamp: '2026-07-15T09:00:00Z' },
  { id: 'act2', issue_id: 'iss4', user_id: 'u4', action: 'Changed Status from To Do to In Progress', timestamp: '2026-07-16T10:15:00Z' },
  { id: 'act3', issue_id: 'iss8', user_id: 'u5', action: 'Changed Status from In Review to Done', timestamp: '2026-07-20T17:45:00Z' }
];

const initialNotifications: Notification[] = [
  { id: 'n1', user_id: 'u4', type: 'assignment', reference_id: 'iss4', read_flag: false, message: 'You have been assigned to: ENG-4 Create interactive HTML5 Kanban Drag-and-Drop board', created_at: '2026-07-15T09:05:00Z' },
  { id: 'n2', user_id: 'u4', type: 'mention', reference_id: 'iss4', read_flag: false, message: 'Maya @mentioned you in comments on ENG-4', created_at: '2026-07-20T10:01:00Z' }
];

const initialChatMessages: ChatMessage[] = [
  { id: 'msg1', project_id: 'p1', sender_id: 'u3', receiver_id: null, message: 'Welcome to the project chat everyone!', created_at: '2026-07-21T09:00:00Z' },
  { id: 'msg2', project_id: 'p1', sender_id: 'u4', receiver_id: 'u3', message: 'Hey Maya, could you review my PR for the Kanban board when you have a moment?', created_at: '2026-07-22T10:00:00Z' }
];

const initialWorkflows: ProjectWorkflow[] = [
  {
    projectId: 'p1',
    columns: [
      { status: 'To Do', wipLimit: null },
      { status: 'In Progress', wipLimit: 2 },
      { status: 'In Review', wipLimit: 3 },
      { status: 'Done', wipLimit: null }
    ]
  },
  {
    projectId: 'p2',
    columns: [
      { status: 'To Do', wipLimit: null },
      { status: 'In Progress', wipLimit: 4 },
      { status: 'Done', wipLimit: null }
    ]
  }
];

const initialProjectMembers: ProjectMember[] = [
  { project_id: 'p1', user_id: 'u1', role: 'Super Admin' },
  { project_id: 'p1', user_id: 'u2', role: 'Project Manager' },
  { project_id: 'p1', user_id: 'u3', role: 'Team Lead' },
  { project_id: 'p1', user_id: 'u4', role: 'Developer' },
  { project_id: 'p1', user_id: 'u5', role: 'Developer' },
  { project_id: 'p2', user_id: 'u2', role: 'Project Manager' },
  { project_id: 'p2', user_id: 'u3', role: 'Team Lead' },
  { project_id: 'p2', user_id: 'u5', role: 'Developer' },
  { project_id: 'p2', user_id: 'u6', role: 'Viewer' }
];

export const TaskFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Try loading from localStorage
  const loadState = <T,>(key: string, initial: T): T => {
    const val = localStorage.getItem(`taskflow_${key}`);
    return val ? JSON.parse(val) : initial;
  };

  const [users, setUsers] = useState<User[]>(() => {
    const loaded = loadState('users', initialUsers);
    const hasOldUsers = loaded.some(u => u.name === 'Sarah Connor' || u.name === 'Alex Rivera' || u.name === 'Emma Watson');
    const baseUsers = hasOldUsers ? initialUsers : loaded;
    return baseUsers.map(u => ({
      ...u,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`
    }));
  });
  const [projects, setProjects] = useState<Project[]>(() => loadState('projects', initialProjects));
  const [sprints, setSprints] = useState<Sprint[]>(() => loadState('sprints', initialSprints));
  const [epics, setEpics] = useState<Epic[]>(() => loadState('epics', initialEpics));
  const [issues, setIssues] = useState<Issue[]>(() => loadState('issues', initialIssues));
  const [comments, setComments] = useState<Comment[]>(() => loadState('comments', initialComments));
  const [worklogs, setWorklogs] = useState<Worklog[]>(() => loadState('worklogs', initialWorklogs));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => loadState('activityLogs', initialActivityLogs));
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => loadState('chatMessages', initialChatMessages));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadState('notifications', initialNotifications));
  const [workflows, setWorkflows] = useState<ProjectWorkflow[]>(() => loadState('workflows', initialWorkflows));
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>(() => loadState('projectMembers', initialProjectMembers));
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const loaded = loadState<User | null>('currentUser', null);
    if (loaded && (loaded.name === 'Sarah Connor' || loaded.name === 'Alex Rivera' || loaded.name === 'Emma Watson')) {
      const updatedUser = initialUsers.find(u => u.id === loaded.id);
      return updatedUser || null;
    }
    return loaded;
  });
  const [currentProject, setCurrentProjectState] = useState<Project | null>(() => loadState('currentProject', initialProjects[0]));
  const [currentView, setViewState] = useState<string>(() => loadState('currentView', 'Dashboard'));
  const [darkMode, setDarkMode] = useState<boolean>(() => loadState('darkMode', false));

  const [attachments, setAttachments] = useState<Record<string, { id: string; file_name: string; size_kb: number; uploaded_by: string; uploaded_at: string }[]>>(() => {
    return loadState('attachments', {
      'iss5': [{
        id: 'att1',
        file_name: 'issue-details-spec.pdf',
        size_kb: 1204,
        uploaded_by: 'Vijay',
        uploaded_at: '2026-07-23T11:00:00Z'
      }]
    });
  });

  const [activeTimer, setActiveTimer] = useState<{ issueId: string; startTime: string; title: string } | null>(() => {
    return loadState('activeTimer', null);
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('taskflow_users', JSON.stringify(users));
    localStorage.setItem('taskflow_projects', JSON.stringify(projects));
    localStorage.setItem('taskflow_sprints', JSON.stringify(sprints));
    localStorage.setItem('taskflow_epics', JSON.stringify(epics));
    localStorage.setItem('taskflow_issues', JSON.stringify(issues));
    localStorage.setItem('taskflow_comments', JSON.stringify(comments));
    localStorage.setItem('taskflow_worklogs', JSON.stringify(worklogs));
    localStorage.setItem('taskflow_activityLogs', JSON.stringify(activityLogs));
    localStorage.setItem('taskflow_chatMessages', JSON.stringify(chatMessages));
    localStorage.setItem('taskflow_notifications', JSON.stringify(notifications));
    localStorage.setItem('taskflow_workflows', JSON.stringify(workflows));
    localStorage.setItem('taskflow_projectMembers', JSON.stringify(projectMembers));
    localStorage.setItem('taskflow_currentUser', JSON.stringify(currentUser));
    localStorage.setItem('taskflow_currentProject', JSON.stringify(currentProject));
    localStorage.setItem('taskflow_currentView', JSON.stringify(currentView));
    localStorage.setItem('taskflow_darkMode', JSON.stringify(darkMode));
    localStorage.setItem('taskflow_attachments', JSON.stringify(attachments));
    localStorage.setItem('taskflow_activeTimer', JSON.stringify(activeTimer));
  }, [users, projects, sprints, epics, issues, comments, worklogs, activityLogs, chatMessages, notifications, workflows, projectMembers, currentUser, currentProject, currentView, darkMode, attachments, activeTimer]);

  // UI routes state
  const setView = (view: string) => {
    setViewState(view);
  };

  const setCurrentProject = (proj: Project | null) => {
    setCurrentProjectState(proj);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Auth Operations
  const login = (userId: string): boolean => {
    const user = users.find(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const loginWithUserData = (apiUser: { userId: string; userName: string; designation?: string; roleId?: string; password?: string }) => {
    let user = users.find(u => u.id === apiUser.userId);
    if (!user) {
      const role: Role = apiUser.roleId === '1' || apiUser.userName.toLowerCase() === 'admin' ? 'Super Admin' : 'Developer';
      user = {
        id: apiUser.userId,
        name: apiUser.userName,
        email: `${apiUser.userName.toLowerCase()}@vividtranstech.com`,
        role,
        organization_id: 'org1',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(apiUser.userName)}`,
        password: apiUser.password
      };
      setUsers(prev => [...prev, user!]);
    } else if (apiUser.password) {
      user = { ...user, password: apiUser.password };
      setUsers(prev => prev.map(u => u.id === apiUser.userId ? user! : u));
    }
    setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
    setViewState('Dashboard');
  };

  const register = (name: string, email: string, role: Role) => {
    const newUser: User = {
      id: `u_${Date.now()}`,
      name,
      email,
      role,
      organization_id: 'org1',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
  };

  const addUser = (name: string, email: string, role: Role) => {
    const newUser: User = {
      id: `u_${Date.now()}`,
      name,
      email,
      role,
      organization_id: 'org1',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`
    };
    setUsers(prev => [...prev, newUser]);
  };

  const removeUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUser?.id === userId) {
      logout();
    }
  };

  // Project Operations
  const createProject = (name: string, key: string, description: string, type: 'Scrum' | 'Kanban' | 'Timesheet') => {
    const newProj: Project = {
      id: `p_${Date.now()}`,
      name,
      key: key.toUpperCase(),
      description,
      type,
      organization_id: 'org1'
    };
    setProjects(prev => [...prev, newProj]);
    // Create default workflow
    const cols = type === 'Scrum'
      ? [
          { status: 'To Do', wipLimit: null },
          { status: 'In Progress', wipLimit: 3 },
          { status: 'In Review', wipLimit: 3 },
          { status: 'Done', wipLimit: null }
        ]
      : type === 'Kanban'
      ? [
          { status: 'To Do', wipLimit: null },
          { status: 'In Progress', wipLimit: 5 },
          { status: 'Done', wipLimit: null }
        ]
      : [
          { status: 'To Do', wipLimit: null },
          { status: 'In Progress', wipLimit: null },
          { status: 'Done', wipLimit: null }
        ];
    setWorkflows(prev => [...prev, { projectId: newProj.id, columns: cols }]);
    setCurrentProjectState(newProj);
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setIssues(prev => prev.filter(iss => iss.project_id !== id));
    setSprints(prev => prev.filter(sp => sp.project_id !== id));
    setEpics(prev => prev.filter(ep => ep.project_id !== id));
    if (currentProject?.id === id) {
      const remaining = projects.filter(p => p.id !== id);
      setCurrentProjectState(remaining.length > 0 ? remaining[0] : null);
    }
  };

  // Sprint Operations
  const createSprint = (name: string, startDate: string, endDate: string, goal: string) => {
    if (!currentProject) return;
    const newSprint: Sprint = {
      id: `s_${Date.now()}`,
      project_id: currentProject.id,
      name,
      start_date: startDate,
      end_date: endDate,
      goal,
      status: 'inactive'
    };
    setSprints(prev => [...prev, newSprint]);
  };

  const startSprint = (sprintId: string) => {
    setSprints(prev => prev.map(s => s.id === sprintId ? { ...s, status: 'active' } : s));
    setActivityLogs(prev => [...prev, {
      id: `act_${Date.now()}`,
      issue_id: 'system',
      user_id: currentUser?.id || 'system',
      action: `Started sprint`,
      timestamp: new Date().toISOString()
    }]);
  };

  const closeSprint = (sprintId: string, targetSprintId: string | null) => {
    // 1. Mark sprint as closed
    setSprints(prev => prev.map(s => s.id === sprintId ? { ...s, status: 'closed' } : s));

    // 2. Rollover incomplete issues
    setIssues(prev => prev.map(iss => {
      if (iss.sprint_id === sprintId && iss.status !== 'Done') {
        return { ...iss, sprint_id: targetSprintId }; // can be null (backlog) or next sprint ID
      }
      return iss;
    }));

    // Create activity logs for rolled over issues
    const rolledIssues = issues.filter(iss => iss.sprint_id === sprintId && iss.status !== 'Done');
    const newLogs: ActivityLog[] = rolledIssues.map(iss => ({
      id: `act_${Date.now()}_${iss.id}`,
      issue_id: iss.id,
      user_id: currentUser?.id || 'system',
      action: `Rolled over issue to ${targetSprintId ? 'next Sprint' : 'Backlog'} on Sprint closure`,
      timestamp: new Date().toISOString()
    }));
    setActivityLogs(prev => [...prev, ...newLogs]);
  };

  // Issue Operations
  const createIssue = (issueData: Omit<Issue, 'id' | 'key' | 'project_id'>) => {
    if (!currentProject) return;

    // Count issues in this project to generate the key
    const projectIssues = issues.filter(iss => iss.project_id === currentProject.id && !iss.key.includes('-SUB-'));
    const serial = projectIssues.length + 1;
    const key = `${currentProject.key}-${serial}`;
    const id = `iss_${Date.now()}`;

    const newIssue: Issue = {
      ...issueData,
      id,
      key,
      project_id: currentProject.id,
      status: issueData.status || 'To Do'
    };

    setIssues(prev => [...prev, newIssue]);

    // Send notifications if assignee exists
    if (newIssue.assignee_id && newIssue.assignee_id !== currentUser?.id) {
      const alertMsg = `${currentUser?.name || 'Someone'} assigned you: ${newIssue.key} ${newIssue.title}`;
      sendNotification(newIssue.assignee_id, 'assignment', newIssue.id, alertMsg);
    }

    // Add activity log
    const log: ActivityLog = {
      id: `act_${Date.now()}`,
      issue_id: id,
      user_id: currentUser?.id || 'system',
      action: `Created issue in project`,
      timestamp: new Date().toISOString()
    };
    setActivityLogs(prev => [...prev, log]);
  };

  const updateIssue = (issueId: string, updates: Partial<Issue>) => {
    let oldIssue: Issue | undefined;
    setIssues(prev => prev.map(iss => {
      if (iss.id === issueId) {
        oldIssue = { ...iss };
        return { ...iss, ...updates };
      }
      return iss;
    }));

    // Log updates
    if (oldIssue) {
      const logsToAdd: ActivityLog[] = [];
      const keys = Object.keys(updates) as Array<keyof Issue>;
      keys.forEach(key => {
        const val = updates[key];
        const oldVal = oldIssue?.[key];
        if (val !== oldVal && key !== 'id' && key !== 'key') {
          let actionDesc = `Updated ${key}`;
          if (key === 'status') {
            actionDesc = `Changed Status from ${oldVal} to ${val}`;
          } else if (key === 'assignee_id') {
            const newUser = users.find(u => u.id === val);
            actionDesc = `Assigned task to ${newUser ? newUser.name : 'Unassigned'}`;
            // Send notification
            if (val && val !== currentUser?.id) {
              sendNotification(val as string, 'assignment', issueId, `You have been assigned to ${oldIssue?.key}`);
            }
          }
          logsToAdd.push({
            id: `act_${Date.now()}_${key}`,
            issue_id: issueId,
            user_id: currentUser?.id || 'system',
            action: actionDesc,
            timestamp: new Date().toISOString()
          });
        }
      });
      if (logsToAdd.length > 0) {
        setActivityLogs(prev => [...prev, ...logsToAdd]);
      }
    }
  };

  const deleteIssue = (issueId: string) => {
    setIssues(prev => prev.filter(iss => iss.id !== issueId && iss.parent_id !== issueId));
  };

  const changeIssueStatus = (issueId: string, newStatus: string) => {
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;
    const oldStatus = issue.status;
    if (oldStatus === newStatus) return;

    updateIssue(issueId, { status: newStatus });
  };

  // Comments Operations
  const addComment = (issueId: string, body: string) => {
    if (!currentUser) return;
    const newComment: Comment = {
      id: `c_${Date.now()}`,
      issue_id: issueId,
      author_id: currentUser.id,
      body,
      created_at: new Date().toISOString()
    };
    setComments(prev => [...prev, newComment]);

    // Track mentions in comment (e.g. "@Sarah Connor")
    users.forEach(u => {
      if (body.includes(`@${u.name}`)) {
        sendNotification(u.id, 'mention', issueId, `${currentUser.name} @mentioned you in: ${body.substring(0, 50)}...`);
      }
    });

    // Add activity log
    setActivityLogs(prev => [...prev, {
      id: `act_${Date.now()}`,
      issue_id: issueId,
      user_id: currentUser.id,
      action: `Added a comment`,
      timestamp: new Date().toISOString()
    }]);
  };

  // Worklog Operations
  const addWorklog = (issueId: string, hours: number, note?: string, date?: string) => {
    if (!currentUser) return;
    const newLog: Worklog = {
      id: `w_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      issue_id: issueId,
      user_id: currentUser.id,
      time_spent: hours,
      logged_date: date || new Date().toISOString().split('T')[0],
      note
    };
    setWorklogs(prev => [...prev, newLog]);

    // Update remaining estimate on issue
    const issue = issues.find(i => i.id === issueId);
    if (issue && issue.estimate !== null) {
      const remaining = Math.max(0, issue.estimate - hours);
      updateIssue(issueId, { estimate: remaining });
    }

    // Add activity log
    setActivityLogs(prev => [...prev, {
      id: `act_${Date.now()}`,
      issue_id: issueId,
      user_id: currentUser.id,
      action: `Logged ${hours}h of work${note ? ` (${note})` : ''}`,
      timestamp: new Date().toISOString()
    }]);
  };

  // Attachment Simulation
  const addAttachment = (issueId: string, fileName: string, sizeKb: number) => {
    if (!currentUser) return;
    const newAtt = {
      id: `att_${Date.now()}`,
      file_name: fileName,
      size_kb: sizeKb,
      uploaded_by: currentUser.name,
      uploaded_at: new Date().toISOString()
    };
    setAttachments(prev => ({
      ...prev,
      [issueId]: [...(prev[issueId] || []), newAtt]
    }));

    // Add activity log
    setActivityLogs(prev => [...prev, {
      id: `act_${Date.now()}`,
      issue_id: issueId,
      user_id: currentUser.id,
      action: `Uploaded attachment: ${fileName} (${(sizeKb/1024).toFixed(2)} MB)`,
      timestamp: new Date().toISOString()
    }]);
  };

  // Notification Operations
  const sendNotification = (userId: string, type: 'assignment' | 'mention' | 'update', referenceId: string, message: string) => {
    const newNotif: Notification = {
      id: `n_${Date.now()}_${Math.random()}`,
      user_id: userId,
      type,
      reference_id: referenceId,
      read_flag: false,
      message,
      created_at: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read_flag: true } : n));
  };

  const clearNotifications = () => {
    if (!currentUser) return;
    setNotifications(prev => prev.filter(n => n.user_id !== currentUser.id));
  };

  // Admin Custom Workflow
  const updateWorkflowColumns = (projectId: string, columns: WorkflowColumn[]) => {
    setWorkflows(prev => prev.map(w => w.projectId === projectId ? { ...w, columns } : w));
    // Create activity logs for admin update
    setActivityLogs(prev => [...prev, {
      id: `act_${Date.now()}`,
      issue_id: 'system',
      user_id: currentUser?.id || 'admin',
      action: `Updated board workflow columns configuration`,
      timestamp: new Date().toISOString()
    }]);
  };

  const addProjectMember = (projectId: string, userId: string, role: Role) => {
    const exists = projectMembers.some(m => m.project_id === projectId && m.user_id === userId);
    if (exists) return;
    const newMember: ProjectMember = { project_id: projectId, user_id: userId, role };
    setProjectMembers(prev => [...prev, newMember]);

    // Add activity log
    const u = users.find(user => user.id === userId);
    const p = projects.find(proj => proj.id === projectId);
    setActivityLogs(prev => [...prev, {
      id: `act_${Date.now()}`,
      issue_id: 'system',
      user_id: currentUser?.id || 'system',
      action: `Added member ${u?.name || userId} to project ${p?.name || projectId}`,
      timestamp: new Date().toISOString()
    }]);
  };

  const removeProjectMember = (projectId: string, userId: string) => {
    setProjectMembers(prev => prev.filter(m => !(m.project_id === projectId && m.user_id === userId)));

    // Add activity log
    const u = users.find(user => user.id === userId);
    const p = projects.find(proj => proj.id === projectId);
    setActivityLogs(prev => [...prev, {
      id: `act_${Date.now()}`,
      issue_id: 'system',
      user_id: currentUser?.id || 'system',
      action: `Removed member ${u?.name || userId} from project ${p?.name || projectId}`,
      timestamp: new Date().toISOString()
    }]);
  };

  // Timer Operations
  const startTimer = (issueId: string) => {
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;
    setActiveTimer({
      issueId,
      startTime: new Date().toISOString(),
      title: `${issue.key} - ${issue.title}`
    });
  };

  const stopTimer = (note?: string) => {
    if (!activeTimer) return;
    const elapsedMs = Date.now() - new Date(activeTimer.startTime).getTime();
    // Convert ms to hours, keeping it precise (e.g. 0.05h minimum to see fast manual logs)
    const hours = Math.max(0.01, Number((elapsedMs / (1000 * 60 * 60)).toFixed(3)));
    addWorklog(activeTimer.issueId, hours, note || 'Tracked via live work timer');
    setActiveTimer(null);
  };

  const cancelTimer = () => {
    setActiveTimer(null);
  };

  const sendMessage = (projectId: string, receiverId: string | null, message: string) => {
    if (!currentUser) return;
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      project_id: projectId,
      sender_id: currentUser.id,
      receiver_id: receiverId,
      message,
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, newMsg]);
  };

  return (
    <TaskFlowContext.Provider value={{
      currentUser,
      users,
      projects,
      sprints,
      epics,
      issues,
      comments,
      worklogs,
      activityLogs,
      chatMessages,
      notifications: notifications.filter(n => n.user_id === currentUser?.id),
      workflows,
      currentProject,
      currentView,
      darkMode,
      setView,
      setCurrentProject,
      login,
      loginWithUserData,
      logout,
      register,
      createProject,
      deleteProject,
      createSprint,
      startSprint,
      closeSprint,
      createIssue,
      updateIssue,
      deleteIssue,
      changeIssueStatus,
      addComment,
      addWorklog,
      addAttachment,
      attachments,
      markNotificationRead,
      clearNotifications,
      toggleDarkMode,
      updateWorkflowColumns,
      addUser,
      removeUser,
      activeTimer,
      startTimer,
      stopTimer,
      cancelTimer,
      sendMessage,
      projectMembers,
      addProjectMember,
      removeProjectMember
    }}>
      {children}
    </TaskFlowContext.Provider>
  );
};

export const useTaskFlow = () => {
  const context = useContext(TaskFlowContext);
  if (!context) throw new Error('useTaskFlow must be used within a TaskFlowProvider');
  return context;
};
