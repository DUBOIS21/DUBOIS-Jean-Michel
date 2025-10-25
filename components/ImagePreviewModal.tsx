import React, { useEffect } from 'react';
import { XMarkIcon, ArrowRightIcon, DownloadIcon } from './Icons';

interface ImagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
    onSendToEditor: (imageUrl: string) => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ isOpen, onClose, imageUrl, onSendToEditor }) => {
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

    if (!isOpen || !imageUrl) {
        return null;
    }

    const handleSendToEditorClick = () => {
        onSendToEditor(imageUrl);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ animation: 'fadeIn 0.2s ease-out' }}
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="relative w-full h-full max-w-4xl max-h-[90vh] flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="absolute -top-2 -right-2 text-white bg-bunker-900/80 p-2 rounded-full hover:bg-bunker-900/100 transition-colors z-10"
                    onClick={onClose}
                    aria-label="Fermer"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
                <div className="flex-grow flex items-center justify-center overflow-hidden">
                    <img
                        src={imageUrl}
                        alt="Aperçu de l'image générée"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                    />
                </div>
                <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4 sm:px-0">
                     <button
                        onClick={handleSendToEditorClick}
                        className="bg-sky-600 text-white py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-sky-700 transition-all duration-200 transform hover:scale-105 shadow-lg w-full sm:w-auto"
                        title="Envoyer vers l'éditeur"
                    >
                        <ArrowRightIcon className="w-5 h-5" />
                        <span>Vers l'éditeur</span>
                    </button>
                    <a
                        href={imageUrl}
                        download="creation-ia.jpg"
                        className="bg-bunker-100 dark:bg-bunker-800 text-bunker-900 dark:text-bunker-100 py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-bunker-200 dark:hover:bg-bunker-700 transition-all duration-200 transform hover:scale-105 shadow-lg w-full sm:w-auto"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span>Télécharger</span>
                    </a>
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
};

export default ImagePreviewModal;
