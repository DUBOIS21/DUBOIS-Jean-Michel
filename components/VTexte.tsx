import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { generateImage } from '../services/geminiService';
import { SparklesIcon, DownloadIcon, XCircleIcon, PlusCircleIcon, TrashIcon, ArrowDownOnSquareIcon, ArrowUpOnSquareIcon, MagnifyingGlassIcon } from './Icons';
import HelpTooltip from './HelpTooltip';
import ImagePreviewModal from './ImagePreviewModal';
import { useVHistory } from '../hooks/useVHistory';
import VHistory from './VHistory';
import { VHistoryEntry } from '../types';

const defaultInspirationModules = [
    {
        id: 'plushie',
        title: '"CHOSE" EN PELUCHE',
        template: "Créez une affiche CGI hyperréaliste d'une [IMAGE1] avec sa queue, une peluche à la fourrure longue et soyeuse, douce et élégante. Tous les autres éléments, comme la tige et les feuilles, sont photoréalistes. Utilisez une palette de couleurs douces. La composition est minimaliste, sur un fond clair avec un éclairage doux et diffus pour une esthétique épurée et élégante.",
        placeholder: "Ex: Rose, renard, livre...",
        isCustom: false,
    },
    {
        id: 'food',
        title: 'DEMI FRUIT+CUBE',
        template: "Photographie culinaire minimaliste, [IMAGE1] repose sur une surface légère et mate et est capturé au milieu de sa transformation en une forme pixelisée 3D : une moitié reste intacte tandis que l'autre se fragmente organiquement en grands cubes flottants qui dérivent vers l'extérieur, chaque cube révélant la texture, les ingrédients et les couleurs de l'objet ; éclairage de studio avec des ombres douces et réalistes, faible profondeur de champ, perspective et composition de bon goût, détails hyperréalistes, abstraction géométrique élégante, flou de mouvement subtil sur les cubes, haute résolution, gros plan cinématographique",
        placeholder: "Ex: Un croissant, une fraise...",
        isCustom: false,
    }
];

const DEFAULT_MODULE_ID = defaultInspirationModules[0].id;

const useGenericItems = (storageKey: string, defaultItems: any[]) => {
    const getInitialItems = useCallback(() => {
        try {
            const savedCustomItems = localStorage.getItem(storageKey);
            if (savedCustomItems) {
                const parsed = JSON.parse(savedCustomItems);
                if (Array.isArray(parsed)) {
                    return [...defaultItems, ...parsed];
                }
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
            if (customItems.length > 0) {
                localStorage.setItem(storageKey, JSON.stringify(customItems));
            } else {
                localStorage.removeItem(storageKey);
            }
        } catch(e) {
            console.error(`Impossible de sauvegarder les items dans ${storageKey}:`, e);
        }
    }, [items, storageKey]);

    const addItem = useCallback((itemData: { title: string; [key: string]: any; }) => {
        const newItem = {
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
                const existingCustomTitles = prev.filter(m => m.isCustom).map(m => m.title);
                const newItems = importedItems
                    .filter((imported: any) => 'title' in imported && !existingCustomTitles.includes(imported.title))
                    .map((imported: any) => ({
                        ...imported,
                        id: crypto.randomUUID(),
                        isCustom: true,
                    }));
                
                if (newItems.length > 0) {
                    alert(`${newItems.length} module(s) importé(s) avec succès !`);
                } else {
                    alert("Aucun nouveau module à importer. Les modules avec des titres existants ont été ignorés.");
                }
                
                return [...prev, ...newItems];
            });

        } catch (error: any) {
            alert(`Erreur: ${error.message || "Le fichier est invalide ou corrompu et ne peut pas être importé."}`);
            console.error("Erreur d'importation:", error);
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

interface VTexteProps {
    onUsageUpdate: (count: number) => void;
    onSendToEditor: (imageUrl: string) => void;
    onLoadComplete: (status: 'success' | 'error') => void;
    dailyUsage: number;
    limit: number;
}


const VTexte: React.FC<VTexteProps> = ({ onUsageUpdate, onSendToEditor, onLoadComplete, dailyUsage, limit }) => {
    const importModulesInputRef = useRef<HTMLInputElement>(null);
    const { items: modules, addItem: addModule, deleteItem: deleteModule, importItems: importModules, exportItems: exportModules } = useGenericItems('customInspirationModules', defaultInspirationModules);
    const { history, addToHistory, deleteFromHistory, clearHistory, exportHistory, importInputRef: historyImportRef, handleImportFile, isConfirmingClear, setIsConfirmingClear } = useVHistory('vTexteHistory');

    const [selectedModuleId, setSelectedModuleId] = useState(DEFAULT_MODULE_ID);
    const [moduleInput, setModuleInput] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isModuleLoading, setIsModuleLoading] = useState(false);
    const [moduleError, setModuleError] = useState<string | null>(null);
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [newModuleTemplate, setNewModuleTemplate] = useState('');
    const [newModuleError, setNewModuleError] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    
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
            setSelectedModuleId(DEFAULT_MODULE_ID);
        }
    }, [modules, selectedModuleId]);

    const activeModule = useMemo(() => 
        modules.find(m => m.id === selectedModuleId),
    [selectedModuleId, modules]);

    const handleGenerateModuleImage = useCallback(async () => {
        if (!moduleInput || !activeModule) return;
    
        setIsModuleLoading(true);
        setModuleError(null);
        setGeneratedImage(null);
    
        const finalPrompt = activeModule.template.replace(/\[IMAGE1\]/g, moduleInput);
    
        try {
            const imageUrls = await generateImage(finalPrompt, '', '1:1', 1);
            if (imageUrls.length > 0) {
                const generatedImageUrl = imageUrls[0];
                setGeneratedImage(generatedImageUrl);
                onUsageUpdate(1);
                addToHistory({
                    moduleId: activeModule.id,
                    userInput: moduleInput,
                    finalPrompt,
                    generatedImageUrl,
                });
            } else {
                throw new Error("L'API n'a retourné aucune image.");
            }
        } catch (e: any) {
            setModuleError(e.message || "Une erreur est survenue lors de la génération de l'image.");
        } finally {
            setIsModuleLoading(false);
        }
    }, [moduleInput, activeModule, onUsageUpdate, addToHistory]);

    const handleSaveNewModule = () => {
        if (!newModuleTitle.trim()) {
            setNewModuleError('Le titre ne peut pas être vide.');
            return;
        }
        if (!newModuleTemplate.trim()) {
            setNewModuleError('Le modèle de prompt ne peut pas être vide.');
            return;
        }
        if (!newModuleTemplate.includes('[IMAGE1]')) {
            setNewModuleError("Le modèle de prompt doit contenir la variable [IMAGE1].");
            return;
        }

        const newModule = addModule({ 
            title: newModuleTitle.trim(), 
            template: newModuleTemplate.trim(), 
            placeholder: 'Votre texte ici...' 
        });

        setSelectedModuleId(newModule.id);
        setIsAddModalOpen(false);
        setNewModuleTitle('');
        setNewModuleTemplate('');
        setNewModuleError('');
    };

    const handleDeleteSelectedModule = () => {
        if (!activeModule?.isCustom) return;
    
        if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce module ?")) {
            deleteModule(selectedModuleId);
        }
    };
    
    const handleImportModulesFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            importModules(content);
        };
        reader.readAsText(file);
        if(e.target) e.target.value = '';
    };

    const handleLoadFromHistory = (entry: VHistoryEntry) => {
        setSelectedModuleId(entry.moduleId);
        setModuleInput(entry.userInput);
        setGeneratedImage(entry.generatedImageUrl);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        setModuleInput('');
        setGeneratedImage(null);
        setModuleError(null);
    }, [selectedModuleId]);

    return (
        <div className="container mx-auto space-y-12">
            <input
                type="file"
                ref={importModulesInputRef}
                onChange={handleImportModulesFile}
                className="hidden"
                accept=".json"
            />
             <input
                type="file"
                ref={historyImportRef}
                onChange={handleImportFile}
                className="hidden"
                accept=".json"
            />
            <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-sky-600 dark:text-sky-500 inline-flex items-center gap-2">
                    <span>Modules de Prompts par Texte</span>
                     <HelpTooltip title="Que sont les Modules ?">
                       <p>Les modules sont des modèles de prompts avancés. Ils permettent de créer des images complexes et stylisées très facilement.</p>
                       <ol>
                           <li><strong>Choisissez un module</strong> dans la liste déroulante.</li>
                           <li><strong>Remplissez le champ</strong> (ex: <code>un chat</code>) pour remplacer la variable <code>[IMAGE1]</code> dans le modèle de prompt.</li>
                           <li><strong>Cliquez sur "Générer"</strong> pour voir le résultat !</li>
                           <li><strong>Personnalisez :</strong> Créez vos propres modules avec le bouton ➕, importez-en ou exportez les vôtres pour les partager !</li>
                       </ol>
                    </HelpTooltip>
                </h1>
                <p className="mt-2 text-lg text-bunker-600 dark:text-bunker-400">Générez des images à partir de modèles de prompts personnalisables.</p>
            </div>
            
            <div className="bg-bunker-100 dark:bg-bunker-900 p-6 rounded-xl shadow-lg max-w-4xl mx-auto">
                <div className="mb-4">
                    <label htmlFor="inspiration-module-select" className="block text-xl font-bold mb-2">
                       Partie 1 : Générateur
                    </label>
                    <div className="flex items-stretch gap-2">
                        <select
                            id="inspiration-module-select"
                            value={selectedModuleId}
                            onChange={(e) => setSelectedModuleId(e.target.value)}
                            className="flex-grow w-full p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors"
                        >
                            {modules.map(module => (
                                <option key={module.id} value={module.id}>
                                    {module.isCustom ? '👤' : '⚙️'} {module.title}
                                </option>
                            ))}
                        </select>
                        <button onClick={() => importModulesInputRef.current?.click()} className="p-3 bg-bunker-200 dark:bg-bunker-800 text-bunker-700 dark:text-bunker-200 rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700 transition-colors" title="Importer des modules depuis un fichier">
                            <ArrowDownOnSquareIcon className="w-6 h-6"/>
                        </button>
                        <button onClick={() => exportModules('studio-creatif-ia-modules.json')} className="p-3 bg-bunker-200 dark:bg-bunker-800 text-bunker-700 dark:text-bunker-200 rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700 transition-colors" title="Sauvegarder mes modules personnalisés dans un fichier">
                            <ArrowUpOnSquareIcon className="w-6 h-6"/>
                        </button>
                        <button onClick={() => setIsAddModalOpen(true)} className="p-3 bg-bunker-200 dark:bg-bunker-800 text-bunker-700 dark:text-bunker-200 rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700 transition-colors" title="Ajouter un nouveau module">
                            <PlusCircleIcon className="w-6 h-6"/>
                        </button>
                        <button 
                            onClick={handleDeleteSelectedModule}
                            disabled={!activeModule?.isCustom}
                            className="p-3 rounded-lg transition-colors bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:bg-bunker-200/50 dark:disabled:bg-bunker-800/50 disabled:text-bunker-400 dark:disabled:text-bunker-600 disabled:cursor-not-allowed"
                            title={activeModule?.isCustom ? "Supprimer le module personnalisé" : "Impossible de supprimer un module par défaut"}
                        >
                            <TrashIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                {activeModule && (
                    <>
                        <p className="mb-4 text-bunker-600 dark:text-bunker-400 text-sm italic">
                            "{activeModule.template.split('[IMAGE1]').map((part, index) => 
                                index === 0 ? part : <React.Fragment key={index}><strong className="text-bunker-800 dark:text-bunker-200 not-italic">[IMAGE1]</strong>{part}</React.Fragment>
                            )}"
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div className="flex flex-col gap-4 order-2 md:order-1">
                                <label htmlFor="module-input" className="font-semibold">Remplacer <span className="font-bold text-sky-500">[IMAGE1]</span> par :</label>
                                <div className="flex items-stretch gap-2">
                                    <input
                                        id="module-input"
                                        type="text"
                                        value={moduleInput}
                                        onChange={(e) => setModuleInput(e.target.value)}
                                        placeholder={activeModule.placeholder}
                                        className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors"
                                    />
                                    <button
                                        onClick={handleGenerateModuleImage}
                                        disabled={!moduleInput || isModuleLoading || dailyUsage >= limit}
                                        className="px-4 bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-sky-700 disabled:bg-bunker-400 dark:disabled:bg-bunker-600 disabled:cursor-not-allowed transition-all"
                                        title="Générer l'image"
                                    >
                                        {isModuleLoading ? (
                                            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                        ) : (
                                            <SparklesIcon className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                {moduleError && <p className="text-red-500 text-sm font-semibold mt-2">{moduleError}</p>}
                            </div>
                            <div className="w-full aspect-square bg-bunker-200 dark:bg-bunker-800 rounded-lg flex items-center justify-center border-2 border-dashed border-bunker-300 dark:border-bunker-700 relative overflow-hidden order-1 md:order-2">
                                {isModuleLoading && (
                                    <div className="absolute inset-0 bg-bunker-200/50 dark:bg-bunker-800/50 backdrop-blur-sm flex flex-col items-center justify-center gap-2 animate-pulse">
                                        <div className="w-10 h-10 border-4 border-t-transparent border-sky-500 rounded-full animate-spin"></div>
                                        <p className="font-semibold text-bunker-600 dark:text-bunker-300">Création en cours...</p>
                                    </div>
                                )}
                                {!isModuleLoading && moduleError && (
                                    <div className="text-center text-red-500 p-4">
                                        <XCircleIcon className="w-12 h-12 mx-auto" />
                                        <p className="mt-2 font-semibold">Erreur de génération</p>
                                    </div>
                                )}
                                {!isModuleLoading && !moduleError && generatedImage && (
                                    <div
                                        className="relative group w-full h-full cursor-pointer"
                                        onClick={() => setIsPreviewOpen(true)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsPreviewOpen(true)}
                                        aria-label="Agrandir l'image"
                                    >
                                        <img src={generatedImage} alt={`Affiche de ${moduleInput}`} className="w-full h-full object-cover rounded-lg" />
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                                            <MagnifyingGlassIcon className="w-12 h-12 text-white" />
                                        </div>
                                    </div>
                                )}
                                {!isModuleLoading && !moduleError && !generatedImage && (
                                    <p className="text-bunker-500 dark:text-bunker-400 p-4 text-center">Le résultat de votre création apparaîtra ici.</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
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
                 <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}>
                    <div className="bg-bunker-100 dark:bg-bunker-900 rounded-xl shadow-2xl p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-sky-600 dark:text-sky-500">Ajouter un nouveau module</h3>
                        <div>
                            <label htmlFor="new-module-title" className="font-semibold block mb-2">Titre du module</label>
                            <input
                                id="new-module-title"
                                type="text"
                                value={newModuleTitle}
                                onChange={(e) => setNewModuleTitle(e.target.value)}
                                placeholder="Ex: Style Aquarelle Rêveur"
                                className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label htmlFor="new-module-template" className="font-semibold block mb-2">Modèle de prompt (doit inclure <span className="font-bold text-sky-500">[IMAGE1]</span>)</label>
                            <textarea
                                id="new-module-template"
                                value={newModuleTemplate}
                                onChange={(e) => setNewModuleTemplate(e.target.value)}
                                placeholder="Ex: Une aquarelle douce et éthérée de [IMAGE1]..."
                                className="w-full h-32 p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors"
                            />
                        </div>
                        {newModuleError && <p className="text-red-500 text-sm font-semibold">{newModuleError}</p>}
                        <div className="flex justify-end gap-4 pt-4">
                            <button onClick={() => setIsAddModalOpen(false)} className="py-2 px-4 bg-bunker-200 dark:bg-bunker-800 font-semibold rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700 transition-colors">Annuler</button>
                            <button onClick={handleSaveNewModule} className="py-2 px-6 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 transition-colors">Enregistrer</button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default VTexte;