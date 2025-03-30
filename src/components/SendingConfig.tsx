import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Users, Timer } from 'lucide-react';

export interface SendingConfigOptions {
  batchSize: number;
  batchDelay: number;
  messageDelay: number;
}

interface SendingConfigProps {
  config: SendingConfigOptions;
  onChange: (config: SendingConfigOptions) => void;
}

export const SendingConfig: React.FC<SendingConfigProps> = ({ config, onChange }) => {
  const handleChange = (field: keyof SendingConfigOptions, value: number) => {
    onChange({ ...config, [field]: value });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Configuración de Envío</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-blue-500" />
            <h4 className="font-medium text-gray-700">Mensajes por Bloque</h4>
          </div>
          <input
            type="number"
            min="1"
            max="20"
            value={config.batchSize}
            onChange={(e) => handleChange('batchSize', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-sm text-gray-500">
            Cantidad de mensajes a enviar en cada bloque (1-20)
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-blue-500" />
            <h4 className="font-medium text-gray-700">Tiempo entre Bloques</h4>
          </div>
          <input
            type="number"
            min="30"
            max="300"
            value={config.batchDelay}
            onChange={(e) => handleChange('batchDelay', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-sm text-gray-500">
            Espera entre bloques de mensajes (30-300 segundos)
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Timer className="w-5 h-5 text-blue-500" />
            <h4 className="font-medium text-gray-700">Tiempo entre Mensajes</h4>
          </div>
          <input
            type="number"
            min="1"
            max="30"
            value={config.messageDelay}
            onChange={(e) => handleChange('messageDelay', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-sm text-gray-500">
            Espera entre mensajes individuales (1-30 segundos)
          </p>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-600">
          <strong>Consejo:</strong> Para evitar bloqueos, se recomienda enviar mensajes en bloques pequeños con suficiente tiempo entre ellos.
        </p>
      </div>
    </div>
  );
};