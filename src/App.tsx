import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, LogOut, User } from 'lucide-react';
import { WhatsAppModal } from './components/WhatsAppModal';
import { Dashboard } from './components/Dashboard';
import { ConnectButton } from './components/ConnectButton';
import { LoginForm } from './components/LoginForm';
import { useWhatsAppInstance } from './hooks/useWhatsAppInstance';
import { getCurrentUser, logout } from './lib/auth';
import { fadeIn } from './animations';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const {
    isLoading,
    isCreatingInstance,
    instanceInfo,
    qrCode,
    whatsappStatus,
    handleCreateInstance,
    handleDisconnect,
    refreshConnection,
  } = useWhatsAppInstance();

  useEffect(() => {
    // Check if user is already logged in
    const user = getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      const modalInterval = setInterval(async () => {
        if (instanceInfo?.connectionStatus === "open") {
          clearInterval(modalInterval);
          setIsModalOpen(false);
        }
      }, 3000);

      return () => clearInterval(modalInterval);
    }
  }, [isModalOpen, instanceInfo?.connectionStatus]);

  const handleLogout = () => {
    logout(); // Only logout from the platform
    setIsAuthenticated(false); // Update authentication state
  };

  if (!isAuthenticated) {
    return <LoginForm onLogin={() => setIsAuthenticated(true)} />;
  }

  const currentUser = getCurrentUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="container mx-auto px-4 py-8"
      >
        <motion.div 
          className="text-center mb-12 relative"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="absolute right-0 top-0 flex items-center gap-4"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg">
              <User className="w-4 h-4" />
              <span>{currentUser?.username}</span>
            </div>
            <motion.button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </motion.button>
          </motion.div>

          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <MessageSquare className="w-12 h-12" />
            InstaWha
          </h1>
          <p className="text-blue-200 text-xl">Envíos Masivos</p>
        </motion.div>

        {instanceInfo?.connectionStatus === "open" ? (
          <Dashboard
            whatsappStatus={whatsappStatus}
            instanceInfo={instanceInfo}
            onDisconnect={handleDisconnect}
          />
        ) : (
          <ConnectButton 
            onClick={() => setIsModalOpen(true)} 
            isLoading={isLoading}
          />
        )}
      </motion.div>

      <WhatsAppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        whatsappStatus={whatsappStatus}
        instanceInfo={instanceInfo}
        qrCode={qrCode}
        isLoadingWhatsApp={isLoading}
        isCreatingInstance={isCreatingInstance}
        onCreateInstance={handleCreateInstance}
        onDisconnect={handleDisconnect}
        onRefreshInstance={refreshConnection}
      />
    </div>
  );
}

export default App;