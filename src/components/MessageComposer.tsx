import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2,
  Users,
  AlertCircle,
  Variable,
  Plus,
  Trash2,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';

export interface MessageVariable {
  id: string;
  name: string;
  description: string;
  values: string[];
}

interface MessageComposerProps {
  onMessageChange: (message: string) => void;
  onOptionsChange: (options: { linkPreview: boolean; mentionsEveryOne: boolean }) => void;
  variables: MessageVariable[];
  onVariablesChange: (variables: MessageVariable[]) => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

// Botón de formato con estilo sutil
const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, children }) => (
  <motion.button
    onClick={onClick}
    type="button"
    className="p-2 rounded text-gray-600 transition-colors duration-150 hover:bg-gray-200 hover:text-gray-800"
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
  >
    {children}
  </motion.button>
);

export const FormatToolbar: React.FC<{ applyFormat: (format: string) => void }> = ({ applyFormat }) => (
  <div className="flex flex-wrap gap-2">
    <ToolbarButton onClick={() => applyFormat('italic')}>
      <span className="italic text-base">I</span>
    </ToolbarButton>
    <ToolbarButton onClick={() => applyFormat('bold')}>
      <span className="font-bold text-base">B</span>
    </ToolbarButton>
    <ToolbarButton onClick={() => applyFormat('strikethrough')}>
      <span className="line-through text-base">S</span>
    </ToolbarButton>
    <ToolbarButton onClick={() => applyFormat('monospace')}>
      <span className="font-mono text-base">M</span>
    </ToolbarButton>
    <ToolbarButton onClick={() => applyFormat('bulletList')}>
      <span>&bull; Lista</span>
    </ToolbarButton>
    <ToolbarButton onClick={() => applyFormat('numberedList')}>
      <span>1. Lista</span>
    </ToolbarButton>
    <ToolbarButton onClick={() => applyFormat('quote')}>
      <span>&ldquo; Cita</span>
    </ToolbarButton>
    <ToolbarButton onClick={() => applyFormat('code')}>
      <span className="bg-gray-100 p-1 rounded font-mono text-xs">Código</span>
    </ToolbarButton>
  </div>
);

// Panel para edición de variables
const VariableEditor: React.FC<{
  variables: MessageVariable[];
  addVariable: () => void;
  updateVariable: (id: string, field: keyof MessageVariable, value: any) => void;
  addValueToVariable: (variableId: string) => void;
  updateVariableValue: (variableId: string, valueIndex: number, newValue: string) => void;
  removeVariableValue: (variableId: string, valueIndex: number) => void;
  removeVariable: (id: string) => void;
  insertVariable: (variable: string) => void;
}> = ({
  variables,
  addVariable,
  updateVariable,
  addValueToVariable,
  updateVariableValue,
  removeVariableValue,
  removeVariable,
  insertVariable,
}) => (
  <div className="absolute right-0 top-full mt-2 w-[32rem] bg-white rounded-lg shadow-lg border border-gray-200 z-10">
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-700">Variables con Valores Aleatorios</h4>
        <motion.button
          onClick={addVariable}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-blue-600 hover:text-blue-700"
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>
      <div className="space-y-4">
        {variables.map(variable => (
          <div key={variable.id} className="space-y-2 bg-gray-50 p-3 rounded-lg relative">
            <motion.button
              onClick={() => removeVariable(variable.id)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-600"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Variable</label>
              <input
                type="text"
                value={variable.name}
                onChange={e => updateVariable(variable.id, 'name', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="{variable}"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
              <input
                type="text"
                value={variable.description}
                onChange={e => updateVariable(variable.id, 'description', e.target.value)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                placeholder="Descripción de la variable"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-600">Valores Posibles</label>
                <motion.button
                  onClick={() => addValueToVariable(variable.id)}
                  className="text-blue-600 hover:text-blue-700"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <PlusCircle className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="space-y-2">
                {variable.values.map((value, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={value}
                      onChange={e => updateVariableValue(variable.id, index, e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      placeholder={`Valor ${index + 1}`}
                    />
                    {variable.values.length > 1 && (
                      <motion.button
                        onClick={() => removeVariableValue(variable.id, index)}
                        className="text-red-500 hover:text-red-600"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <MinusCircle className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <motion.button
              onClick={() => insertVariable(variable.name)}
              className="mt-2 w-full px-3 py-1 bg-blue-50 text-blue-600 rounded text-sm hover:bg-blue-100 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Insertar Variable
            </motion.button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onMessageChange,
  onOptionsChange,
  variables,
  onVariablesChange,
}) => {
  const [message, setMessage] = useState('');
  const [linkPreview, setLinkPreview] = useState(false);
  const [mentionsEveryOne, setMentionsEveryOne] = useState(false);
  const [showVariables, setShowVariables] = useState(false);

  const handleMessageChange = (value: string) => {
    setMessage(value);
    onMessageChange(value);
  };

  const handleOptionsChange = (linkPreview: boolean, mentionsEveryOne: boolean) => {
    setLinkPreview(linkPreview);
    setMentionsEveryOne(mentionsEveryOne);
    onOptionsChange({ linkPreview, mentionsEveryOne });
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('message') as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newMessage = message.substring(0, start) + variable + message.substring(end);
    handleMessageChange(newMessage);
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + variable.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const applyFormat = (
    format: 'italic' | 'bold' | 'strikethrough' | 'monospace' | 'bulletList' | 'numberedList' | 'quote' | 'code'
  ) => {
    const textarea = document.getElementById('message') as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = message.substring(start, end);
    let formattedText = '';
    switch (format) {
      case 'italic':
        formattedText = `_${selectedText}_`;
        break;
      case 'bold':
        formattedText = `*${selectedText}*`;
        break;
      case 'strikethrough':
        formattedText = `~${selectedText}~`;
        break;
      case 'monospace':
        formattedText = `\`\`\`${selectedText}\`\`\``;
        break;
      case 'bulletList':
        formattedText = selectedText
          ? selectedText.split('\n').map(line => `* ${line}`).join('\n')
          : '* ';
        break;
      case 'numberedList':
        formattedText = selectedText
          ? selectedText.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n')
          : '1. ';
        break;
      case 'quote':
        formattedText = selectedText
          ? selectedText.split('\n').map(line => `> ${line}`).join('\n')
          : '> ';
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      default:
        formattedText = selectedText;
    }
    const newMessage = message.substring(0, start) + formattedText + message.substring(end);
    handleMessageChange(newMessage);
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const addVariable = () => {
    const newId = Date.now().toString();
    onVariablesChange([
      ...variables,
      {
        id: newId,
        name: '{variable}',
        description: 'Nueva variable',
        values: ['Valor 1'],
      },
    ]);
  };

  const updateVariable = (id: string, field: keyof MessageVariable, value: any) => {
    onVariablesChange(
      variables.map(v => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const addValueToVariable = (variableId: string) => {
    onVariablesChange(
      variables.map(v => (v.id === variableId ? { ...v, values: [...v.values, ''] } : v))
    );
  };

  const updateVariableValue = (variableId: string, valueIndex: number, newValue: string) => {
    onVariablesChange(
      variables.map(v => {
        if (v.id === variableId) {
          const newValues = [...v.values];
          newValues[valueIndex] = newValue;
          return { ...v, values: newValues };
        }
        return v;
      })
    );
  };

  const removeVariableValue = (variableId: string, valueIndex: number) => {
    onVariablesChange(
      variables.map(v => {
        if (v.id === variableId && v.values.length > 1) {
          const newValues = v.values.filter((_, index) => index !== valueIndex);
          return { ...v, values: newValues };
        }
        return v;
      })
    );
  };

  const removeVariable = (id: string) => {
    onVariablesChange(variables.filter(v => v.id !== id));
  };

  const usedVariables = variables.filter(v => message.includes(v.name));

  const getExampleWithRandomValues = () => {
    let example = message;
    for (const v of variables) {
      const randomValue = v.values[Math.floor(Math.random() * v.values.length)];
      example = example.replaceAll(v.name, randomValue);
    }
    return example;
  };

  const linesCount = message.split('\n').length;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Componer Mensaje</h3>

      <FormatToolbar applyFormat={applyFormat} />

      <div className="relative">
        <div className="absolute right-2 top-2">
          <motion.button
            onClick={() => setShowVariables(!showVariables)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-lg ${
              showVariables ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Variable className="w-4 h-4" />
          </motion.button>
        </div>

        <textarea
          id="message"
          value={message}
          onChange={e => handleMessageChange(e.target.value)}
          placeholder="Escribe tu mensaje aquí..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
          required
        />

        <AnimatePresence>
          {showVariables && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <VariableEditor
                variables={variables}
                addVariable={addVariable}
                updateVariable={updateVariable}
                addValueToVariable={addValueToVariable}
                updateVariableValue={updateVariableValue}
                removeVariableValue={removeVariableValue}
                removeVariable={removeVariable}
                insertVariable={insertVariable}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={linkPreview}
            onChange={e => handleOptionsChange(e.target.checked, mentionsEveryOne)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Link2 className="w-4 h-4" />
          Vista previa de enlaces
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={mentionsEveryOne}
            onChange={e => handleOptionsChange(linkPreview, e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <Users className="w-4 h-4" />
          Mencionar a todos
        </label>
      </div>

      {usedVariables.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2"
        >
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-600">
            <p className="font-medium mb-2">Variables detectadas en tu mensaje:</p>
            <ul className="list-disc list-inside space-y-2">
              {usedVariables.map(v => (
                <li key={v.id}>
                  <div className="mb-1">
                    <code className="bg-blue-100 px-1 rounded">{v.name}</code>: {v.description}
                  </div>
                  <div className="ml-5 text-xs">
                    <span className="font-medium">Valores posibles:</span> {v.values.join(' | ')}
                  </div>
                </li>
              ))}
            </ul>
            {message && (
              <div className="mt-3 p-2 bg-blue-100 rounded">
                <p className="font-medium mb-1">Ejemplo aleatorio:</p>
                <p className="text-blue-800">{getExampleWithRandomValues()}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
