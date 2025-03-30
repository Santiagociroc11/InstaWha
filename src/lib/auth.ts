import { supabase } from './supabase';

export interface User {
  id: string;
  username: string;
}

export const register = async (username: string, password: string): Promise<void> => {
  // Check if username already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single();

  if (existingUser) {
    throw new Error('El nombre de usuario ya está en uso');
  }

  // Create new user
  const { data, error } = await supabase
    .from('users')
    .insert([{ username, password }])
    .select()
    .single();

  if (error) {
    console.error('Error registering user:', error);
    throw new Error('Error al crear el usuario');
  }
};

export const login = async (username: string, password: string): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error || !data) {
    throw new Error('Credenciales inválidas');
  }

  // Store user data in localStorage
  localStorage.setItem('user', JSON.stringify(data));
  return data;
};

export const logout = () => {
  localStorage.removeItem('user');
};

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    const user = JSON.parse(userStr);
    if (!user || !user.id || !user.username) {
      localStorage.removeItem('user');
      return null;
    }
    return user;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};