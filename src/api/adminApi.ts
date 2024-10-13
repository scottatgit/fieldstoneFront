import axiosInstance from '../shared/lib/axiosConfig';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  showcase: boolean;  // New field for showcase status
  reviewed: boolean;  // New field for reviewed status
  category: string;   // New field for user category (e.g., 'new', 'verified', etc.)
}

export const fetchUsers = async (): Promise<User[]> => {
  const { data } = await axiosInstance.get<User[]>('/api/admin/users');
  return data;
};

export const updateUser = async (
  id: string,
  userData: Partial<User>
): Promise<User> => {
  const { data } = await axiosInstance.put<User>(`/api/admin/users/${id}`, userData);
  return data;
};

export const deleteUser = async (id: string): Promise<{ message: string }> => {
  const { data } = await axiosInstance.delete<{ message: string }>(`/api/admin/users/${id}`);
  return data;
};

// New function to add a user
export const createUser = async (newUser: Omit<User, '_id'>): Promise<User> => {
  const { data } = await axiosInstance.post<User>('/api/admin/users', newUser);
  return data;
};
