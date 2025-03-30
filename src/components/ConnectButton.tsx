import React from 'react';
import { motion } from 'framer-motion';
import { Scan, Loader } from 'lucide-react';

interface ConnectButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export const ConnectButton: React.FC<ConnectButtonProps> = ({ onClick, isLoading }) => (
  <motion.div 
    className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl"
    whileHover={{ scale: 1.02 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="text-center">
      <motion.button
        onClick={onClick}
        disabled={isLoading}
        className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl overflow-hidden transition-all duration-300 ease-out hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 disabled:opacity-70"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isLoading ? (
          <Loader className="w-6 h-6 mr-2 animate-spin" />
        ) : (
          <Scan className="w-6 h-6 mr-2" />
        )}
        {isLoading ? 'Conectando...' : 'Conectar WhatsApp'}
        <motion.div
          className="absolute inset-0 bg-white opacity-20"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ borderRadius: '100%' }}
        />
      </motion.button>
    </div>
  </motion.div>
);