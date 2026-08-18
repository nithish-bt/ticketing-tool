export type Role = 'Super Admin' | 'Project Manager' | 'Team Lead' | 'Developer' | 'Tester' | 'Viewer' | (string & {});

export type IssueType = 'Story' | 'Task' | 'Bug' | 'Sub-task';

export type Priority = 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';

export type SprintStatus = 'inactive' | 'active' | 'closed';

export interface Organization {
  id: string;
  name: string;
  plan: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization_id: string;
  avatarUrl?: string;
  password?: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  type: 'Scrum' | 'Kanban' | 'Timesheet';
  description: string;
  organization_id: string;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: Role;
}

export interface Epic {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'To Do' | 'In Progress' | 'Done';
  color?: string; // For visual tags
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  start_date: string;
  end_date: string;
  goal: string;
  status: SprintStatus;
}

export interface Issue {
  id: string;
  project_id: string;
  key: string;
  type: IssueType;
  title: string;
  description: string;
  status: string; // Dynamic status e.g., 'To Do', 'In Progress', 'In Review', 'Done'
  priority: Priority;
  assignee_id: string | null;
  reporter_id: string;
  epic_id: string | null;
  sprint_id: string | null; // null means in backlog
  estimate: number | null; // Story points or hours
  due_date: string | null;
  parent_id?: string | null; // For sub-tasks
}

export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  issue_id: string;
  file_name: string;
  file_url: string;
  uploaded_by: string;
  uploaded_at: string;
  size_kb: number;
}

export interface Worklog {
  id: string;
  issue_id: string;
  user_id: string;
  time_spent: number; // in hours
  logged_date: string;
  note?: string;
}

export interface Label {
  id: string;
  project_id: string;
  name: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'assignment' | 'mention' | 'update';
  reference_id: string; // issue_id or comment_id
  read_flag: boolean;
  message: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  issue_id: string;
  user_id: string;
  action: string; // e.g., 'Changed Status from To Do to In Progress'
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  sender_id: string;
  receiver_id: string | null; // null means Team Channel, otherwise DM
  message: string;
  created_at: string;
}

export interface Meeting {
  id: string;
  project_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  platform: 'Google Meet' | 'Microsoft Teams' | 'Zoom' | 'In-App Room' | 'Other';
  link: string;
  organizer_id: string;
  attendee_ids: string[];
  notes?: string;
}
