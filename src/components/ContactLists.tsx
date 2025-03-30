import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Save, X, Users, List } from 'lucide-react';
import { createContactList, getContactLists, deleteContactList, ContactList } from '../lib/supabase';

interface ContactListsProps {
  onSelectList: (list: ContactList) => void;
}

export const ContactLists: React.FC<ContactListsProps> = ({ onSelectList }) => {
  const [lists, setLists] = useState<ContactList[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getContactLists();
      setLists(data);
    } catch (err) {
      setError('Error al cargar las listas');
      console.error('Error loading lists:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      setError('El nombre de la lista es requerido');
      return;
    }
    try {
      setError(null);
      const list = await createContactList(newListName, newListDescription, []);
      setLists([list, ...lists]);
      setIsCreating(false);
      setNewListName('');
      setNewListDescription('');
    } catch (error) {
      setError('Error al crear la lista');
      console.error('Error creating list:', error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await deleteContactList(listId);
      setLists(lists.filter(list => list.id !== listId));
    } catch (error) {
      setError('Error al eliminar la lista');
      console.error('Error deleting list:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <List className="w-5 h-5" />
          Listas de Contactos
        </h3>
        {!isCreating && (
          <motion.button
            onClick={() => setIsCreating(true)}
            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            Nueva Lista
          </motion.button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-50 p-4 rounded-lg space-y-3"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Lista
              </label>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Clientes VIP"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Lista de clientes premium"
              />
            </div>
            <div className="flex justify-end gap-2">
              <motion.button
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-700 flex items-center gap-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4" />
                Cancelar
              </motion.button>
              <motion.button
                onClick={handleCreateList}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-1"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Save className="w-4 h-4" />
                Guardar
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {lists.map((list) => (
          <motion.div
            key={list.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer"
            onClick={() => onSelectList(list)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{list.name}</h4>
                {list.description && (
                  <p className="text-sm text-gray-500 mt-1">{list.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{list.contacts_json?.length || 0} contactos</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Botón de edición: se detiene la propagación para evitar seleccionar la lista */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectList(list);
                  }}
                  className="text-blue-600 hover:text-blue-700"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Edit2 className="w-4 h-4" />
                </motion.button>
                {/* Botón de eliminación */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteList(list.id);
                  }}
                  className="text-red-500 hover:text-red-600"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">
          Cargando listas...
        </div>
      ) : lists.length === 0 && !isCreating ? (
        <div className="text-center py-8 text-gray-500">
          No hay listas de contactos. ¡Crea una nueva!
        </div>
      ) : null}
    </div>
  );
};
