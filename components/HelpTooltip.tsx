import React, { useState, useRef, useEffect, useCallback } from 'react';
import { QuestionMarkCircleIcon, XMarkIcon } from './Icons';

interface HelpTooltipProps {
  title: string;
  children: React.ReactNode;
}

const HelpTooltip: React.FC<HelpTooltipProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
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
  }, [isOpen, handleClose]);


  return (
    <div className="relative inline-flex align-middle">
      <button
        onClick={() => setIsOpen(true)}
        className="text-bunker-400 hover:text-sky-500 transition-colors"
        aria-label="Afficher l'aide"
        aria-expanded={isOpen}
      >
        <QuestionMarkCircleIcon className="w-6 h-6" />
      </button>
      {isOpen && (
        <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-tooltip-title"
        >
            <div
                ref={tooltipRef}
                className="bg-bunker-100 dark:bg-bunker-900 rounded-xl shadow-2xl p-6 w-full max-w-lg space-y-4 animate-fade-in-up-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h3 id="help-tooltip-title" className="text-xl font-bold text-sky-600 dark:text-sky-500">{title}</h3>
                    <button onClick={handleClose} aria-label="Fermer l'aide" className="p-1 rounded-full hover:bg-bunker-200 dark:hover:bg-bunker-800 transition-colors">
                       <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="text-base text-bunker-700 dark:text-bunker-300 space-y-2 help-content max-h-[70vh] overflow-y-auto pr-2">
                    {children}
                </div>
            </div>
        </div>
      )}
       <style>{`
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
        }
        @keyframes fade-in-up-modal {
            from { opacity: 0; transform: translateY(20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-up-modal {
            animation: fade-in-up-modal 0.2s ease-out forwards;
        }
        .help-content ol, .help-content ul { 
            padding-left: 1.25rem;
            list-style-position: outside;
        }
        .help-content ol {
            list-style-type: decimal;
        }
        .help-content ul {
            list-style-type: disc;
        }
        .help-content li { 
            margin-top: 0.5em; 
            margin-bottom: 0.5em; 
        }
        .help-content strong { 
            font-weight: 600;
            color: #0284c7; /* text-sky-600 */
        }
        .dark .help-content strong {
            color: #38bdf8; /* dark:text-sky-400 */
        }
        .help-content code { 
            font-size: 0.875em;
            font-weight: 600;
            padding: 0.2em 0.4em;
            margin: 0;
            border-radius: 0.25rem;
            background-color: #e8eaed; /* bunker-100 */
            color: #0e1015; /* bunker-950 */
            font-family: monospace;
        }
        .dark .help-content code {
            background-color: #383d46; /* bunker-900 */
            color: #f4f5f6; /* bunker-50 */
        }
    `}</style>
    </div>
  );
};

export default HelpTooltip;
