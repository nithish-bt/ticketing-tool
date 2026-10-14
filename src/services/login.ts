import { API_BASE_URL } from './api';

export interface LoginUserData {
  userId: string;
  userName: string;
  designation?: string;
  roleId?: string;
}

export interface LoginResponse {
  status: string;
  access_token: string;
  message?: string;
  data: LoginUserData;
}

export const loginApi = async (
  username?: string,
  password?: string
): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        password,
        userName: username,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        status: 'error',
        access_token: '',
        message: errorData.message || errorData.error || `Login failed with status ${response.status}`,
        data: {} as LoginUserData,
      };
    }

    const resData = await response.json();

    return {
      status: resData.status || 'success',
      access_token: resData.access_token || resData.token || '',
      message: resData.message,
      data: {
        userId: resData.data?.userId || resData.user?.id || resData.userId || (username || 'user'),
        userName: resData.data?.userName || resData.user?.name || resData.userName || (username || 'user'),
        designation: resData.data?.designation || resData.user?.designation,
        roleId: resData.data?.roleId || resData.user?.roleId || '1',
      },
    };
  } catch (error: any) {
    // Fallback for demo users in offline development when backend server is unavailable
    const lower = (username || '').toLowerCase();
    const demoUsers: Record<string, LoginUserData> = {
      nithish: { userId: 'u1', userName: 'Nithish SV', designation: 'Super Admin', roleId: '1' },
      admin:   { userId: 'u1', userName: 'admin', designation: 'Super Admin', roleId: '1' },
      nithya:  { userId: 'u2', userName: 'Nithya Sree', designation: 'Project Manager', roleId: '2' },
      maya:    { userId: 'u3', userName: 'Maya', designation: 'Team Lead', roleId: '3' },
      shyam:   { userId: 'u4', userName: 'Shyam', designation: 'Developer', roleId: '4' },
      vijay:   { userId: 'u5', userName: 'Vijay', designation: 'Developer', roleId: '4' },
      sara:    { userId: 'u7', userName: 'Sara', designation: 'Tester', roleId: '5' },
      anand:   { userId: 'u6', userName: 'Anand', designation: 'Viewer', roleId: '6' },
    };

    if (lower && demoUsers[lower]) {
      return {
        status: 'success',
        access_token: `mock-token-${Date.now()}`,
        data: demoUsers[lower],
      };
    }

    throw error;
  }
};
