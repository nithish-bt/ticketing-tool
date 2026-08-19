import { API_BASE_URL } from './api';

export const loginApi = async (username?: string, password?: string) => {
  const response = await fetch(`${API_BASE_URL}/salesTracking/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Network response was not ok');
  }

  return response.json();
};
