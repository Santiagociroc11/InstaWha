import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FixedSizeList as List } from 'react-window';
import {
  Send,
  X,
  Loader,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  MessageSquare,
  Image as ImageIcon,
} from 'lucide-react';
import { useWhatsAppMessages } from '../hooks/useWhatsAppMessages';
import { useMessageHistory } from '../hooks/useMessageHistory';
import { fadeIn } from '../animations';
import { ContactTable, Contact } from './ContactTable';
import { MessageComposer, MessageVariable } from './MessageComposer';
import { MediaComposer, MediaConfig } from './MediaComposer';
import { SendingConfig, SendingConfigOptions } from './SendingConfig';

// ======================
// Tipado
// ======================
interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  variables: MessageVariable[];
  onVariablesChange: (variables: MessageVariable[]) => void;
}

type Step = 'contacts' | 'message' | 'config' | 'confirmation' | 'report';
type MessageType = 'text' | 'media';

interface SendingProgress {
  current: number;
  total: number;
  successful: Contact[];
  failed: { contact: Contact; error: string }[];
  currentBatch: number;
  totalBatches: number;
  remainingTime: number;
}

// ======================
// Utilidades
// ======================

// Convierte tokens de formato (negritas, cursivas, etc.) a HTML
const renderFormattedMessage = (text: string): string => {
  let html = text;
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  html = html.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  html = html.replace(/~(.*?)~/g, '<del>$1</del>');
  html = html.replace(/```(.*?)```/g, '<code>$1</code>');
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  // Salto de línea -> <br/>
  html = html.replace(/\n/g, '<br/>');
  return html;
};

// Muestra el texto de manera virtualizada si hay muchas líneas
const VirtualizedPreview: React.FC<{ message: string }> = ({ message }) => {
  const lines = message.split('\n');
  const formattedLines = lines.map((line) => renderFormattedMessage(line));

  return (
    <List
      height={400}
      itemCount={formattedLines.length}
      itemSize={24}
      width="100%"
    >
      {({ index, style }) => (
        <div
          style={style}
          className="text-gray-800"
          dangerouslySetInnerHTML={{ __html: formattedLines[index] }}
        />
      )}
    </List>
  );
};

// ======================
// Modal de impacto (barra y logs animados)
// ======================
/** Interfaz típica de tu progreso */

interface SendingProgress {
  current: number;
  total: number;
  successful: any[]; // o tu tipo real de contacto
  failed: any[]; // o tu tipo real
  currentBatch: number;
  totalBatches: number;
  remainingTime: number;
}

/** Ejemplo de log para cada destinatario o evento */
interface LogEntry {
  id: string;
  contactName: string;
  status: 'pending' | 'success' | 'failure';
  message: string;
}

interface ImpactSendModalProps {
  isOpen: boolean;
  sendingProgress: SendingProgress;
  logs: LogEntry[];
  onComplete: () => void; // Se llama cuando el envío termina
}

const ImpactSendModal: React.FC<ImpactSendModalProps> = ({
  isOpen,
  sendingProgress,
  logs,
  onComplete,
}) => {
  // Cierra automáticamente cuando se llega al total de mensajes
  useEffect(() => {
    if (!isOpen) return;
    if (
      sendingProgress.total > 0 &&
      sendingProgress.current >= sendingProgress.total
    ) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, sendingProgress, onComplete]);

  // Calcula el % de progreso para la barra
  const progressPercent =
    sendingProgress.total > 0
      ? (sendingProgress.current / sendingProgress.total) * 100
      : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative"
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Enviando mensajes...
            </h2>

            {/* Barra de progreso */}
            <div className="mb-4">
              <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-gray-700 mt-2">
                {sendingProgress.current} / {sendingProgress.total} mensajes
                enviados
              </p>
            </div>

            {/* Información de lote y tiempo restante */}
            <div className="text-sm text-gray-600 space-y-1 mb-4">
              <p>
                Lote {sendingProgress.currentBatch} de{' '}
                {sendingProgress.totalBatches}
              </p>
              <p>
                Tiempo restante estimado: {sendingProgress.remainingTime} seg
              </p>
            </div>

            {/* Lista de logs animada con altura máxima y scroll */}
            <div className="max-h-64 overflow-y-auto border-t pt-3">
              <AnimatePresence>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2 p-2 border-b border-gray-100"
                  >
                    {/* Icono según estado */}
                    {log.status === 'pending' && (
                      <Loader className="w-5 h-5 text-gray-400 animate-spin" />
                    )}
                    {log.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {log.status === 'failure' && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <p className="text-sm text-gray-700">{log.message}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ======================
// Modal principal
// ======================
const SendMessageModal: React.FC<SendMessageModalProps> = ({
  isOpen,
  onClose,
  variables,
  onVariablesChange,
}) => {
  const [step, setStep] = useState<Step>('contacts');
  const [messageType, setMessageType] = useState<MessageType>('text');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [message, setMessage] = useState('');
  const [mediaConfig, setMediaConfig] = useState<MediaConfig | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [messageOptions, setMessageOptions] = useState({
    linkPreview: false,
    mentionsEveryOne: false,
  });
  const [sendingConfig, setSendingConfig] = useState<SendingConfigOptions>({
    batchSize: 5,
    batchDelay: 60,
    messageDelay: 3,
  });
  const [error, setError] = useState<string | null>(null);

  const [sendingProgress, setSendingProgress] = useState<SendingProgress>({
    current: 0,
    total: 0,
    successful: [],
    failed: [],
    currentBatch: 0,
    totalBatches: 0,
    remainingTime: 0,
  });

  // Controla si mostramos el modal de impacto
  const [showImpactModal, setShowImpactModal] = useState(false);

  const { sendTextMessage, sendMedia, sendWhatsAppAudio, isSending } =
    useWhatsAppMessages();
  const { saveMessageHistory } = useMessageHistory();

  // =======================
  // Manejo de pasos
  // =======================
  const handleNext = () => {
    setError(null);

    if (step === 'contacts') {
      const validContacts = contacts.filter(
        (c) => c.name.trim() || c.number.trim()
      );
      if (validContacts.length === 0) {
        setError('Agrega al menos un contacto para continuar.');
        return;
      }
      const invalidContacts = validContacts.filter((c) => !c.isValid);
      if (invalidContacts.length > 0) {
        setError(
          `Hay ${invalidContacts.length} número(s) inválido(s). Corrígelos antes de continuar.`
        );
        return;
      }
      setStep('message');
    } else if (step === 'message') {
      if (messageType === 'text') {
        // Validar contenido
        if (!message.trim()) {
          setError('El mensaje no puede estar vacío.');
          return;
        }
        // Validar variables
        const usedVariables = variables.filter((v) => message.includes(v.name));
        const invalidVariables = usedVariables.filter(
          (v) => !v.values.length || v.values.some((val) => !val.trim())
        );
        if (invalidVariables.length > 0) {
          setError(
            `Las siguientes variables tienen valores vacíos: ${invalidVariables
              .map((v) => v.name)
              .join(', ')}`
          );
          return;
        }
      } else {
        // Validar media
        if (!mediaConfig) {
          setError('Selecciona un archivo para enviar.');
          return;
        }
        if (!mediaConfig.base64 && !mediaConfig.url) {
          setError('El archivo no se ha cargado correctamente.');
          return;
        }
        if (mediaConfig.type !== 'audio' && !mediaConfig.caption?.trim()) {
          setError('Agrega un texto/caption para el archivo.');
          return;
        }
      }
      setStep('config');
    } else if (step === 'config') {
      // Validar configuración
      if (sendingConfig.batchSize < 1 || sendingConfig.batchSize > 20) {
        setError('El tamaño del lote debe ser entre 1 y 20 mensajes.');
        return;
      }
      if (sendingConfig.batchDelay < 30 || sendingConfig.batchDelay > 300) {
        setError('El tiempo entre lotes debe estar entre 30 y 300 segundos.');
        return;
      }
      if (sendingConfig.messageDelay < 1 || sendingConfig.messageDelay > 30) {
        setError('El tiempo entre mensajes debe estar entre 1 y 30 segundos.');
        return;
      }
      setStep('confirmation');
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === 'message') setStep('contacts');
    else if (step === 'config') setStep('message');
    else if (step === 'confirmation') setStep('config');
  };

  // =======================
  // Lógica de envío
  // =======================
  const replaceVariablesWithRandomValues = useCallback(
    (text: string, vars: MessageVariable[]) => {
      let result = text;
      for (const variable of vars) {
        if (variable.values.length > 0) {
          const randomValue =
            variable.values[Math.floor(Math.random() * variable.values.length)];
          result = result.replaceAll(variable.name, randomValue);
        }
      }
      return result;
    },
    []
  );

  // Suma total de segundos estimados
  const calculateEstimatedTime = useCallback(
    (totalContacts: number) => {
      const totalBatches = Math.ceil(totalContacts / sendingConfig.batchSize);
      const totalBatchDelay = (totalBatches - 1) * sendingConfig.batchDelay;
      const totalMessageDelay = totalContacts * sendingConfig.messageDelay;
      return totalBatchDelay + totalMessageDelay;
    },
    [sendingConfig]
  );

  const handleSendMessages = async () => {
    try {
      setError(null);
      // Cuando inicia el envío, abrimos el modal de impacto
      setShowImpactModal(true);

      // Limpiamos los logs (por si venimos de otro envío anterior)
      setLogs([]);

      const validContacts = contacts.filter(
        (c) => c.name.trim() || c.number.trim()
      );
      const totalBatches = Math.ceil(
        validContacts.length / sendingConfig.batchSize
      );
      const batchId = crypto.randomUUID();

      setSendingProgress({
        current: 0,
        total: validContacts.length,
        successful: [],
        failed: [],
        currentBatch: 0,
        totalBatches,
        remainingTime: calculateEstimatedTime(validContacts.length),
      });

      const messageHistory: Array<{
        message: string;
        variables: Record<string, string[]>;
        contact: { id: string; name: string; number: string };
        status: 'success' | 'error' | 'pending';
        error_message?: string;
      }> = [];

      for (let i = 0; i < validContacts.length; i += sendingConfig.batchSize) {
        const batch = validContacts.slice(i, i + sendingConfig.batchSize);
        const currentBatch = Math.floor(i / sendingConfig.batchSize) + 1;

        setSendingProgress((prev) => ({
          ...prev,
          currentBatch,
          remainingTime: calculateEstimatedTime(validContacts.length - i),
        }));

        for (const contact of batch) {
          // 1) Creamos un log "pending"
          const pendingLog: LogEntry = {
            id: contact.id, // o `crypto.randomUUID()`, pero mejor usar algo identificable
            contactName: contact.name,
            status: 'pending',
            message: `Enviando mensaje a ${contact.name}...`,
          };
          setLogs((prev) => [...prev, pendingLog]);

          try {
            if (messageType === 'text') {
              const personalizedMessage = replaceVariablesWithRandomValues(
                message,
                variables
              );
              await sendTextMessage({
                number: contact.number,
                text: personalizedMessage,
                ...messageOptions,
                sendingConfig,
              });

              // 2) Actualizamos log a "success"
              setLogs((prevLogs) =>
                prevLogs.map((log) =>
                  log.id === contact.id
                    ? {
                        ...log,
                        status: 'success',
                        message: `Mensaje enviado a ${contact.name}`,
                      }
                    : log
                )
              );

              setSendingProgress((prev) => ({
                ...prev,
                current: prev.current + 1,
                successful: [...prev.successful, contact],
              }));

              messageHistory.push({
                message: personalizedMessage,
                variables: variables.reduce(
                  (acc, v) => ({ ...acc, [v.name]: v.values }),
                  {}
                ),
                contact: {
                  id: contact.id,
                  name: contact.name,
                  number: contact.number,
                },
                status: 'success',
              });
            } else if (mediaConfig) {
              // Envío de multimedia
              if (mediaConfig.type === 'audio') {
                await sendWhatsAppAudio({
                  number: contact.number,
                  audio: mediaConfig.url || mediaConfig.base64 || '',
                  encoding: true,
                  ...messageOptions,
                  sendingConfig,
                });
              } else {
                await sendMedia({
                  number: contact.number,
                  mediatype: mediaConfig.type,
                  media: mediaConfig.url || mediaConfig.base64 || '',
                  mimetype: mediaConfig.mimetype,
                  caption: mediaConfig.caption,
                  fileName: mediaConfig.fileName,
                  ...messageOptions,
                  sendingConfig,
                });
              }

              // 2) Actualizamos log a "success"
              setLogs((prevLogs) =>
                prevLogs.map((log) =>
                  log.id === contact.id
                    ? {
                        ...log,
                        status: 'success',
                        message: `Mensaje enviado a ${contact.name}`,
                      }
                    : log
                )
              );

              setSendingProgress((prev) => ({
                ...prev,
                current: prev.current + 1,
                successful: [...prev.successful, contact],
              }));

              messageHistory.push({
                message:
                  mediaConfig.caption ||
                  `[${mediaConfig.type}] ${mediaConfig.fileName}`,
                variables: {},
                contact: {
                  id: contact.id,
                  name: contact.name,
                  number: contact.number,
                },
                status: 'success',
              });
            }
          } catch (err) {
            console.error(`Error sending to ${contact.name}:`, err);

            // 3) Actualizamos log a "failure"
            setLogs((prevLogs) =>
              prevLogs.map((log) =>
                log.id === contact.id
                  ? {
                      ...log,
                      status: 'failure',
                      message: `Error al enviar a ${contact.name}`,
                    }
                  : log
              )
            );

            setSendingProgress((prev) => ({
              ...prev,
              current: prev.current + 1,
              failed: [
                ...prev.failed,
                {
                  contact,
                  error:
                    err instanceof Error ? err.message : 'Error desconocido',
                },
              ],
            }));
            messageHistory.push({
              message:
                messageType === 'text'
                  ? replaceVariablesWithRandomValues(message, variables)
                  : mediaConfig?.caption ||
                    `[${mediaConfig?.type}] ${mediaConfig?.fileName}`,
              variables:
                messageType === 'text'
                  ? variables.reduce(
                      (acc, v) => ({ ...acc, [v.name]: v.values }),
                      {}
                    )
                  : {},
              contact: {
                id: contact.id,
                name: contact.name,
                number: contact.number,
              },
              status: 'error',
              error_message:
                err instanceof Error ? err.message : 'Error desconocido',
            });
          }

          // Pausa entre mensajes
          if (sendingConfig.messageDelay > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, sendingConfig.messageDelay * 1000)
            );
          }
        }

        // Guardamos histórico tras cada lote
        await saveMessageHistory(batchId, messageHistory);

        // Pausa entre lotes (si quedan lotes)
        if (i + sendingConfig.batchSize < validContacts.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, sendingConfig.batchDelay * 1000)
          );
        }
      }

      // OJO: NO hacemos setStep('report') aquí.
      // Dejamos que el ImpactSendModal detecte que terminó y llame a onComplete().
    } catch (err) {
      console.error('Error en el proceso de envío:', err);
      setError('Error en el proceso de envío. Intenta nuevamente.');
    }
  };

  // =======================
  // Cerrar el modal "grande"
  // =======================
  const handleClose = () => {
    onClose();
    // Reseteamos todo
    setStep('contacts');
    setContacts([]);
    setMessage('');
    setMediaConfig(null);
    setMessageOptions({ linkPreview: false, mentionsEveryOne: false });
    setSendingProgress({
      current: 0,
      total: 0,
      successful: [],
      failed: [],
      currentBatch: 0,
      totalBatches: 0,
      remainingTime: 0,
    });
    setShowImpactModal(false);
  };

  // Formato rápido de tiempo (opcional)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Layout del step "message"
  const renderMessageStep = () => {
    if (messageType === 'text') {
      return (
        <div className="flex gap-4">
          <div className="w-1/2">
            <MessageComposer
              onMessageChange={setMessage}
              onOptionsChange={setMessageOptions}
              variables={variables}
              onVariablesChange={onVariablesChange}
            />
          </div>
          <div
            className="w-1/2 p-4 bg-gray-50 rounded-lg border border-gray-200"
            style={{ maxHeight: '400px', overflowY: 'auto' }}
          >
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Previsualización
            </h4>
            {message.split('\n').length > 20 ? (
              <VirtualizedPreview message={message} />
            ) : (
              <div
                className="text-gray-800 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: renderFormattedMessage(message),
                }}
              />
            )}
          </div>
        </div>
      );
    } else {
      return (
        <MediaComposer onMediaChange={setMediaConfig} onError={setMediaError} />
      );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal principal con AnimatePresence */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 relative border border-white/20"
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-2 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {step === 'contacts' && 'Destinos'}
                  {step === 'message' && 'Mensaje'}
                  {step === 'config' && 'Configuración de Envío'}
                  {step === 'confirmation' && 'Confirmar Envío'}
                  {step === 'report' && 'Informe de Envío'}
                </h2>
              </div>

              {/* Muestra error, si lo hay */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </motion.div>
              )}

              {mediaError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{mediaError}</p>
                </motion.div>
              )}

              {/* Contenido principal según step */}
              <div className="mb-6">
                {step === 'contacts' && (
                  <ContactTable
                    contacts={contacts}
                    onContactsChange={setContacts}
                  />
                )}

                {step === 'message' && (
                  <div className="space-y-6">
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => setMessageType('text')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                          messageType === 'text'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <MessageSquare className="w-5 h-5" />
                        Texto
                      </motion.button>

                      <motion.button
                        onClick={() => setMessageType('media')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                          messageType === 'media'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ImageIcon className="w-5 h-5" />
                        Multimedia
                      </motion.button>
                    </div>
                    {renderMessageStep()}
                  </div>
                )}

                {step === 'config' && (
                  <SendingConfig
                    config={sendingConfig}
                    onChange={setSendingConfig}
                  />
                )}

                {/* Paso final antes de "enviar" */}
                {step === 'confirmation' && (
                  <div className="space-y-6">
                    <div className="bg-white shadow-md p-6 rounded-lg max-h-[500px] overflow-y-auto border border-gray-200">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
                        Resumen del Envío
                      </h3>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Contactos
                            </span>
                            <p className="mt-1 text-sm text-gray-900">
                              {
                                contacts.filter(
                                  (c) => c.name.trim() || c.number.trim()
                                ).length
                              }{' '}
                              contactos
                            </p>
                          </div>
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>

                        {messageType === 'text' ? (
                          <div>
                            <span className="text-sm font-medium text-gray-500">
                              Mensaje Base
                            </span>
                            <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap max-h-80 overflow-y-auto border p-3 rounded">
                              {message}
                            </div>
                          </div>
                        ) : (
                          mediaConfig && (
                            <div>
                              <span className="text-sm font-medium text-gray-500">
                                Archivo
                              </span>
                              <div className="mt-1">
                                <div className="bg-blue-50 p-4 rounded border">
                                  <p className="font-medium text-gray-800">
                                    {mediaConfig.fileName}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Tipo: {mediaConfig.type}
                                    {mediaConfig.caption && (
                                      <>
                                        <br />
                                        Texto: {mediaConfig.caption}
                                      </>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )
                        )}

                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Opciones
                          </span>
                          <p className="mt-1 text-sm text-gray-900">
                            {messageOptions.linkPreview &&
                              'Vista previa de enlaces'}
                            {messageOptions.linkPreview &&
                              messageOptions.mentionsEveryOne &&
                              ', '}
                            {messageOptions.mentionsEveryOne &&
                              'Mencionar a todos'}
                            {!messageOptions.linkPreview &&
                              !messageOptions.mentionsEveryOne &&
                              'Ninguna'}
                          </p>
                        </div>

                        <div>
                          <span className="text-sm font-medium text-gray-500">
                            Configuración de Envío
                          </span>
                          <ul className="mt-1 list-disc list-inside text-sm text-gray-900">
                            <li>
                              {sendingConfig.batchSize} mensajes por bloque
                            </li>
                            <li>
                              {sendingConfig.batchDelay} segundos entre bloques
                            </li>
                            <li>
                              {sendingConfig.messageDelay} segundos entre
                              mensajes
                            </li>
                          </ul>
                        </div>

                        <div className="bg-blue-50 p-4 rounded border">
                          <div className="flex items-center gap-2 text-blue-700 text-sm font-medium">
                            <Info className="w-4 h-4" />
                            <span>Tiempo Estimado</span>
                          </div>
                          <p className="mt-2 text-sm text-blue-600">
                            El envío tomará aproximadamente{' '}
                            {formatTime(
                              calculateEstimatedTime(contacts.length)
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 
                      NOTA: Antes aquí mostrabas una barra de progreso si sendingProgress.current > 0,
                      ahora lo ocultamos para usar el ImpactSendModal.
                    */}
                  </div>
                )}

                {/* Reporte final */}
                {step === 'report' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Resumen del envío
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <h4 className="font-medium text-green-700">
                              Mensajes Enviados
                            </h4>
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            {sendingProgress.successful.length}
                          </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="w-5 h-5 text-red-500" />
                            <h4 className="font-medium text-red-700">
                              Mensajes Fallidos
                            </h4>
                          </div>
                          <p className="text-2xl font-bold text-red-600">
                            {sendingProgress.failed.length}
                          </p>
                        </div>
                      </div>

                      {sendingProgress.failed.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Detalles de errores:
                          </h4>
                          <div className="space-y-2">
                            {sendingProgress.failed.map(
                              ({ contact, error }) => (
                                <div
                                  key={contact.id}
                                  className="bg-red-50 p-3 rounded-lg"
                                >
                                  <p className="text-sm font-medium text-red-700">
                                    {contact.name} ({contact.number})
                                  </p>
                                  <p className="text-sm text-red-600">
                                    {error}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Botonera inferior */}
              <div className="flex justify-between">
                {step !== 'contacts' && step !== 'report' && (
                  <motion.button
                    onClick={handleBack}
                    className="px-6 py-3 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Atrás
                  </motion.button>
                )}

                {step !== 'report' && (
                  <motion.button
                    onClick={
                      step === 'confirmation' ? handleSendMessages : handleNext
                    }
                    disabled={isSending}
                    className="ml-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSending ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : step === 'confirmation' ? (
                      <>
                        <Send className="w-5 h-5" />
                        Enviar Mensajes
                      </>
                    ) : (
                      <>
                        Continuar
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                )}

                {step === 'report' && (
                  <motion.button
                    onClick={handleClose}
                    className="ml-auto px-6 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Finalizar
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImpactSendModal
        isOpen={showImpactModal}
        sendingProgress={sendingProgress}
        logs={logs}
        onComplete={() => {
          setShowImpactModal(false);
          setStep('report');
        }}
      />
    </>
  );
};

export default SendMessageModal;
export { SendMessageModal };
