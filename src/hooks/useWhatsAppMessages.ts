import { useState } from 'react';
import type { SendingConfig } from '../components/MessageComposer';
import { getCurrentUser } from '../lib/auth';

const EVOLUTION_SERVER_URL = import.meta.env.VITE_EVOLUTIONAPI_URL;
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTIONAPI_TOKEN;
const INSTANCE_PREFIX = 'InstaWha';

// Function to generate instance name based on authenticated user
const getInstanceName = () => {
  const user = getCurrentUser();
  if (!user) throw new Error('Usuario no autenticado');
  return `${INSTANCE_PREFIX}_${user.username}`;
};

interface MessageKey {
  id: string;
}

interface QuotedMessage {
  key: MessageKey;
  message: {
    conversation: string;
  };
}

interface SendMessagePayload {
  number: string;
  text?: string;
  delay?: number;
  quoted?: QuotedMessage;
  linkPreview?: boolean;
  mentionsEveryOne?: boolean;
  mentioned?: string[];
}

interface SendMediaPayload extends SendMessagePayload {
  mediatype: 'image' | 'video' | 'document' | 'audio';
  media: string;
  mimetype?: string;
  caption?: string;
  fileName?: string;
}

interface SendWhatsAppAudioPayload extends SendMessagePayload {
  audio: string;
  encoding?: boolean;
}

export const useWhatsAppMessages = () => {
  const [isSending, setIsSending] = useState(false);

  const formatPhoneNumber = (number: string): string => {
    // If number already contains '@' (remoteJid format), return as is
    if (number.includes('@')) {
      return number;
    }
    
    // Remove spaces, dashes, parentheses and '+' sign
    let cleaned = number.replace(/[\s\-()]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    
    return cleaned;
  };

  const validatePhoneNumber = (number: string): boolean => {
    // If it's a remoteJid or group ID, it's valid
    if (number.includes('@')) {
      return true;
    }
    if (!number.trim()) {
      return true; // Empty numbers are considered valid
    }
    const cleaned = number.replace(/[\s\-()]/g, '');
    // Must start with '+' or digits, followed by 10-15 digits
    return /^\+?\d{10,15}$/.test(cleaned);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const sendTextMessage = async (payload: SendMessagePayload & { sendingConfig?: SendingConfig }) => {
    try {
      if (!payload.number.trim()) {
        return; // Skip empty numbers
      }

      if (!validatePhoneNumber(payload.number)) {
        throw new Error('Número de teléfono inválido. Debe contener entre 10 y 15 dígitos incluyendo el código de país.');
      }

      setIsSending(true);
      const formattedNumber = formatPhoneNumber(payload.number);
      // Generate instance name dynamically
      const url = `${EVOLUTION_SERVER_URL}/message/sendText/${getInstanceName()}`;
      
      const requestPayload = {
        number: formattedNumber,
        text: payload.text,
        delay: (payload.sendingConfig?.messageDelay || 1) * 1000, // Convert to milliseconds
        ...(payload.quoted && {
          quoted: {
            key: { id: payload.quoted.key.id },
            message: { conversation: payload.quoted.message.conversation }
          }
        }),
        ...(payload.linkPreview !== undefined && { linkPreview: payload.linkPreview }),
        ...(payload.mentionsEveryOne !== undefined && { mentionsEveryOne: payload.mentionsEveryOne }),
        ...(payload.mentioned && payload.mentioned.length > 0 && { mentioned: payload.mentioned })
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify(requestPayload),
      });

      const responseText = await response.text();
      const responseData = JSON.parse(responseText);

      if (!response.ok) {
        if (responseData?.response?.message?.[0]?.exists === false) {
          throw new Error(`El número ${responseData.response.message[0].number} no está registrado en WhatsApp.`);
        }
        throw new Error(`Error al enviar el mensaje: ${responseText}`);
      }

      return responseData;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const sendMedia = async (payload: SendMediaPayload & { sendingConfig?: SendingConfig }) => {
    try {
      if (!payload.number.trim()) {
        return;
      }

      if (!validatePhoneNumber(payload.number)) {
        throw new Error('Número de teléfono inválido. Debe contener entre 10 y 15 dígitos incluyendo el código de país.');
      }

      setIsSending(true);
      const formattedNumber = formatPhoneNumber(payload.number);
      const url = `${EVOLUTION_SERVER_URL}/message/sendMedia/${getInstanceName()}`;
      
      const requestPayload = {
        number: formattedNumber,
        mediatype: payload.mediatype,
        media: payload.media,
        mimetype: payload.mimetype,
        caption: payload.caption,
        fileName: payload.fileName,
        delay: (payload.sendingConfig?.messageDelay || 1) * 1000,
        ...(payload.quoted && {
          quoted: {
            key: { id: payload.quoted.key.id },
            message: { conversation: payload.quoted.message.conversation }
          }
        }),
        ...(payload.mentionsEveryOne !== undefined && { mentionsEveryOne: payload.mentionsEveryOne }),
        ...(payload.mentioned && payload.mentioned.length > 0 && { mentioned: payload.mentioned })
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify(requestPayload),
      });

      const responseText = await response.text();
      const responseData = JSON.parse(responseText);

      if (!response.ok) {
        if (responseData?.response?.message?.[0]?.exists === false) {
          throw new Error(`El número ${responseData.response.message[0].number} no está registrado en WhatsApp.`);
        }
        throw new Error(`Error al enviar el archivo: ${responseText}`);
      }

      return responseData;
    } catch (error) {
      console.error('Error sending media:', error);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const sendWhatsAppAudio = async (payload: SendWhatsAppAudioPayload & { sendingConfig?: SendingConfig }) => {
    try {
      if (!payload.number.trim()) {
        return;
      }

      if (!validatePhoneNumber(payload.number)) {
        throw new Error('Número de teléfono inválido. Debe contener entre 10 y 15 dígitos incluyendo el código de país.');
      }

      setIsSending(true);
      const formattedNumber = formatPhoneNumber(payload.number);
      const url = `${EVOLUTION_SERVER_URL}/message/sendWhatsAppAudio/${getInstanceName()}`;
      
      const requestPayload = {
        number: formattedNumber,
        audio: payload.audio,
        delay: (payload.sendingConfig?.messageDelay || 1) * 1000,
        encoding: payload.encoding,
        ...(payload.quoted && {
          quoted: {
            key: { id: payload.quoted.key.id },
            message: { conversation: payload.quoted.message.conversation }
          }
        }),
        ...(payload.mentionsEveryOne !== undefined && { mentionsEveryOne: payload.mentionsEveryOne }),
        ...(payload.mentioned && payload.mentioned.length > 0 && { mentioned: payload.mentioned })
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify(requestPayload),
      });

      const responseText = await response.text();
      const responseData = JSON.parse(responseText);

      if (!response.ok) {
        if (responseData?.response?.message?.[0]?.exists === false) {
          throw new Error(`El número ${responseData.response.message[0].number} no está registrado en WhatsApp.`);
        }
        throw new Error(`Error al enviar el audio: ${responseText}`);
      }

      return responseData;
    } catch (error) {
      console.error('Error sending WhatsApp audio:', error);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  return {
    isSending,
    sendTextMessage,
    sendMedia,
    sendWhatsAppAudio,
    validatePhoneNumber,
  };
};