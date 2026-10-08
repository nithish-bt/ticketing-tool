import { API_BASE_URL } from './api';

export interface ApiUser {
  id?: string | number;
  name: string | null;
  email: string | null;
  phone: string | null;
  password: string | null;
}

export const fetchUsersApi = async (): Promise<ApiUser[]> => {
  const response = await fetch(`${API_BASE_URL}/api/users`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Network response was not ok');
  }

  return response.json();
};
