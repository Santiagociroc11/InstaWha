import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, AlertCircle, UserPlus, ArrowLeft } from 'lucide-react';
import { login, register } from '../lib/auth';

interface LoginFormProps {
  onLogin: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegistering) {
        if (password !== confirmPassword) {
          setError('Las contraseñas no coinciden');
          setIsLoading(false);
          return;
        }
        await register(username, password);
      }
      await login(username, password);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">InstaWha</h1>
          <p className="text-blue-200">
            {isRegistering ? 'Crear una nueva cuenta' : 'Inicia sesión para continuar'}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-200"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa tu usuario"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>

          {isRegistering && (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">
                Confirmar Contraseña
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirma tu contraseña"
                required
              />
            </div>
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              'Procesando...'
            ) : isRegistering ? (
              <>
                <UserPlus className="w-5 h-5" />
                Crear Cuenta
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Iniciar Sesión
              </>
            )}
          </motion.button>

          <div className="mt-4 flex items-center justify-center">
            <motion.button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="text-blue-300 hover:text-blue-200 flex items-center gap-2 text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isRegistering ? (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio de sesión
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Crear una cuenta
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};