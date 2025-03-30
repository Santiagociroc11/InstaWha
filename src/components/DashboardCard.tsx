import React from 'react';
import { motion } from 'framer-motion';

interface DashboardCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, description, onClick }) => (
  <motion.button
    onClick={onClick}
    className="flex flex-col items-center p-6 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <div className="text-blue-400 mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-sm text-gray-300 text-center">{description}</p>
  </motion.button>
);