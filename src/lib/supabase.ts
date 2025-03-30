import { createClient } from '@supabase/supabase-js';
import { getCurrentUser } from './auth';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ContactList = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  user_id: string;
  contacts_json: Array<{
    id: string;
    name: string;
    number: string;
  }>;
};

export type MessageHistory = {
  id: string;
  message: string;
  variables: Record<string, string[]>;
  status: 'success' | 'error' | 'pending';
  sent_at: string;
  user_id: string;
  batch_id: string;
  error_message: string | null;
  contact_info: {
    id: string;
    name: string;
    number: string;
  };
};

// Función para asegurar que el usuario esté autenticado
const ensureAuthenticated = () => {
  const user = getCurrentUser();
  if (!user || !user.id) {
    throw new Error('Usuario no autenticado');
  }
  return user;
};

export const createContactList = async (
  name: string,
  description: string | null,
  contacts: Array<{ name: string; number: string }>
) => {
  // Verifica que exista un usuario autenticado
  const user = ensureAuthenticated();

  // Se asigna un ID único a cada contacto
  const contactsWithIds = contacts.map(contact => ({
    ...contact,
    id: crypto.randomUUID()
  }));

  const { data, error } = await supabase
    .from('contact_lists')
    .insert([{
      name,
      description,
      user_id: user.id, // Se asigna el ID del usuario autenticado
      contacts_json: contactsWithIds
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating contact list:', error);
    throw new Error('Error al crear la lista de contactos');
  }

  return data;
};

export const getContactLists = async () => {
  const user = ensureAuthenticated();

  const { data, error } = await supabase
    .from('contact_lists')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const updateContactList = async (
  listId: string,
  updates: {
    name?: string;
    description?: string;
    contacts?: Array<{ id: string; name: string; number: string }>;
  }
) => {
  const user = ensureAuthenticated();

  const { data, error } = await supabase
    .from('contact_lists')
    .update({
      ...(updates.name && { name: updates.name }),
      ...(updates.description && { description: updates.description }),
      ...(updates.contacts && { contacts_json: updates.contacts })
    })
    .eq('id', listId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteContactList = async (listId: string) => {
  const user = ensureAuthenticated();

  const { error } = await supabase
    .from('contact_lists')
    .delete()
    .eq('id', listId)
    .eq('user_id', user.id);

  if (error) throw error;
};

export const recordMessageHistory = async (
  batchId: string,
  messages: Array<{
    message: string;
    variables: Record<string, string[]>;
    contact: { id: string; name: string; number: string };
    status: 'success' | 'error' | 'pending';
    error_message?: string;
  }>
) => {
  const user = ensureAuthenticated();

  const { data, error } = await supabase
    .from('message_history')
    .insert(
      messages.map(msg => ({
        batch_id: batchId,
        message: msg.message,
        variables: msg.variables,
        contact_info: msg.contact,
        status: msg.status,
        error_message: msg.error_message,
        user_id: user.id
      }))
    )
    .select();

  if (error) throw error;
  return data;
};

export const getMessageHistory = async () => {
  const user = ensureAuthenticated();

  const { data, error } = await supabase
    .from('message_history')
    .select('*')
    .eq('user_id', user.id)
    .order('sent_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getMessageHistoryByBatch = async (batchId: string) => {
  const user = ensureAuthenticated();

  const { data, error } = await supabase
    .from('message_history')
    .select('*')
    .eq('batch_id', batchId)
    .eq('user_id', user.id)
    .order('sent_at', { ascending: true });

  if (error) throw error;
  return data;
};
