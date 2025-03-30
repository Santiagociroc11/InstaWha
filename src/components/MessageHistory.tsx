import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  X,
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Users,
  MessageSquare,
  Search,
  ArrowUpDown,
  Phone,
  Mail,
  Eye
} from 'lucide-react';
import { FixedSizeList as List } from 'react-window';
import { useMessageHistory } from '../hooks/useMessageHistory';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MessageHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DetailModalProps {
  batch: any;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ batch, onClose }) => {
  const [showMessage, setShowMessage] = useState(false);
  const successRate = (batch.success / batch.total) * 100;

  // Se obtiene la plantilla del primer mensaje enviado en el batch
  const messageTemplate = batch.messages[0]?.message || '';

  // Separamos los mensajes en exitosos y fallidos
  const successfulMessages = batch.messages.filter((msg: any) => msg.status === 'success');
  const failedMessages = batch.messages.filter((msg: any) => msg.status === 'error');

  // Función para renderizar un mensaje exitoso (virtualizado)
  const renderSuccessMessage = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const msg = successfulMessages[index];
    return (
      <div key={msg.id} style={style} className="bg-green-50 p-3 rounded-lg border border-green-100">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-green-800">
            {msg.contact_info?.name || 'Sin nombre'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Phone className="w-4 h-4" />
          <span>{msg.contact_info?.number}</span>
        </div>
      </div>
    );
  };

  // Función para renderizar un mensaje fallido (virtualizado)
  const renderFailedMessage = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const msg = failedMessages[index];
    return (
      <div key={msg.id} style={style} className="bg-red-50 p-3 rounded-lg border border-red-100">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-red-800">
            {msg.contact_info?.name || 'Sin nombre'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-600">
          <Phone className="w-4 h-4" />
          <span>{msg.contact_info?.number}</span>
        </div>
        {msg.error_message && (
          <p className="mt-1 text-xs text-red-600">
            {msg.error_message}
          </p>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                batch.error > 0 ? 'bg-red-100' : 'bg-green-100'
              }`}>
                {batch.error > 0 ? (
                  <XCircle className="w-7 h-7 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-7 h-7 text-green-500" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Envío Masivo
                </h3>
                <p className="text-sm text-gray-500">
                  {format(new Date(batch.sent_at), "d MMM yyyy, HH:mm", { locale: es })}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-700">Exitosos</p>
              </div>
              <p className="text-2xl font-bold text-green-700">{batch.success}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm font-medium text-red-700">Fallidos</p>
              </div>
              <p className="text-2xl font-bold text-red-700">{batch.error}</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-700">Total</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{batch.total}</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-medium text-purple-700">Tasa de éxito</p>
              </div>
              <p className="text-2xl font-bold text-purple-700">{successRate.toFixed(1)}%</p>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => setShowMessage(!showMessage)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <Eye className="w-4 h-4" />
              <span className="text-sm">{showMessage ? 'Ocultar mensaje' : 'Ver mensaje enviado'}</span>
            </button>

            <AnimatePresence>
              {showMessage && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2"
                >
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <h4 className="text-sm font-medium text-gray-700">Mensaje Template</h4>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{messageTemplate}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Listado de mensajes con virtualización */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mensajes exitosos */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-green-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Mensajes Enviados ({successfulMessages.length})
              </h4>
              <List
                height={400}
                itemCount={successfulMessages.length}
                itemSize={80}
                width="100%"
              >
                {renderSuccessMessage}
              </List>
            </div>

            {/* Mensajes fallidos */}
            {failedMessages.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-red-700 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Mensajes Fallidos ({failedMessages.length})
                </h4>
                <List
                  height={400}
                  itemCount={failedMessages.length}
                  itemSize={100}
                  width="100%"
                >
                  {renderFailedMessage}
                </List>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const MessageHistory: React.FC<MessageHistoryProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const { loadMessageHistory, isLoading, error } = useMessageHistory();

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    const data = await loadMessageHistory();
    const groupedData = data.reduce((acc: any, message: any) => {
      if (!acc[message.batch_id]) {
        acc[message.batch_id] = {
          id: message.batch_id,
          messages: [],
          sent_at: message.sent_at,
          total: 0,
          success: 0,
          error: 0,
        };
      }
      acc[message.batch_id].messages.push(message);
      acc[message.batch_id].total++;
      if (message.status === 'success') acc[message.batch_id].success++;
      if (message.status === 'error') acc[message.batch_id].error++;
      return acc;
    }, {});
    
    setHistory(
      Object.values(groupedData).sort((a: any, b: any) => 
        new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
      )
    );
  };

  const filteredHistory = history.filter(batch => {
    if (filter === 'all') return true;
    if (filter === 'success') return batch.success === batch.total;
    if (filter === 'error') return batch.error > 0;
    return true;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-6 h-6 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-800">Historial</h2>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="all">Todos</option>
                <option value="success">Exitosos</option>
                <option value="error">Con Errores</option>
              </select>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Cargando historial...
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay mensajes en el historial.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHistory.map((batch) => (
                  <motion.div
                    key={batch.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      batch.error > 0 
                        ? 'border-red-200 hover:bg-red-50' 
                        : 'border-green-200 hover:bg-green-50'
                    }`}
                    onClick={() => setSelectedBatch(batch)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          batch.error > 0 ? 'bg-red-100' : 'bg-green-100'
                        }`}>
                          {batch.error > 0 ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            {formatDistanceToNow(new Date(batch.sent_at), { 
                              addSuffix: true,
                              locale: es 
                            })}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {batch.success} de {batch.total} enviados
                            </span>
                            {batch.error > 0 && (
                              <span className="text-sm text-red-500">
                                ({batch.error} errores)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {selectedBatch && (
            <DetailModal
              batch={selectedBatch}
              onClose={() => setSelectedBatch(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};
