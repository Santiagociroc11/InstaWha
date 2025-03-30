import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, History, Settings, LogOut, Signal, Phone, User, Crown } from 'lucide-react';
import { DashboardCard } from './DashboardCard';
import { StatusItem } from './StatusItem';
import { SendMessageModal } from './SendMessageModal';
import { MessageHistory } from './MessageHistory';
import { logout } from '../lib/auth';
import type { WhatsAppInstance } from '../hooks/useWhatsAppInstance';
import type { MessageVariable } from './MessageComposer';

interface DashboardProps {
  whatsappStatus: string;
  instanceInfo: WhatsAppInstance | null;
  onDisconnect: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  whatsappStatus,
  instanceInfo,
  onDisconnect,
}) => {
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [variables, setVariables] = useState<MessageVariable[]>([]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'conectado':
        return 'bg-green-500';
      case 'desconectado':
        return 'bg-red-500';
      case 'conectando':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleLogout = () => {
    onDisconnect(); // Disconnect WhatsApp first
    logout(); // Then logout from the application
    window.location.reload(); // Reload the page to reset the app state
  };

  return (
    <>
      <motion.div 
        className="max-w-4xl mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          <DashboardCard
            icon={<Send className="w-6 h-6" />}
            title="Enviar Mensaje"
            description="Envía mensajes individuales o masivos"
            onClick={() => setIsSendMessageModalOpen(true)}
          />
          
          <DashboardCard
            icon={<History className="w-6 h-6" />}
            title="Historial"
            description="Ver historial de mensajes"
            onClick={() => setIsHistoryModalOpen(true)}
          />
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(whatsappStatus)} animate-pulse`} />
              <h2 className="text-xl font-semibold text-white">WhatsApp {whatsappStatus}</h2>
            </div>
            <motion.button
              onClick={onDisconnect}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-4 h-4" />
              Desconectar
            </motion.button>
          </div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Signal className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Estado de Conexión</h3>
                  <p className="text-blue-200 text-sm">Información de la instancia</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-300">Instancia</span>
                  </div>
                  <span className="text-white font-medium">{instanceInfo?.name || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-green-400" />
                    <span className="text-gray-300">Número</span>
                  </div>
                  <span className="text-white font-medium">{instanceInfo?.ownerJid?.split('@')[0] || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <User className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Perfil</h3>
                  <p className="text-purple-200 text-sm">Información del usuario</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-purple-400" />
                    <span className="text-gray-300">Nombre</span>
                  </div>
                  <span className="text-white font-medium">{instanceInfo?.profileName || 'N/A'}</span>
                </div>
                {instanceInfo?.profilePictureUrl && (
                  <div className="mt-4">
                    <img 
                      src={instanceInfo.profilePictureUrl} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full mx-auto border-2 border-purple-400/30"
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <SendMessageModal
        isOpen={isSendMessageModalOpen}
        onClose={() => setIsSendMessageModalOpen(false)}
        variables={variables}
        onVariablesChange={setVariables}
      />

      <MessageHistory
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </>
  );
};