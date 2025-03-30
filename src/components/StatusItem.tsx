import React from 'react';

interface StatusItemProps {
  label: string;
  value: string;
}

export const StatusItem: React.FC<StatusItemProps> = ({ label, value }) => (
  <div className="bg-white/5 rounded-lg p-3">
    <p className="text-sm text-gray-400 mb-1">{label}</p>
    <p className="text-white font-medium truncate">{value}</p>
  </div>
);