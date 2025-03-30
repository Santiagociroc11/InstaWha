import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader, Search, Users, MessageSquare, UserPlus, CheckSquare } from 'lucide-react';
import { useWhatsAppSearch } from '../hooks/useWhatsAppSearch';
import { fadeIn } from '../animations';
import type { Contact } from './ContactTable';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contacts: Contact[]) => void;
}

type SearchTab = 'contacts' | 'groups' | 'chats';

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [activeTab, setActiveTab] = useState<SearchTab>('chats');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const { searchContacts, searchGroups, searchChats, isLoading, error } = useWhatsAppSearch();

  useEffect(() => {
    if (isOpen) {
      handleSearch();
    } else {
      setSearchResults([]);
      setSelectedItems(new Set());
      setSearchTerm('');
    }
  }, [isOpen, activeTab]);

  const handleSearch = async () => {
    let results;
    switch (activeTab) {
      case 'contacts':
        results = await searchContacts();
        break;
      case 'groups':
        results = await searchGroups();
        break;
      case 'chats':
        results = await searchChats();
        break;
    }
    setSearchResults(results || []);
  };

  const filteredResults = searchResults.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const name = (item.name || '').toLowerCase();
    const number = (item.number || '').toLowerCase();
    return name.includes(searchLower) || number.includes(searchLower);
  });

  const handleSelect = () => {
    const selectedContacts = searchResults
      .filter(item => selectedItems.has(item.id))
      .map(item => ({
        id: item.id,
        name: item.name || '',
        number: item.number || '',
        isValid: true,
      }));
    onSelect(selectedContacts);
    onClose();
  };

  const handleSelectAll = () => {
    if (selectedItems.size === filteredResults.length) {
      // If all are selected, unselect all
      setSelectedItems(new Set());
    } else {
      // Select all filtered results
      setSelectedItems(new Set(filteredResults.map(item => item.id)));
    }
  };

  const areAllSelected = filteredResults.length > 0 && selectedItems.size === filteredResults.length;

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
          className="bg-white/90 backdrop-blur-lg p-6 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 relative border border-white/20"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-2xl font-bold text-gray-800 mb-6">Buscar en WhatsApp</h2>

          <div className="flex space-x-2 mb-6">
            <TabButton
              icon={<MessageSquare className="w-4 h-4" />}
              label="Chats"
              isActive={activeTab === 'chats'}
              onClick={() => setActiveTab('chats')}
            />
            <TabButton
              icon={<Users className="w-4 h-4" />}
              label="Grupos"
              isActive={activeTab === 'groups'}
              onClick={() => setActiveTab('groups')}
            />
            <TabButton
              icon={<UserPlus className="w-4 h-4" />}
              label="Contactos"
              isActive={activeTab === 'contacts'}
              onClick={() => setActiveTab('contacts')}
            />
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="max-h-96 overflow-y-auto mb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sticky top-0 bg-white/95 backdrop-blur-sm p-2 border-b border-gray-100 z-10"
                  >
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <CheckSquare className={`w-5 h-5 ${areAllSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="font-medium text-gray-700">
                          {areAllSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {selectedItems.size} de {filteredResults.length} seleccionados
                      </span>
                    </button>
                  </motion.div>
                )}

                {filteredResults.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer ${
                      selectedItems.has(item.id) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      const newSelected = new Set(selectedItems);
                      if (selectedItems.has(item.id)) {
                        newSelected.delete(item.id);
                      } else {
                        newSelected.add(item.id);
                      }
                      setSelectedItems(newSelected);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => {}}
                      className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-3 flex-1">
                      {item.profilePicUrl && (
                        <img
                          src={item.profilePicUrl}
                          alt={item.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {item.number}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {selectedItems.size} elementos seleccionados
            </p>
            <motion.button
              onClick={handleSelect}
              disabled={selectedItems.size === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Agregar Seleccionados
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, isActive, onClick }) => (
  <motion.button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    {icon}
    {label}
  </motion.button>
);