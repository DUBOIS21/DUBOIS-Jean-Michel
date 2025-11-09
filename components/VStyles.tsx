import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { generateImage } from '../services/geminiService';
import { SparklesIcon, DownloadIcon, XCircleIcon, PlusCircleIcon, TrashIcon, ArrowDownOnSquareIcon, ArrowUpOnSquareIcon, MagnifyingGlassIcon } from './Icons';
import HelpTooltip from './HelpTooltip';
import ImagePreviewModal from './ImagePreviewModal';
import ConfirmationModal from './ConfirmationModal';
import { useVHistory } from '../hooks/useVHistory';
import VHistory from './VHistory';
import { VHistoryEntry } from '../types';

const defaultStyles = [
    {
        id: 'watercolor-dream',
        title: 'Rêve d\'Aquarelle',
        template: "Une peinture à l'aquarelle douce et éthérée de [SUJET], avec des couleurs qui se fondent les unes dans les autres. Bords doux, atmosphère onirique, éclaboussures de peinture subtiles.",
        placeholder: "Ex: un cerf dans une forêt",
        isCustom: false,
    },
    {
        id: 'cyberpunk-neon',
        title: 'Néon Cyberpunk',
        template: "Une illustration vibrante de [SUJET] dans un style cyberpunk, baignée de néons roses et bleus. Ambiance de ville nocturne pluvieuse, détails high-tech, reflets sur des surfaces mouillées, très détaillé.",
        placeholder: "Ex: un samouraï",
        isCustom: false,
    },
    {
        id: 'minimalist-line-art',
        title: 'Dessin au Trait Minimaliste',
        template: "Un dessin au trait simple et épuré de [SUJET] sur un fond blanc uni. Une seule ligne continue si possible, style minimaliste, élégant, beaucoup d'espace négatif.",
        placeholder: "Ex: un portrait de chat",
        isCustom: false,
    }
];

const DEFAULT_STYLE_ID = defaultStyles.length > 0 ? defaultStyles[0].id : '';

const useGenericItems = (storageKey: string, defaultItems: any[]) => {
    const getInitialItems = useCallback(() => {
        try {
            const savedCustomItems = localStorage.getItem(storageKey);
            if (savedCustomItems) {
                const parsed = JSON.parse(savedCustomItems);
                if (Array.isArray(parsed)) return [...defaultItems, ...parsed];
            }
        } catch (e) {
            console.error(`Impossible de charger les items depuis ${storageKey}:`, e);
            localStorage.removeItem(storageKey);
        }
        return defaultItems;
    }, [storageKey, defaultItems]);

    const [items, setItems] = useState(getInitialItems);

    useEffect(() => {
        const customItems = items.filter(m => m.isCustom);
        try {
            localStorage.setItem(storageKey, JSON.stringify(customItems));
        } catch(e) { console.error(`Impossible de sauvegarder les items dans ${storageKey}:`, e); }
    }, [items, storageKey]);

    const addItem = useCallback((itemData: { title: string; [key: string]: any; }) => {
        const newItem = { id: crypto.randomUUID(), ...itemData, isCustom: true };
        setItems(prev => [...prev, newItem]);
        return newItem;
    }, []);
    
    const deleteItem = useCallback((itemId: string) => {
        setItems(prev => prev.filter(m => m.id !== itemId));
    }, []);

    const importItems = useCallback((fileContent: string) => {
        try {
            const imported = JSON.parse(fileContent);
            if (!Array.isArray(imported) || !imported.every(i => 'title' in i && 'template' in i)) throw new Error("Format invalide.");
            setItems(prev => {
                const existing = new Set(prev.map(m => m.title));
                const newItems = imported.filter((i: any) => !existing.has(i.title)).map((i: any) => ({ ...i, id: crypto.randomUUID(), isCustom: true }));
                if (newItems.length > 0) alert(`${newItems.length} style(s) importé(s) !`); else alert("Aucun nouveau style importé (les styles avec des titres déjà existants ont été ignorés).");
                return [...prev, ...newItems];
            });
        } catch (error: any) { alert(`Erreur: ${error.message || "Fichier invalide."}`); }
    }, []);

    const exportItems = useCallback((downloadName: string) => {
        const customItems = items.filter(m => m.isCustom);
        if (customItems.length === 0) {
            alert("Il n'y a aucun style personnalisé à exporter.");
            return;
        }
        const dataStr = JSON.stringify(customItems.map(({id, isCustom, ...rest}) => rest), null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        a.click();
        URL.revokeObjectURL(url);
    }, [items]);

    return { items, addItem, deleteItem, importItems, exportItems };
};

interface VStylesProps {
    onUsageUpdate: (count: number) => void;
    onSendToEditor: (imageUrl: string) => void;
    onLoadComplete: (status: 'success' | 'error') => void;
    dailyUsage: number;
    limit: number;
}

const VStyles: React.FC<VStylesProps> = ({ onUsageUpdate, onSendToEditor, onLoadComplete, dailyUsage, limit }) => {
    const importStylesInputRef = useRef<HTMLInputElement>(null);
    const { items: styles, addItem: addStyle, deleteItem: deleteStyle, importItems: importStyles, exportItems: exportStyles } = useGenericItems('customImageStyles', defaultStyles);
    const { history, addToHistory, deleteFromHistory, clearHistory, exportHistory, importInputRef: historyImportRef, handleImportFile, isConfirmingClear, setIsConfirmingClear } = useVHistory('vStylesHistory');

    const [selectedStyleId, setSelectedStyleId] = useState(DEFAULT_STYLE_ID);
    const [styleInput, setStyleInput] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    
    const [editableTemplate, setEditableTemplate] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newStyleTitle, setNewStyleTitle] = useState('');
    const [newStyleTemplate, setNewStyleTemplate] = useState('');
    const [newStyleError, setNewStyleError] = useState('');

    const [styleToDelete, setStyleToDelete] = useState<any | null>(null);

    useEffect(() => {
        try {
            onLoadComplete('success');
        } catch(e) {
            onLoadComplete('error');
        }
    }, [onLoadComplete]);

    useEffect(() => {
        if (!styles.some(m => m.id === selectedStyleId)) {
            setSelectedStyleId(styles.length > 0 ? styles[0].id : '');
        }
    }, [styles, selectedStyleId]);

    const activeStyle = useMemo(() => styles.find(m => m.id === selectedStyleId), [selectedStyleId, styles]);
    
    useEffect(() => {
        if (activeStyle) setEditableTemplate(activeStyle.template);
        else setEditableTemplate('');
    }, [activeStyle]);

    const finalPrompt = useMemo(() => {
        if (!activeStyle) return '';
        return editableTemplate.replace(/\[SUJET\]/gi, styleInput || '[SUJET]');
    }, [editableTemplate, styleInput, activeStyle]);

    const handleGenerate = useCallback(async () => {
        if (!finalPrompt || !styleInput || !activeStyle) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const imageUrls = await generateImage(finalPrompt, '', '1:1', 1);
            if (imageUrls.length > 0) {
                const generatedImageUrl = imageUrls[0];
                setGeneratedImage(generatedImageUrl);
                onUsageUpdate(1);
                addToHistory({
                    moduleId: activeStyle.id,
                    userInput: styleInput,
                    finalPrompt,
                    generatedImageUrl,
                });
            } else throw new Error("L'API n'a retourné aucune image.");
        } catch (e: any) {
            setError(e.message || "Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    }, [finalPrompt, styleInput, onUsageUpdate, activeStyle, addToHistory]);

    const handleSaveNewStyle = () => {
        if (!newStyleTitle.trim()) { setNewStyleError('Le titre est requis.'); return; }
        if (!newStyleTemplate.trim().includes('[SUJET]')) { setNewStyleError("Le modèle doit contenir la variable [SUJET]."); return; }
        const newStyle = addStyle({ title: newStyleTitle.trim(), template: newStyleTemplate.trim(), placeholder: 'Votre texte ici...' });
        setSelectedStyleId(newStyle.id);
        setIsAddModalOpen(false);
        setNewStyleTitle('');
        setNewStyleTemplate('');
        setNewStyleError('');
    };

    const handleDeleteClick = () => {
        if (activeStyle?.isCustom) setStyleToDelete(activeStyle);
    };

    const handleConfirmDelete = () => {
        if (styleToDelete) {
            deleteStyle(styleToDelete.id);
            setStyleToDelete(null);
        }
    };
    
    const handleImportStylesFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => importStyles(event.target?.result as string);
            reader.readAsText(file);
            e.target.value = '';
        }
    };

    const handleLoadFromHistory = (entry: VHistoryEntry) => {
        setSelectedStyleId(entry.moduleId);
        setStyleInput(entry.userInput);
        setGeneratedImage(entry.generatedImageUrl);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        setStyleInput('');
        setGeneratedImage(null);
        setError(null);
    }, [selectedStyleId]);

    return (
        <div className="space-y-8">
            <input type="file" ref={importStylesInputRef} onChange={handleImportStylesFile} className="hidden" accept=".json" />
            <input type="file" ref={historyImportRef} onChange={handleImportFile} className="hidden" accept=".json" />

            <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-sky-600 dark:text-sky-500 inline-flex items-center gap-2">
                    <span>Gestionnaire de Styles</span>
                     <HelpTooltip title="Comment utiliser le Gestionnaire de Styles ?">
                       <p>Les styles sont des modèles de prompts qui vous permettent de créer des images avec une esthétique spécifique et réutilisable.</p>
                       <ol>
                           <li><strong>Choisissez un style</strong> dans la liste. Son modèle de prompt s'affichera.</li>
                           <li><strong>Remplissez le champ "Sujet"</strong> (ex: <code>un chat</code>) pour remplacer la variable <code>[SUJET]</code>.</li>
                           <li><strong>Visualisez l'aperçu du prompt final</strong> pour voir et ajuster exactement ce que l'IA recevra.</li>
                           <li><strong>Cliquez sur "Générer"</strong> et admirez le résultat !</li>
                           <li><strong>Personnalisez :</strong> Créez vos propres styles avec ➕, importez-en ou exportez-les pour les partager avec d'autres.</li>
                       </ol>
                    </HelpTooltip>
                </h1>
                <p className="mt-2 text-lg text-bunker-600 dark:text-bunker-400">Créez, importez et utilisez des modèles de prompts artistiques.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 bg-bunker-100 dark:bg-bunker-900 p-6 rounded-xl shadow-lg flex flex-col gap-6">
                    <div>
                        <label htmlFor="style-select" className="block text-lg font-bold mb-2">1. Choisissez un style</label>
                        <div className="flex items-stretch gap-2">
                            <select id="style-select" value={selectedStyleId} onChange={(e) => setSelectedStyleId(e.target.value)} className="flex-grow w-full p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg focus:ring-2 focus:ring-sky-500">
                                {styles.length === 0 && <option value="">Créez ou importez un style...</option>}
                                {styles.map(s => <option key={s.id} value={s.id}>{s.isCustom ? '👤' : '⚙️'} {s.title}</option>)}
                            </select>
                            <button onClick={() => setIsAddModalOpen(true)} className="p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700" title="Ajouter"><PlusCircleIcon className="w-6 h-6"/></button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                             <button onClick={() => importStylesInputRef.current?.click()} className="flex-1 py-2 px-3 text-sm bg-bunker-200 dark:bg-bunker-800 rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700 flex items-center justify-center gap-2" title="Importer"><ArrowDownOnSquareIcon className="w-5 h-5"/> Importer</button>
                             <button onClick={() => exportStyles('ia-styles.json')} className="flex-1 py-2 px-3 text-sm bg-bunker-200 dark:bg-bunker-800 rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700 flex items-center justify-center gap-2" title="Exporter"><ArrowUpOnSquareIcon className="w-5 h-5"/> Exporter</button>
                             <button onClick={handleDeleteClick} disabled={!activeStyle?.isCustom} className="flex-1 py-2 px-3 text-sm bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2" title="Supprimer"><TrashIcon className="w-5 h-5" /> Supprimer</button>
                        </div>
                    </div>

                    {activeStyle && (
                        <>
                            <div>
                                <label htmlFor="style-input" className="block text-lg font-bold mb-2">2. Définissez votre sujet</label>
                                <input id="style-input" type="text" value={styleInput} onChange={(e) => setStyleInput(e.target.value)} placeholder={activeStyle.placeholder} className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg focus:ring-2 focus:ring-sky-500"/>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-2">3. Modèle de Prompt (modifiable)</h3>
                                <textarea
                                    value={editableTemplate}
                                    onChange={(e) => setEditableTemplate(e.target.value)}
                                    className="w-full h-24 p-3 text-sm bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors resize-y"
                                    aria-label="Modèle de prompt modifiable"
                                />
                                <div className="mt-2">
                                    <h4 className="font-semibold text-sm text-bunker-800 dark:text-bunker-200">Aperçu du Prompt Final</h4>
                                    <p className="text-xs text-bunker-600 dark:text-bunker-400 p-2 bg-bunker-50 dark:bg-bunker-950 rounded-lg mt-1 min-h-[4rem] border border-bunker-200 dark:border-bunker-800">
                                        {finalPrompt}
                                    </p>
                                </div>
                            </div>
                             <button onClick={handleGenerate} disabled={!styleInput || !finalPrompt || isLoading || dailyUsage >= limit} className="w-full py-3 bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-sky-700 disabled:bg-bunker-400 disabled:cursor-not-allowed transition-transform duration-200 transform hover:scale-105 shadow-lg">
                                {isLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <SparklesIcon className="w-6 h-6" />}
                                <span>Générer</span>
                            </button>
                        </>
                    )}
                </div>
                <div className="lg:col-span-3 bg-bunker-100 dark:bg-bunker-900 p-4 rounded-xl shadow-lg flex items-center justify-center min-h-[400px] lg:min-h-0">
                    <div className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-bunker-300 dark:border-bunker-700 rounded-lg p-4 relative">
                        {isLoading && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"><div className="w-10 h-10 border-4 border-t-transparent border-sky-500 rounded-full animate-spin"></div><p>Création en cours...</p></div>}
                        {error && <div className="text-center text-red-500 p-4"><XCircleIcon className="w-12 h-12 mx-auto" /><p className="mt-2 font-semibold">Erreur: {error}</p></div>}
                        {generatedImage && !isLoading && (
                            <div
                                className="relative group w-full h-full cursor-pointer"
                                onClick={() => setIsPreviewOpen(true)}
                                role="button" tabIndex={0}
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsPreviewOpen(true)}
                                aria-label="Agrandir l'image"
                            >
                                <img src={generatedImage} alt={`Génération pour ${styleInput}`} className="w-full h-full object-contain rounded-lg shadow-md" />
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                                    <MagnifyingGlassIcon className="w-12 h-12 text-white" />
                                </div>
                            </div>
                        )}
                        {!isLoading && !error && !generatedImage && <p className="text-bunker-500 dark:text-bunker-400 p-4 text-center">Le résultat de votre création apparaîtra ici.</p>}
                    </div>
                </div>
            </div>

            <VHistory 
                history={history}
                modules={styles}
                onLoad={handleLoadFromHistory}
                onDelete={deleteFromHistory}
                onClear={clearHistory}
                onExport={exportHistory}
                onImportClick={() => historyImportRef.current?.click()}
                isConfirmingClear={isConfirmingClear}
                setIsConfirmingClear={setIsConfirmingClear}
            />

            {generatedImage && <ImagePreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} imageUrl={generatedImage} onSendToEditor={onSendToEditor} />}
            <ConfirmationModal isOpen={!!styleToDelete} onClose={() => setStyleToDelete(null)} onConfirm={handleConfirmDelete} title="Confirmer la suppression">
                <p>Voulez-vous vraiment supprimer le style suivant ?</p>
                <p className="my-3 p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg text-center font-semibold text-sky-600 dark:text-sky-400">{styleToDelete?.title}</p>
                <p>Cette action est irréversible.</p>
            </ConfirmationModal>

            {isAddModalOpen && (
                 <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setIsAddModalOpen(false)}>
                    <div className="bg-bunker-100 dark:bg-bunker-900 rounded-xl p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold">Ajouter un nouveau style</h3>
                        <div>
                            <label htmlFor="new-style-title" className="font-semibold mb-2 block">Titre</label>
                            <input id="new-style-title" type="text" value={newStyleTitle} onChange={(e) => setNewStyleTitle(e.target.value)} placeholder="Ex: Nuit Étoilée" className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg"/>
                        </div>
                        <div>
                            <label htmlFor="new-style-template" className="font-semibold mb-2 block">Modèle (doit inclure <strong className="text-sky-500">[SUJET]</strong>)</label>
                            <textarea id="new-style-template" value={newStyleTemplate} onChange={(e) => setNewStyleTemplate(e.target.value)} placeholder="Ex: [SUJET] dans le style de La Nuit étoilée de Van Gogh..." className="w-full h-32 p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg" />
                        </div>
                        {newStyleError && <p className="text-red-500 text-sm">{newStyleError}</p>}
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setIsAddModalOpen(false)} className="py-2 px-4 bg-bunker-200 dark:bg-bunker-800 rounded-lg">Annuler</button>
                            <button onClick={handleSaveNewStyle} className="py-2 px-6 bg-sky-600 text-white font-bold rounded-lg">Enregistrer</button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default VStyles;