import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, Plus, Copy, Clipboard, CheckCircle2, XCircle, Search, 
  Upload, Table, List, X, Save, Download 
} from 'lucide-react';
import { useWhatsAppMessages } from '../hooks/useWhatsAppMessages';
import { SearchModal } from './SearchModal';
import { ContactLists } from './ContactLists';
import { ContactList, createContactList } from '../lib/supabase';

export interface Contact {
  id: string;
  name: string;
  number: string;
  isValid: boolean;
}

/** Modal de previsualización de importación */
interface ImportPreviewModalProps {
  importedContacts: Contact[];
  duplicates: Contact[];
  onConfirm: (contacts: Contact[]) => void;
  onCancel: () => void;
}

const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({ importedContacts, duplicates, onConfirm, onCancel }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full mx-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Previsualización de Importación</h2>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          {duplicates.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 text-yellow-600 rounded">
              Se han detectado {duplicates.length} contactos duplicados. Estos se omitirán en la importación.
            </div>
          )}
          <div className="max-h-60 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Número</th>
                  <th className="px-4 py-2 text-left">Válido</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {importedContacts.map(contact => (
                  <tr key={contact.id}>
                    <td className="px-4 py-2">{contact.name}</td>
                    <td className="px-4 py-2">{contact.number}</td>
                    <td className="px-4 py-2">
                      {contact.isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <motion.button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancelar
            </motion.button>
            <motion.button
              onClick={() => onConfirm(importedContacts)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Confirmar Importación
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/** Componente principal de la tabla de contactos */
interface ContactTableProps {
  contacts: Contact[];
  onContactsChange: (contacts: Contact[]) => void;
}

export const ContactTable: React.FC<ContactTableProps> = ({ contacts, onContactsChange }) => {
  const { validatePhoneNumber } = useWhatsAppMessages();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [focusedCell, setFocusedCell] = useState<{ rowId: string; column: 'name' | 'number' } | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [showContactLists, setShowContactLists] = useState(false);
  const [showSaveListModal, setShowSaveListModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContacts, setPreviewContacts] = useState<Contact[]>([]);
  const [duplicates, setDuplicates] = useState<Contact[]>([]);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [saveListError, setSaveListError] = useState<string | null>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  // Procesa el contenido CSV y devuelve los nuevos contactos
  const processCSVContent = useCallback((content: string): Contact[] => {
    const rows = content.split(/\r?\n/).filter(row => row.trim());
    let newContacts: Contact[] = [];
    let hasHeaderRow = false;

    if (rows.length > 0) {
      const firstRow = rows[0].toLowerCase();
      if (
        firstRow.includes('name') || firstRow.includes('nombre') || 
        firstRow.includes('phone') || firstRow.includes('telefono') ||
        firstRow.includes('whatsapp') || firstRow.includes('contact')
      ) {
        hasHeaderRow = true;
      }
    }

    rows.slice(hasHeaderRow ? 1 : 0).forEach(row => {
      const separator = row.includes(';') ? ';' : ',';
      const columns = row.split(separator).map(col => col.trim().replace(/^["']|["']$/g, ''));
      if (columns.length >= 2) {
        const [name = '', number = ''] = columns;
        const cleanNumber = number.replace(/[\s\-()]/g, '');
        newContacts.push({
          id: Date.now().toString() + Math.random(),
          name: name.trim(),
          number: cleanNumber,
          isValid: validatePhoneNumber(cleanNumber),
        });
      }
    });
    return newContacts;
  }, [validatePhoneNumber]);

  // Detecta duplicados comparando números con los contactos ya existentes
  const detectDuplicates = (newContacts: Contact[]): { unique: Contact[], duplicates: Contact[] } => {
    const existingNumbers = new Set(contacts.map(c => c.number));
    const unique: Contact[] = [];
    const dup: Contact[] = [];
    newContacts.forEach(contact => {
      if (existingNumbers.has(contact.number)) {
        dup.push(contact);
      } else {
        unique.push(contact);
      }
    });
    return { unique, duplicates: dup };
  };

  // Maneja el pegado desde el portapapeles (p.ej. desde un sheet)
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const newContacts = processCSVContent(text);
    const { unique, duplicates } = detectDuplicates(newContacts);
    setPreviewContacts(unique);
    setDuplicates(duplicates);
    setShowPreviewModal(true);
  };

  // Maneja la subida de archivo CSV
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const newContacts = processCSVContent(text);
      const { unique, duplicates } = detectDuplicates(newContacts);
      setPreviewContacts(unique);
      setDuplicates(duplicates);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error reading file:', error);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Maneja el pegado en una celda individual (texto tabulado: nombre y número)
  const handleTablePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const [name = '', number = ''] = text.split('\t');
    const newContact: Contact = {
      id: Date.now().toString() + Math.random(),
      name: name.trim(),
      number: number.trim(),
      isValid: validatePhoneNumber(number.trim()),
    };
    onContactsChange([...contacts, newContact]);
  };

  const clearContacts = () => {
    onContactsChange([]);
    setSelectedRows(new Set());
  };

  const addNewRow = () => {
    const newContact = { id: Date.now().toString(), name: '', number: '', isValid: false };
    onContactsChange([...contacts, newContact]);
    setFocusedCell({ rowId: newContact.id, column: 'name' });
  };

  const deleteSelectedRows = () => {
    onContactsChange(contacts.filter(contact => !selectedRows.has(contact.id)));
    setSelectedRows(new Set());
  };

  const copySelectedContacts = () => {
    const selectedContacts = contacts.filter(contact => selectedRows.has(contact.id));
    const text = selectedContacts.map(contact => `${contact.name}\t${contact.number}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, contact: Contact, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (index === contacts.length - 1) {
        addNewRow();
      } else if (contacts[index + 1]) {
        setFocusedCell({ rowId: contacts[index + 1].id, column: focusedCell?.column || 'name' });
      }
    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      setFocusedCell({ rowId: contacts[index - 1].id, column: focusedCell?.column || 'name' });
    } else if (e.key === 'Tab') {
      if (!e.shiftKey && focusedCell?.column === 'number') {
        e.preventDefault();
        if (index === contacts.length - 1) {
          addNewRow();
        }
      }
    }
  };

  const handleListSelect = async (list: ContactList) => {
    try {
      const listContacts = list.contacts_json || [];
      const formattedContacts: Contact[] = listContacts.map(contact => ({
        id: contact.id,
        name: contact.name,
        number: contact.number,
        isValid: validatePhoneNumber(contact.number),
      }));
      const currentContacts = [...contacts];
      if (currentContacts.length === 1 && !currentContacts[0].name && !currentContacts[0].number) {
        currentContacts.pop();
      }
      onContactsChange([...currentContacts, ...formattedContacts]);
      setShowContactLists(false);
    } catch (error) {
      console.error('Error loading contacts from list:', error);
    }
  };

  const handleSearchSelect = (selectedContacts: Contact[]) => {
    const currentContacts = [...contacts];
    if (currentContacts.length === 1 && !currentContacts[0].name && !currentContacts[0].number) {
      currentContacts.pop();
    }
    onContactsChange([...currentContacts, ...selectedContacts]);
    setIsSearchModalOpen(false);
  };

  const handleSaveList = async () => {
    try {
      setSaveListError(null);
      if (!newListName.trim()) {
        setSaveListError('El nombre de la lista es requerido');
        return;
      }
      const selectedContacts = contacts.filter(contact => selectedRows.has(contact.id));
      if (selectedContacts.length === 0) {
        setSaveListError('Selecciona al menos un contacto para guardar en la lista');
        return;
      }
      await createContactList(
        newListName,
        newListDescription,
        selectedContacts.map(contact => ({ name: contact.name, number: contact.number }))
      );
      setShowSaveListModal(false);
      setNewListName('');
      setNewListDescription('');
      setSelectedRows(new Set());
    } catch (error) {
      console.error('Error saving list:', error);
      setSaveListError('Error al guardar la lista. Por favor, intenta nuevamente.');
    }
  };

  // Exporta la lista de contactos a CSV
  const handleExportCSV = () => {
    const headers = "Nombre,WhatsApp\n";
    const csvContent = contacts.map(contact => `${contact.name},${contact.number}`).join('\n');
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "contacts.csv");
    link.click();
  };

  useEffect(() => {
    if (focusedCell) {
      const input = tableRef.current?.querySelector(
        `input[data-row="${focusedCell.rowId}"][data-column="${focusedCell.column}"]`
      ) as HTMLInputElement;
      input?.focus();
    }
  }, [focusedCell]);

  // Asegura que siempre exista una fila vacía al final de la lista
  useEffect(() => {
    const hasEmptyRow = contacts.some(contact => !contact.name && !contact.number);
    const needsEmptyRow = contacts.length === 0 || (contacts.length > 0 && (contacts[contacts.length - 1].name || contacts[contacts.length - 1].number));
    if (!hasEmptyRow && needsEmptyRow) {
      onContactsChange([...contacts, { id: Date.now().toString(), name: '', number: '', isValid: false }]);
    }
  }, [contacts]);

  const hasSelection = selectedRows.size > 0;

  const handleConfirmImport = (imported: Contact[]) => {
    const currentContacts = [...contacts];
    if (currentContacts.length === 1 && !currentContacts[0].name && !currentContacts[0].number) {
      currentContacts.pop();
    }
    onContactsChange([...currentContacts, ...imported]);
    setShowPreviewModal(false);
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg shadow">
      {/* Tabla de contactos con pegado y subida de CSV */}
      <div className="overflow-hidden rounded-lg border border-gray-200 relative bg-white">
        <div 
          className="absolute inset-0 bg-blue-50/50 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center transition-opacity duration-300 pointer-events-none"
          style={{ opacity: contacts.length === 0 ? 1 : 0, zIndex: contacts.length === 0 ? 1 : -1 }}
        >
          <div className="text-center text-blue-500">
            <Table className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Pega datos desde una hoja de cálculo o agrega filas manualmente</p>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          <table 
            ref={tableRef} 
            className="min-w-full divide-y divide-gray-200"
            onPaste={handlePaste}
          >
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="w-8 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={contacts.length > 0 && selectedRows.size === contacts.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(contacts.map(c => c.id)));
                      } else {
                        setSelectedRows(new Set());
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  WhatsApp
                </th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody ref={tableBodyRef} className="bg-white divide-y divide-gray-200">
              {contacts.map((contact, index) => (
                <motion.tr
                  key={contact.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={selectedRows.has(contact.id) ? 'bg-blue-50' : ''}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(contact.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedRows);
                        if (e.target.checked) {
                          newSelected.add(contact.id);
                        } else {
                          newSelected.delete(contact.id);
                        }
                        setSelectedRows(newSelected);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-2">
                    <input
                      type="text"
                      value={contact.name}
                      data-row={contact.id}
                      data-column="name"
                      onChange={(e) => {
                        const updatedContacts = contacts.map(c => c.id === contact.id ? { ...c, name: e.target.value } : c);
                        onContactsChange(updatedContacts);
                      }}
                      onKeyDown={(e) => handleKeyDown(e, contact, index)}
                      onFocus={() => setFocusedCell({ rowId: contact.id, column: 'name' })}
                      className="w-full border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded px-0"
                      placeholder="Nombre"
                    />
                  </td>
                  <td className="px-6 py-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={contact.number}
                        data-row={contact.id}
                        data-column="number"
                        onChange={(e) => {
                          const value = e.target.value;
                          const updatedContacts = contacts.map(c => c.id === contact.id ? { ...c, number: value, isValid: validatePhoneNumber(value) } : c);
                          onContactsChange(updatedContacts);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, contact, index)}
                        onFocus={() => setFocusedCell({ rowId: contact.id, column: 'number' })}
                        className={`w-full border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded px-0 pr-6 ${contact.number && !contact.isValid ? 'text-red-500' : ''}`}
                        placeholder="54911..."
                        onPaste={handleTablePaste}
                      />
                      {contact.number && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2">
                          {contact.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-2 text-right">
                    {(contact.name || contact.number) && (
                      <motion.button
                        onClick={() => onContactsChange(contacts.filter(c => c.id !== contact.id))}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barra de acciones */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={addNewRow}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-blue-600 hover:text-blue-700 transition-colors text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Agregar fila
          </motion.button>

          <motion.button
            onClick={() => setShowContactLists(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-blue-600 hover:text-blue-700 transition-colors text-sm flex items-center gap-1"
          >
            <List className="w-4 h-4" />
            Usar Lista
          </motion.button>

          <motion.button
            onClick={() => setIsSearchModalOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-blue-600 hover:text-blue-700 transition-colors text-sm flex items-center gap-1"
          >
            <Search className="w-4 h-4" />
            Buscar en WhatsApp
          </motion.button>

          <motion.button
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-blue-600 hover:text-blue-700 transition-colors text-sm flex items-center gap-1"
          >
            <Upload className="w-4 h-4" />
            Subir CSV
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />

          <motion.button
            onClick={handleExportCSV}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-green-600 hover:text-green-700 transition-colors text-sm flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </motion.button>

          {selectedRows.size > 0 && (
            <>
              <motion.button
                onClick={copySelectedContacts}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-gray-600 hover:text-gray-700 transition-colors text-sm flex items-center gap-1"
              >
                <Copy className="w-4 h-4" />
                Copiar selección
              </motion.button>

              <motion.button
                onClick={() => setShowSaveListModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-green-600 hover:text-green-700 transition-colors text-sm flex items-center gap-1"
              >
                <Save className="w-4 h-4" />
                Guardar como lista
              </motion.button>

              <motion.button
                onClick={deleteSelectedRows}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-red-500 hover:text-red-700 transition-colors text-sm flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar selección
              </motion.button>
            </>
          )}
        </div>

        {contacts.some(c => c.name || c.number) && (
          <motion.button
            onClick={clearContacts}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-red-500 hover:text-red-700 transition-colors text-sm flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Limpiar todo
          </motion.button>
        )}
      </div>

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelect={handleSearchSelect}
      />

      <AnimatePresence>
        {showContactLists && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Seleccionar Lista de Contactos</h2>
                <button onClick={() => setShowContactLists(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <ContactLists onSelectList={handleListSelect} />
            </motion.div>
          </motion.div>
        )}

        {showSaveListModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Guardar como Lista</h2>
                <button
                  onClick={() => {
                    setShowSaveListModal(false);
                    setNewListName('');
                    setNewListDescription('');
                    setSaveListError(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              {saveListError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {saveListError}
                </div>
              )}
              <div className="space-y-4">
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
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-600">
                    Se guardarán {selectedRows.size} contactos seleccionados en la lista.
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <motion.button
                    onClick={() => {
                      setShowSaveListModal(false);
                      setNewListName('');
                      setNewListDescription('');
                      setSaveListError(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-700"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancelar
                  </motion.button>
                  <motion.button
                    onClick={handleSaveList}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Guardar Lista
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showCopiedToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <Clipboard className="w-4 h-4" />
            Contactos copiados al portapapeles
          </motion.div>
        )}
      </AnimatePresence>

      {showPreviewModal && (
        <ImportPreviewModal 
          importedContacts={previewContacts} 
          duplicates={duplicates} 
          onConfirm={handleConfirmImport} 
          onCancel={() => setShowPreviewModal(false)} 
        />
      )}
    </div>
  );
};
