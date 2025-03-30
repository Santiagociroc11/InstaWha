import { useState } from 'react';
import { getCurrentUser } from '../lib/auth';

const EVOLUTION_SERVER_URL = import.meta.env.VITE_EVOLUTIONAPI_URL;
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTIONAPI_TOKEN;
const INSTANCE_PREFIX = 'InstaWha';

export interface WhatsAppChat {
  id: string;
  remoteJid: string;
  pushName: string;
  profilePicUrl?: string;
  updatedAt: string;
}

export interface WhatsAppContact {
  id: string;
  name: string;
  remoteJid: string;
}

export interface WhatsAppGroup {
  id: string;
  subject: string;
  subjectOwner: string;
  subjectTime: number;
  pictureUrl: string | null;
  size: number;
  creation: number;
  owner: string;
  desc?: string;
  descId?: string;
  restrict: boolean;
  announce: boolean;
  isCommunity: boolean;
  isCommunityAnnounce: boolean;
}

export const useWhatsAppSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInstanceName = () => {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');
    return `${INSTANCE_PREFIX}_${user.username}`;
  };

  const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3) => {
    let lastError: Error | null = null;
    let retryCount = 0;
    const timeout = 30000; // 30 seconds

    while (retryCount < maxRetries) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          mode: 'cors',
          headers: {
            ...options.headers,
            'Accept': 'application/json',
          },
        });

        clearTimeout(id);
        return response;
      } catch (error) {
        lastError = error as Error;
        retryCount++;
        
        if (retryCount < maxRetries) {
          // Exponential backoff between retries
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          continue;
        }
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error('La solicitud tardó demasiado tiempo. Por favor, verifica tu conexión a internet.');
          }
        }
        throw error;
      }
    }

    throw lastError;
  };

  const searchContacts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const instanceName = getInstanceName();
      const response = await fetchWithRetry(
        `${EVOLUTION_SERVER_URL}/chat/findContacts/${instanceName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
          },
          body: JSON.stringify({ where: {} }), // Added required where object
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al buscar contactos: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.map((contact: any) => ({
        id: contact.id || contact.remoteJid,
        name: contact.pushName || contact.verifiedName || contact.notify || contact.id?.split('@')[0],
        number: contact.remoteJid || contact.id,
        profilePicUrl: contact.profilePicUrl,
        isValid: true
      }));
    } catch (err) {
      console.error('Error searching contacts:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al buscar contactos');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const searchGroups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const instanceName = getInstanceName();
      const response = await fetchWithRetry(
        `${EVOLUTION_SERVER_URL}/group/fetchAllGroups/${instanceName}?getParticipants=false`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al buscar grupos: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.map((group: WhatsAppGroup) => ({
        id: group.id,
        name: group.subject,
        number: group.id,
        profilePicUrl: group.pictureUrl,
        isValid: true
      }));
    } catch (err) {
      console.error('Error searching groups:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al buscar grupos');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const searchChats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const instanceName = getInstanceName();
      const response = await fetchWithRetry(
        `${EVOLUTION_SERVER_URL}/chat/findChats/${instanceName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al buscar chats: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.map((chat: WhatsAppChat) => ({
        id: chat.remoteJid,
        name: chat.pushName || chat.remoteJid.split('@')[0],
        number: chat.remoteJid,
        profilePicUrl: chat.profilePicUrl,
        isValid: true
      }));
    } catch (err) {
      console.error('Error searching chats:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al buscar chats');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    searchContacts,
    searchGroups,
    searchChats,
    isLoading,
    error,
  };
};