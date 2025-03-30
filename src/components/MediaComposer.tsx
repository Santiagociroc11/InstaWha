import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image, Video, FileText, Music, X, AlertCircle, 
  CheckCircle2, Loader, Link2, Eye, EyeOff 
} from 'lucide-react';

export interface MediaConfig {
  type: 'image' | 'video' | 'document' | 'audio';
  file: File | null;
  caption?: string;
  url?: string;
  base64?: string;
  fileName?: string;
  mimetype?: string;
}

interface MediaComposerProps {
  onMediaChange: (media: MediaConfig | null) => void;
  onError: (error: string | null) => void;
}

// Componente para botones de formato
interface ToolbarButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, children }) => (
  <motion.button
    onClick={onClick}
    type="button"
    className="px-3 py-2 rounded-md bg-white text-gray-700 border border-gray-200 shadow-sm focus:outline-none transition-colors duration-200 hover:bg-blue-600 hover:text-white"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {children}
  </motion.button>
);

export const FormatToolbar: React.FC<{ applyFormat: (format: string) => void }> = ({ applyFormat }) => (
  <div className="flex flex-wrap gap-2 mb-2">
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
      <span className="bg-gray-200 p-1 rounded font-mono text-xs">Código</span>
    </ToolbarButton>
  </div>
);

export const MediaComposer: React.FC<MediaComposerProps> = ({ onMediaChange, onError }) => {
  const [mediaConfig, setMediaConfig] = useState<MediaConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaTypes = [
    { type: 'image', icon: Image, label: 'Imagen', accept: 'image/*', maxSize: 16 },
    { type: 'video', icon: Video, label: 'Video', accept: 'video/*', maxSize: 64 },
    { type: 'document', icon: FileText, label: 'Documento', accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt', maxSize: 100 },
    { type: 'audio', icon: Music, label: 'Audio', accept: 'audio/*', maxSize: 16 }
  ] as const;

  const handleFileSelect = async (type: MediaConfig['type']) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = mediaTypes.find(t => t.type === type)?.accept || '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const selectedType = mediaTypes.find(t => t.accept.includes(file.type.split('/')[0]));
    if (!selectedType) {
      onError('Tipo de archivo no soportado');
      return;
    }

    const maxSize = selectedType.maxSize * 1024 * 1024; // Convertir a bytes
    if (file.size > maxSize) {
      onError(`El archivo excede el límite de ${selectedType.maxSize}MB`);
      return;
    }

    setIsLoading(true);
    try {
      // Convertir el archivo a base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const newConfig: MediaConfig = {
        type: selectedType.type,
        file,
        base64: base64.split(',')[1], // Eliminar el prefijo del data URL
        fileName: file.name,
        mimetype: file.type,
        caption: selectedType.type !== 'audio' ? '' : undefined,
      };

      setMediaConfig(newConfig);
      onMediaChange(newConfig);
      onError(null);
    } catch (error) {
      onError('Error al procesar el archivo');
      console.error('Error processing file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMedia = () => {
    setMediaConfig(null);
    onMediaChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCaptionChange = (caption: string) => {
    if (!mediaConfig) return;
    const updated = { ...mediaConfig, caption };
    setMediaConfig(updated);
    onMediaChange(updated);
  };

  const handleUrlChange = (url: string) => {
    if (!mediaConfig) return;
    const updated = { ...mediaConfig, url };
    setMediaConfig(updated);
    onMediaChange(updated);
  };

  // Función para aplicar formato al texto del caption
  const applyCaptionFormat = (format: string) => {
    if (!mediaConfig) return;
    const textarea = document.getElementById('caption-editor') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = mediaConfig.caption || '';
    const textBefore = currentText.substring(0, start);
    const textAfter = currentText.substring(end);
    const selectedText = currentText.substring(start, end);
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

    const newCaption = textBefore + formattedText + textAfter;
    handleCaptionChange(newCaption);
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      {!mediaConfig && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {mediaTypes.map(({ type, icon: Icon, label, maxSize }) => (
            <motion.button
              key={type}
              onClick={() => handleFileSelect(type)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-8 h-8 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{label}</span>
              <span className="text-xs text-gray-500">Máx. {maxSize}MB</span>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {mediaConfig && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gray-50 rounded-lg p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const MediaIcon = mediaTypes.find(t => t.type === mediaConfig.type)?.icon;
                  return MediaIcon && <MediaIcon className="w-5 h-5 text-gray-600" />;
                })()}
                <span className="font-medium text-gray-700">
                  {mediaConfig.fileName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {mediaConfig.type !== 'audio' && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showPreview ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                )}
                <button
                  onClick={handleRemoveMedia}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {showPreview && mediaConfig.base64 && (
              <div className="flex justify-center">
                {mediaConfig.type === 'image' && (
                  <img
                    src={`data:${mediaConfig.mimetype};base64,${mediaConfig.base64}`}
                    alt="Preview"
                    className="max-h-48 rounded-lg"
                  />
                )}
                {mediaConfig.type === 'video' && (
                  <video
                    src={`data:${mediaConfig.mimetype};base64,${mediaConfig.base64}`}
                    controls
                    className="max-h-48 rounded-lg"
                  />
                )}
              </div>
            )}

            {mediaConfig.type !== 'audio' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Texto del {mediaConfig.type === 'document' ? 'documento' : 'medio'}
                </label>
                {/* Barra de herramientas para aplicar estilos al caption */}
                <FormatToolbar applyFormat={applyCaptionFormat} />
                <textarea
                  id="caption-editor"
                  value={mediaConfig.caption || ''}
                  onChange={(e) => handleCaptionChange(e.target.value)}
                  placeholder={`Agrega un texto para tu ${
                    mediaConfig.type === 'image' ? 'imagen' :
                    mediaConfig.type === 'video' ? 'video' : 'documento'
                  }`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL del archivo (opcional)
              </label>
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={mediaConfig.url || ''}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Si proporcionas una URL, se usará en lugar del archivo local
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      )}
    </div>
  );
};
