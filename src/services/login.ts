import type { Role } from '../types';

export interface StaticUserAccount {
  username: string;
  userId: string;
  userName: string;
  designation: string;
  role: Role;
  roleId: string;
}

export const DEFAULT_STATIC_CREDENTIALS = {
  username: 'admin',
  password: 'password',
};

export const STATIC_PASSWORDS = ['password', 'admin', 'user', 'admin123', '123456'];

export const STATIC_ACCOUNTS: Record<string, StaticUserAccount> = {
  admin: {
    username: 'admin',
    userId: 'u1',
    userName: 'Admin',
    role: 'Super Admin',
    designation: 'Super Admin',
    roleId: '1',
  },
  nithish: {
    username: 'nithish',
    userId: 'u1',
    userName: 'Nithish SV',
    role: 'Super Admin',
    designation: 'Super Admin',
    roleId: '1',
  },
  nithya: {
    username: 'nithya',
    userId: 'u2',
    userName: 'Nithya Sree',
    role: 'Project Manager',
    designation: 'Project Manager',
    roleId: '2',
  },
  maya: {
    username: 'maya',
    userId: 'u3',
    userName: 'Maya',
    role: 'Team Lead',
    designation: 'Team Lead',
    roleId: '3',
  },
  shyam: {
    username: 'shyam',
    userId: 'u4',
    userName: 'Shyam',
    role: 'Developer',
    designation: 'Developer',
    roleId: '4',
  },
  vijay: {
    username: 'vijay',
    userId: 'u5',
    userName: 'Vijay',
    role: 'Developer',
    designation: 'Developer',
    roleId: '4',
  },
  sara: {
    username: 'sara',
    userId: 'u7',
    userName: 'Sara',
    role: 'Tester',
    designation: 'Tester',
    roleId: '5',
  },
  anand: {
    username: 'anand',
    userId: 'u6',
    userName: 'Anand',
    role: 'Viewer',
    designation: 'Viewer',
    roleId: '6',
  },
};
