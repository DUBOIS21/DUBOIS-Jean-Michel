import React, { useEffect } from 'react';
import { ExclamationTriangleIcon } from './Icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, children, confirmText }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <div
        className="bg-bunker-100 dark:bg-bunker-900 rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4"
        style={{ animation: 'fadeInUp 0.2s ease-out' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <div className="flex-1">
                <h3 id="confirmation-modal-title" className="text-xl font-bold text-bunker-900 dark:text-bunker-100">{title}</h3>
                <div className="mt-2 text-base text-bunker-700 dark:text-bunker-300">
                    {children}
                </div>
            </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
            <button 
                type="button"
                onClick={onClose} 
                className="w-full sm:w-auto py-2 px-4 bg-bunker-200 dark:bg-bunker-800 font-semibold rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700 transition-colors"
            >
                Annuler
            </button>
            <button 
                type="button"
                onClick={onConfirm} 
                className="w-full sm:w-auto py-2 px-6 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
                {confirmText || 'Oui, Confirmer'}
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
};

export default ConfirmationModal;