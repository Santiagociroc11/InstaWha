import { useState } from 'react';
import { recordMessageHistory, getMessageHistory, getMessageHistoryByBatch } from '../lib/supabase';
import type { MessageHistory } from '../lib/supabase';

export const useMessageHistory = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveMessageHistory = async (
    batchId: string,
    messages: Array<{
      message: string;
      variables: Record<string, string[]>;
      contact_id?: string;
      status: 'success' | 'error' | 'pending';
      error_message?: string;
    }>
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await recordMessageHistory(batchId, messages);
      return data;
    } catch (err) {
      setError('Error al guardar el historial de mensajes');
      console.error('Error saving message history:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessageHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMessageHistory();
      return data;
    } catch (err) {
      setError('Error al cargar el historial de mensajes');
      console.error('Error loading message history:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const loadBatchHistory = async (batchId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getMessageHistoryByBatch(batchId);
      return data;
    } catch (err) {
      setError('Error al cargar el historial del lote');
      console.error('Error loading batch history:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    saveMessageHistory,
    loadMessageHistory,
    loadBatchHistory,
  };
};