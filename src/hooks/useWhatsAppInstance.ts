import { useState, useEffect } from 'react';
import { getCurrentUser } from '../lib/auth';

// Evolution API Configuration
const EVOLUTION_SERVER_URL = import.meta.env.VITE_EVOLUTIONAPI_URL;
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTIONAPI_TOKEN;
const INSTANCE_PREFIX = 'InstaWha';

export interface WhatsAppInstance {
  name: string;
  connectionStatus: string;
  ownerJid: string;
  profileName: string;
  profilePictureUrl?: string;
}

export const useWhatsAppInstance = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingInstance, setIsCreatingInstance] = useState(false);
  const [instanceInfo, setInstanceInfo] = useState<WhatsAppInstance | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [whatsappStatus, setWhatsappStatus] = useState('Desconectado');
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const getInstanceName = () => {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');
    return `${INSTANCE_PREFIX}_${user.username}`;
  };

  const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
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
      clearTimeout(id);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('La solicitud tardó demasiado tiempo');
        }
      }
      throw error;
    }
  };

  useEffect(() => {
    const user = getCurrentUser();

    // Reset state immediately when user changes
    if (!user) {
      setInstanceInfo(null);
      setQrCode('');
      setWhatsappStatus('Desconectado');
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return;
    }

    // Initialize instance for the current user
    const initInstance = async () => {
      try {
        setIsLoading(true);
        const instanceExists = await handleFetchInstanceInfo();
        
        if (!instanceExists) {
          await handleCreateInstance();
        } else if (instanceInfo?.connectionStatus !== "open") {
          await refreshConnection();
        }
      } catch (error) {
        console.error("Error initializing instance:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Start polling for the current user
    initInstance();
    const interval = setInterval(handleFetchInstanceInfo, 10000);
    setPollingInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [getCurrentUser()?.id]); // Re-run effect when user ID changes

  const initializeInstance = async () => {
    try {
      setIsLoading(true);
      const user = getCurrentUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      const instanceExists = await handleFetchInstanceInfo();
      
      if (!instanceExists) {
        await handleCreateInstance();
      } else if (instanceInfo?.connectionStatus !== "open") {
        await refreshConnection();
      }
    } catch (error) {
      console.error("Error initializing instance:", error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          throw new Error('No se pudo conectar con el servidor de Evolution API. Por favor, verifica tu conexión a internet y que el servidor esté en línea.');
        }
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInstance = async () => {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const instanceName = getInstanceName();
    const payload = {
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS"
    };

    try {
      setIsCreatingInstance(true);
      const response = await fetchWithTimeout(
        `${EVOLUTION_SERVER_URL}/instance/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": EVOLUTION_API_KEY,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Create Instance failed with status: ${response.status}, error: ${errorText}`);
        throw new Error(`No se pudo crear la instancia: ${response.status} - ${errorText}`);
      }

      await response.json();
      await refreshConnection();
      setWhatsappStatus("Desconectado");
    } catch (error) {
      console.error("Error creando instancia:", error);
      throw error;
    } finally {
      setIsCreatingInstance(false);
    }
  };

  const handleInstanceConnect = async () => {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const instanceName = getInstanceName();
      const url = `${EVOLUTION_SERVER_URL}/instance/connect/${encodeURIComponent(instanceName)}`;
      const response = await fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": EVOLUTION_API_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Connect Instance failed with status: ${response.status}, error: ${errorText}`);
        throw new Error(`Error al conectar la instancia: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      let qrCodeData = '';
      if (data.qrcode && data.qrcode.base64) {
        qrCodeData = data.qrcode.base64;
      } else if (data.base64) {
        qrCodeData = data.base64;
      }
      
      qrCodeData = qrCodeData.replace('data:image/png;base64,', '');
      qrCodeData = qrCodeData.replace('data:image/jpeg;base64,', '');
      
      if (qrCodeData) {
        setQrCode(qrCodeData);
      }
    } catch (error) {
      console.error("Error in handleInstanceConnect:", error);
      throw error;
    }
  };

  const handleFetchInstanceInfo = async () => {
    const user = getCurrentUser();
    if (!user) {
      return false;
    }

    try {
      const instanceName = getInstanceName();
      const url = `${EVOLUTION_SERVER_URL}/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`;
      const response = await fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "apikey": EVOLUTION_API_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Fetch Instance Info failed with status: ${response.status}, error: ${errorText}`);
        throw new Error(`Error al obtener la información de la instancia: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const instance = data[0];
        setInstanceInfo(instance);
        if (instance.connectionStatus === "open") {
          setWhatsappStatus("Conectado");
        } else if (instance.connectionStatus === "connecting") {
          setWhatsappStatus("Conectando");
        } else {
          setWhatsappStatus("Desconectado");
        }
        return true;
      } else {
        setInstanceInfo(null);
        setWhatsappStatus("Desconectado");
        return false;
      }
    } catch (error) {
      console.error("Error in handleFetchInstanceInfo:", error);
      return false;
    }
  };

  const refreshConnection = async () => {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      await handleInstanceConnect();
      await handleFetchInstanceInfo();
    } catch (error) {
      console.error("Error refreshing connection:", error);
    }
  };

  const handleDisconnect = async () => {
    const user = getCurrentUser();
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setIsLoading(true);
      const instanceName = getInstanceName();
      const url = `${EVOLUTION_SERVER_URL}/instance/logout/${encodeURIComponent(instanceName)}`;
      const response = await fetchWithTimeout(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "apikey": EVOLUTION_API_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Logout Instance failed with status: ${response.status}, error: ${errorText}`);
        throw new Error(`Error al desconectar la instancia: ${response.status} - ${errorText}`);
      }

      setWhatsappStatus("Desconectado");
      setInstanceInfo(null);
      setQrCode('');
      await refreshConnection();
    } catch (error) {
      console.error("Error desconectando instancia:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isCreatingInstance,
    instanceInfo,
    qrCode,
    whatsappStatus,
    handleCreateInstance,
    handleDisconnect,
    refreshConnection,
  };
};