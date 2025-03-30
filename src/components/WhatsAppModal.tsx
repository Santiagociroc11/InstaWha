import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, RefreshCw, X } from 'lucide-react';
import { fadeIn } from '../animations';
import type { WhatsAppInstance } from '../hooks/useWhatsAppInstance';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  whatsappStatus: string;
  instanceInfo: WhatsAppInstance | null;
  qrCode: string;
  isLoadingWhatsApp: boolean;
  isCreatingInstance: boolean;
  onCreateInstance: () => void;
  onDisconnect: () => void;
  onRefreshInstance: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  whatsappStatus,
  instanceInfo,
  qrCode,
  isLoadingWhatsApp,
  isCreatingInstance,
  onCreateInstance,
  onDisconnect,
  onRefreshInstance,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="bg-white/90 backdrop-blur-lg p-8 rounded-2xl shadow-2xl max-w-md w-full relative border border-white/20"
        >
          {isLoadingWhatsApp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-sm rounded-2xl z-10"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader className="w-8 h-8 text-blue-600" />
              </motion.div>
            </motion.div>
          )}

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold mb-6 text-gray-800">Sesión de WhatsApp</h2>

          {!instanceInfo && !qrCode && (
            <motion.div
              className="text-center"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <motion.button
                onClick={onCreateInstance}
                disabled={isCreatingInstance}
                className={`
                  px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl 
                  font-semibold shadow-lg hover:shadow-xl transition-all duration-300 
                  disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full
                `}
                whileHover={{ scale: isCreatingInstance ? 1 : 1.02 }}
                whileTap={{ scale: isCreatingInstance ? 1 : 0.98 }}
              >
                {isCreatingInstance ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <span>Conectar WhatsApp</span>
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {instanceInfo && instanceInfo.connectionStatus !== "open" && !isLoadingWhatsApp && (
            <motion.div
              className="text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <p className="mb-4 font-medium text-gray-700">Escanea el QR para conectar:</p>
              {qrCode ? (
                <motion.div
                  className="relative w-48 h-48 mx-auto mb-6"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <img
                    src={`data:image/png;base64,${qrCode}`}
                    alt="QR Code"
                    className="w-full h-full object-contain rounded-lg shadow-lg"
                  />
                </motion.div>
              ) : (
                <p className="mb-4 text-sm text-gray-600">QR no disponible. Intenta refrescar.</p>
              )}
              <motion.button
                onClick={onRefreshInstance}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoadingWhatsApp}
                className="mt-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-5 h-5" />
                Refrescar Conexión
              </motion.button>
            </motion.div>
          )}

          {instanceInfo && instanceInfo.connectionStatus === "open" && !isLoadingWhatsApp && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-3"
            >
              <InfoRow label="Estado" value={whatsappStatus} />
              <InfoRow label="Instancia" value={instanceInfo.name} />
              <InfoRow label="Perfil" value={instanceInfo.profileName || "N/A"} />
              <InfoRow label="Número" value={instanceInfo.ownerJid || "N/A"} />
              
              <motion.button
                onClick={onDisconnect}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isLoadingWhatsApp}
                className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Desconectar
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <motion.div
    initial={{ x: -20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    className="flex items-center justify-between p-3 bg-white/50 rounded-lg"
  >
    <span className="font-medium text-gray-700">{label}:</span>
    <span className="text-gray-900">{value}</span>
  </motion.div>
);