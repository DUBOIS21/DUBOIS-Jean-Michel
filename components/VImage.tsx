import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { generateImage } from '../services/geminiService';
import { SparklesIcon, PlusCircleIcon, TrashIcon, ArrowDownOnSquareIcon, ArrowUpOnSquareIcon, PhotoIcon, XMarkIcon, MagnifyingGlassIcon } from './Icons';
import HelpTooltip from './HelpTooltip';
import ImagePreviewModal from './ImagePreviewModal';
import { useVHistory } from '../hooks/useVHistory';
import VHistory from './VHistory';
import { VHistoryEntry } from '../types';

// Module Type
interface ImageModule {
    id: string;
    title: string;
    template: string;
    placeholder?: string;
    isCustom: boolean;
}

// Hook pour gérer les items (modules, prompts, etc.)
const useGenericItems = (storageKey: string, defaultItems: Omit<ImageModule, 'id' | 'isCustom'>[]) => {
    const getInitialItems = useCallback((): ImageModule[] => {
        const defaultItemsWithFlags: ImageModule[] = defaultItems.map(item => ({ ...item, id: crypto.randomUUID(), isCustom: false }));
        try {
            const savedCustomItems = localStorage.getItem(storageKey);
            if (savedCustomItems) {
                const parsed = JSON.parse(savedCustomItems);
                if (Array.isArray(parsed)) {
                    // Les items sauvegardés sont déjà des modules personnalisés complets
                    return [...defaultItemsWithFlags, ...parsed];
                }
            }
        } catch (e) {
            console.error(`Impossible de charger les items depuis ${storageKey}:`, e);
            localStorage.removeItem(storageKey);
        }
        return defaultItemsWithFlags;
    }, [storageKey, defaultItems]);

    const [items, setItems] = useState(getInitialItems);

    useEffect(() => {
        const customItems = items.filter(m => m.isCustom);
        try {
            if (customItems.length > 0) {
                localStorage.setItem(storageKey, JSON.stringify(customItems));
            } else {
                localStorage.removeItem(storageKey);
            }
        } catch(e) {
            console.error(`Impossible de sauvegarder les items dans ${storageKey}:`, e);
        }
    }, [items, storageKey]);

    const addItem = useCallback((itemData: Omit<ImageModule, 'id' | 'isCustom'>) => {
        const newItem: ImageModule = {
            id: crypto.randomUUID(),
            ...itemData,
            isCustom: true,
        };
        setItems(prev => [...prev, newItem]);
        return newItem;
    }, []);
    
    const deleteItem = useCallback((itemId: string) => {
        setItems(prev => prev.filter(m => m.id !== itemId));
    }, []);

    const importItems = useCallback((fileContent: string) => {
        try {
            const importedItems = JSON.parse(fileContent);
            if (!Array.isArray(importedItems) || !importedItems.every(item => 'title' in item && 'template' in item)) {
                 throw new Error("Format de fichier invalide. Le fichier doit être un tableau d'objets avec les clés: title, template.");
            }
            setItems(prev => {
                const existingCustomTitles = new Set(prev.filter(m => m.isCustom).map(m => m.title));
                const newItems = importedItems
                    .filter((imported: any) => !existingCustomTitles.has(imported.title))
                    .map((imported: any) => ({
                        ...imported,
                        id: crypto.randomUUID(),
                        isCustom: true,
                    }));
                
                if (newItems.length > 0) alert(`${newItems.length} module(s) importé(s) avec succès !`);
                else alert("Aucun nouveau module à importer. Les modules avec des titres existants ont été ignorés.");
                
                return [...prev, ...newItems];
            });
        } catch (error: any) {
            alert(`Erreur: ${error.message || "Le fichier est invalide ou corrompu."}`);
        }
    }, []);

    const exportItems = useCallback((downloadName: string) => {
        const customItems = items.filter(m => m.isCustom);
        if (customItems.length === 0) {
            alert("Il n'y a aucun module personnalisé à exporter.");
            return;
        }
        const dataStr = JSON.stringify(customItems.map(({id, isCustom, ...rest}) => rest), null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [items]);

    return { items, addItem, deleteItem, importItems, exportItems };
};

interface VImageProps {
    onUsageUpdate: (count: number) => void;
    onSendToEditor: (imageUrl: string) => void;
    onLoadComplete: (status: 'success' | 'error') => void;
    dailyUsage: number;
    limit: number;
}

const VImage: React.FC<VImageProps> = ({ onUsageUpdate, onSendToEditor, onLoadComplete, dailyUsage, limit }) => {
    const importModulesInputRef = useRef<HTMLInputElement>(null);
    const { items: modules, addItem: addModule, deleteItem: deleteModule, importItems: importModules, exportItems: exportModules } = useGenericItems('customImageModules', []);
    const { history, addToHistory, deleteFromHistory, clearHistory, exportHistory, importInputRef: historyImportRef, handleImportFile, isConfirmingClear, setIsConfirmingClear } = useVHistory('vImageHistory');

    const [selectedModuleId, setSelectedModuleId] = useState<string>('');
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const uploadInputRef = useRef<HTMLInputElement>(null);
    const [textInput, setTextInput] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [newModuleTemplate, setNewModuleTemplate] = useState('');
    const [newModuleError, setNewModuleError] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    
    const activeModule = useMemo(() => modules.find(m => m.id === selectedModuleId), [selectedModuleId, modules]);

    useEffect(() => {
        try {
            onLoadComplete('success');
        } catch(e) {
            onLoadComplete('error');
        }
    }, [onLoadComplete]);

    useEffect(() => {
        const selectedExists = modules.some(m => m.id === selectedModuleId);
        if (!selectedExists) {
            setSelectedModuleId(modules.length > 0 ? modules[0].id : '');
        }
    }, [modules, selectedModuleId]);
    
    useEffect(() => {
        setTextInput('');
        setGeneratedImage(null);
        setError(null);
    }, [selectedModuleId]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setGeneratedImage(null);
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => setUploadedImageUrl(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setUploadedImageUrl(null);
        if (uploadInputRef.current) uploadInputRef.current.value = '';
    };

    const handleGenerate = useCallback(async () => {
        if (!uploadedImageUrl || !activeModule) {
            setError("Veuillez importer une image et sélectionner un module.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        const finalPrompt = activeModule.template.replace(/\[TEXT\]/gi, textInput);
        try {
            const imageUrls = await generateImage(finalPrompt, '', '1:1', 1, uploadedImageUrl ? [uploadedImageUrl] : null);
            if (imageUrls.length > 0) {
                const generatedImageUrl = imageUrls[0];
                setGeneratedImage(generatedImageUrl);
                onUsageUpdate(1);
                addToHistory({
                    moduleId: activeModule.id,
                    userInput: textInput,
                    finalPrompt,
                    generatedImageUrl,
                    baseImageUrl: uploadedImageUrl,
                });
            }
            else throw new Error("L'API n'a retourné aucune image.");
        } catch (e: any) {
            setError(e.message || "Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    }, [textInput, activeModule, uploadedImageUrl, onUsageUpdate, addToHistory]);

    const handleSaveNewModule = () => {
        if (!newModuleTitle.trim()) { setNewModuleError('Le titre ne peut pas être vide.'); return; }
        if (!newModuleTemplate.trim()) { setNewModuleError('Le modèle de prompt ne peut pas être vide.'); return; }
        
        const newModule = addModule({
            title: newModuleTitle.trim(),
            template: newModuleTemplate.trim(),
            placeholder: 'Décrivez votre sujet...',
        });
        setSelectedModuleId(newModule.id);
        setIsAddModalOpen(false);
        setNewModuleTitle('');
        setNewModuleTemplate('');
        setNewModuleError('');
    };
    
    const handleDeleteSelectedModule = () => {
        if (!activeModule?.isCustom) return;
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce module ?")) {
            deleteModule(selectedModuleId);
        }
    };
    
    const handleImportModulesFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => importModules(event.target?.result as string);
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleLoadFromHistory = (entry: VHistoryEntry) => {
        setSelectedModuleId(entry.moduleId);
        setTextInput(entry.userInput);
        setGeneratedImage(entry.generatedImageUrl);
        setUploadedImageUrl(entry.baseImageUrl || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="container mx-auto space-y-8">
             <input type="file" ref={importModulesInputRef} onChange={handleImportModulesFile} className="hidden" accept=".json" />
             <input type="file" ref={historyImportRef} onChange={handleImportFile} className="hidden" accept=".json" />
             <input type="file" ref={uploadInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

            <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-sky-600 dark:text-sky-500 inline-flex items-center gap-2">
                    <span>Modules par Image</span>
                    <HelpTooltip title="Comment utiliser les Modules par Image ?">
                       <p>Cet outil vous permet de construire des prompts qui utilisent une image comme référence ou style.</p>
                       <ol>
                           <li><strong>Créez un module :</strong> Cliquez sur ➕ pour créer un nouveau modèle de prompt. Par exemple : <code>Un dessin de [TEXT] dans le style de l'image fournie.</code></li>
                           <li><strong>Sélectionnez votre module</strong> dans la liste. Son contenu s'affichera.</li>
                           <li><strong>Importez une image</strong> qui servira de référence.</li>
                           <li><strong>Remplissez le champ de texte</strong> (ex: <code>un chat</code>) si votre prompt contient la variable `[TEXT]`.</li>
                           <li><strong>Générez</strong> pour appliquer le style de l'image à votre description textuelle !</li>
                       </ol>
                    </HelpTooltip>
                </h1>
                <p className="mt-2 text-lg text-bunker-600 dark:text-bunker-400">Combinez une image de référence avec un modèle de prompt pour des créations uniques.</p>
            </div>

            <div className="bg-bunker-100 dark:bg-bunker-900 p-6 rounded-xl shadow-lg max-w-5xl mx-auto space-y-6">
                <div>
                    <label htmlFor="image-module-select" className="block text-xl font-bold mb-2">Partie 1 : Générateur</label>
                    <div className="flex items-stretch gap-2">
                        <select
                            id="image-module-select"
                            value={selectedModuleId}
                            onChange={(e) => setSelectedModuleId(e.target.value)}
                            className="flex-grow w-full p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        >
                            {modules.length === 0 && <option>Créez votre premier module...</option>}
                            {modules.map(module => <option key={module.id} value={module.id}>👤 {module.title}</option>)}
                        </select>
                        <button onClick={() => importModulesInputRef.current?.click()} className="p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700" title="Importer des modules"><ArrowDownOnSquareIcon className="w-6 h-6"/></button>
                        <button onClick={() => exportModules('studio-creatif-ia-modules-image.json')} className="p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700" title="Sauvegarder mes modules"><ArrowUpOnSquareIcon className="w-6 h-6"/></button>
                        <button onClick={() => setIsAddModalOpen(true)} className="p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700" title="Ajouter un module"><PlusCircleIcon className="w-6 h-6"/></button>
                        <button onClick={handleDeleteSelectedModule} disabled={!activeModule?.isCustom} className="p-3 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed" title="Supprimer le module"><TrashIcon className="w-6 h-6" /></button>
                    </div>
                </div>

                {activeModule && (
                    <div className="p-4 bg-bunker-50 dark:bg-bunker-950 rounded-lg border border-bunker-200 dark:border-bunker-800">
                        <p className="font-semibold">Détail du prompt sélectionné :</p>
                        <p className="text-bunker-600 dark:text-bunker-400 text-sm italic">
                            "{activeModule.template.split(/(\[TEXT\])/gi).map((part, index) => 
                                part.toUpperCase() === '[TEXT]' ? <strong key={index} className="text-sky-500 not-italic">[TEXT]</strong> : part
                            )}"
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="space-y-4">
                        <div>
                            <label className="font-semibold block mb-2">1. Image de référence</label>
                            <div onClick={() => !uploadedImageUrl && uploadInputRef.current?.click()} className={`w-full aspect-video rounded-lg border-2 border-dashed flex items-center justify-center relative transition-colors ${!uploadedImageUrl ? 'cursor-pointer hover:bg-bunker-200 dark:hover:bg-bunker-800' : ''}`}>
                                {!uploadedImageUrl ? (
                                    <div className="text-center text-bunker-500 dark:text-bunker-400"><PhotoIcon className="w-10 h-10 mx-auto" /><p>Cliquez pour importer</p></div>
                                ) : (
                                    <>
                                        <img src={uploadedImageUrl} alt="Aperçu" className="w-full h-full object-cover rounded-md" />
                                        <button onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full" aria-label="Supprimer"><XMarkIcon className="w-5 h-5" /></button>
                                    </>
                                )}
                            </div>
                        </div>
                         {activeModule?.template.toLowerCase().includes('[text]') && (
                            <div>
                                <label htmlFor="module-text-input" className="font-semibold block mb-2">2. Remplacer <span className="font-bold text-sky-500">[TEXT]</span> par :</label>
                                <input id="module-text-input" type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} placeholder={activeModule.placeholder} className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg"/>
                            </div>
                        )}
                        <button onClick={handleGenerate} disabled={isLoading || !uploadedImageUrl || !activeModule || dailyUsage >= limit} className="w-full py-3 bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-sky-700 disabled:bg-bunker-400 disabled:cursor-not-allowed">
                            {isLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <SparklesIcon className="w-6 h-6" />}
                            <span>Générer</span>
                        </button>
                    </div>
                    <div className="w-full aspect-square bg-bunker-200 dark:bg-bunker-800 rounded-lg flex items-center justify-center border-2 border-dashed relative">
                        {isLoading && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"><div className="w-10 h-10 border-4 border-t-transparent border-sky-500 rounded-full animate-spin"></div><p>Création...</p></div>}
                        {error && <div className="text-center text-red-500 p-4"><p className="font-semibold">Erreur</p><p className="text-sm">{error}</p></div>}
                        {generatedImage && (
                             <div
                                className="relative group w-full h-full cursor-pointer"
                                onClick={() => setIsPreviewOpen(true)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsPreviewOpen(true)}
                                aria-label="Agrandir l'image"
                            >
                                <img src={generatedImage} alt="Résultat" className="w-full h-full object-contain rounded-lg shadow-md" />
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                                    <MagnifyingGlassIcon className="w-12 h-12 text-white" />
                                </div>
                            </div>
                        )}
                        {!isLoading && !error && !generatedImage && <p className="text-bunker-500 dark:text-bunker-400 p-4 text-center">Le résultat apparaîtra ici.</p>}
                    </div>
                </div>
            </div>

            <VHistory 
                history={history}
                modules={modules}
                onLoad={handleLoadFromHistory}
                onDelete={deleteFromHistory}
                onClear={clearHistory}
                onExport={exportHistory}
                onImportClick={() => historyImportRef.current?.click()}
                isConfirmingClear={isConfirmingClear}
                setIsConfirmingClear={setIsConfirmingClear}
            />
            
            {generatedImage && <ImagePreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} imageUrl={generatedImage} onSendToEditor={onSendToEditor} />}

            {isAddModalOpen && (
                 <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setIsAddModalOpen(false)}>
                    <div className="bg-bunker-100 dark:bg-bunker-900 rounded-xl p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold">Ajouter un module pour image</h3>
                        <div>
                            <label htmlFor="new-module-title" className="font-semibold block mb-2">Titre du module</label>
                            <input id="new-module-title" type="text" value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} placeholder="Ex: Style Aquarelle" className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg"/>
                        </div>
                        <div>
                            <label htmlFor="new-module-template" className="font-semibold block mb-2">Modèle de prompt (utilisez <span className="font-bold text-sky-500">[TEXT]</span> comme variable)</label>
                            <textarea id="new-module-template" value={newModuleTemplate} onChange={(e) => setNewModuleTemplate(e.target.value)} placeholder="Ex: Une aquarelle de [TEXT] dans le style de l'image." className="w-full h-32 p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg" />
                        </div>
                        {newModuleError && <p className="text-red-500 text-sm">{newModuleError}</p>}
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setIsAddModalOpen(false)} className="py-2 px-4 bg-bunker-200 dark:bg-bunker-800 rounded-lg">Annuler</button>
                            <button onClick={handleSaveNewModule} className="py-2 px-6 bg-sky-600 text-white font-bold rounded-lg">Enregistrer</button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default VImage;