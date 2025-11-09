import React from 'react';
import { VHistoryEntry } from '../types';
import { ChevronDownIcon, ArrowDownOnSquareIcon, ArrowUpOnSquareIcon, TrashIcon, DownloadIcon, ArrowPathIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';

interface VHistoryProps {
  history: VHistoryEntry[];
  modules: any[]; // Pour retrouver le titre du module
  onLoad: (entry: VHistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onExport: () => void;
  onImportClick: () => void;
  isConfirmingClear: boolean;
  setIsConfirmingClear: (isConfirming: boolean) => void;
}

const VHistory: React.FC<VHistoryProps> = ({
  history,
  modules,
  onLoad,
  onDelete,
  onClear,
  onExport,
  onImportClick,
  isConfirmingClear,
  setIsConfirmingClear
}) => {

  const getModuleTitle = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    return module ? module.title : 'Module inconnu';
  };
  
  return (
    <details className="bg-bunker-100 dark:bg-bunker-900 p-4 sm:p-6 rounded-xl shadow-lg group mt-8" open={history.length > 0}>
        <summary className="list-none flex justify-between items-center cursor-pointer mb-4">
             <h3 className="text-xl font-bold">Partie 2 : Historique</h3>
             <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); onImportClick(); }} title="Importer" className="p-1.5 rounded-full hover:bg-sky-500/10"><ArrowDownOnSquareIcon className="w-5 h-5" /></button>
                <button onClick={(e) => { e.stopPropagation(); onExport(); }} title="Exporter" className="p-1.5 rounded-full hover:bg-sky-500/10"><ArrowUpOnSquareIcon className="w-5 h-5" /></button>
                <button onClick={(e) => { e.stopPropagation(); setIsConfirmingClear(true); }} title="Vider l'historique" className="p-1.5 rounded-full hover:bg-red-500/10 text-bunker-500 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button>
                <ChevronDownIcon className="w-5 h-5 text-bunker-500 group-open:rotate-180 transition-transform duration-300" />
            </div>
        </summary>
        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
            {history.length === 0 ? (
                <p className="text-sm text-center text-bunker-500 dark:text-bunker-400 py-4">Votre historique pour ce module est vide.</p>
            ) : history.map(entry => (
                <div key={entry.id} className="p-2 bg-bunker-200 dark:bg-bunker-800 rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700 transition-colors flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <img src={entry.generatedImageUrl} alt="aperçu" className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                        <div className="truncate">
                           <p className="text-sm font-semibold truncate" title={entry.userInput}>Sujet : "{entry.userInput}"</p>
                           <p className="text-xs text-bunker-500 dark:text-bunker-400 truncate">Module : {getModuleTitle(entry.moduleId)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                        <button onClick={() => onLoad(entry)} title="Recharger" className="p-2 rounded-full hover:bg-sky-500/10"><ArrowPathIcon className="w-5 h-5" /></button>
                        <a href={entry.generatedImageUrl} download={`creation-v-${entry.id.substring(0,8)}.jpg`} onClick={(e) => e.stopPropagation()} title="Télécharger" className="p-2 rounded-full hover:bg-sky-500/10"><DownloadIcon className="w-5 h-5" /></a>
                        <button onClick={() => onDelete(entry.id)} title="Supprimer" className="p-2 rounded-full hover:bg-red-500/10 text-bunker-600 hover:text-red-500"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                </div>
            ))}
        </div>
        <ConfirmationModal
            isOpen={isConfirmingClear}
            onClose={() => setIsConfirmingClear(false)}
            onConfirm={onClear}
            title="Vider l'historique"
            confirmText="Oui, Vider"
        >
            <p>Êtes-vous sûr de vouloir vider tout l'historique de ce module ? Cette action est irréversible.</p>
        </ConfirmationModal>
    </details>
  );
};

export default VHistory;