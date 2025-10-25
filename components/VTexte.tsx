import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { generateImage } from '../services/geminiService';
import { SparklesIcon, DownloadIcon, XCircleIcon, PlusCircleIcon, TrashIcon, ArrowDownOnSquareIcon, ArrowUpOnSquareIcon, MagnifyingGlassIcon } from './Icons';
import HelpTooltip from './HelpTooltip';
import ImagePreviewModal from './ImagePreviewModal';
import ConfirmationModal from './ConfirmationModal';

const defaultInspirationModules = [
    {
        id: 'monde-miniature',
        title: 'Monde Miniature',
        template: "Photographie macro d'un monde miniature complexe et détaillé représentant [SUJET]. La scène est construite à l'aide de matériaux du quotidien réutilisés de manière créative. Éclairage de studio dramatique, faible profondeur de champ créant un effet tilt-shift, couleurs vives et saturées, hyper-détaillé, mise au point sélective, composition impeccable. Style de Tatsuya Tanaka.",
        placeholder: "Ex: un combat de chevaliers...",
        isCustom: false,
    },
    {
        id: 'creature-steampunk',
        title: 'Créature Steampunk',
        template: "Portrait en gros plan d'un [SUJET] mécanique de style steampunk. La créature est faite d'engrenages en laiton, de tuyaux en cuivre et de détails complexes. Des lueurs de vapeur s'échappent des joints. L'arrière-plan est un atelier victorien encombré avec des outils et des plans. Éclairage volumétrique chaud provenant d'une lampe à gaz, textures métalliques réalistes, rendu Octane, très détaillé, 4k, art conceptuel cinématique.",
        placeholder: "Ex: un hibou, un dragon...",
        isCustom: false,
    },
    {
        id: 'scene-neo-noir',
        title: 'Scène Néo-Noir',
        template: "Une scène de film noir se déroulant dans une ruelle pluvieuse d'une mégalopole cyberpunk en 2088. Un [SUJET] est le point central, illuminé par des enseignes au néon holographiques projetant des reflets colorés sur le sol mouillé. Ambiance maussade et mystérieuse, fumée dense, style Blade Runner, éclairage cinématique, ombres profondes, couleurs contrastées (bleu froid et rose vif), photographie de rue, objectif anamorphique.",
        placeholder: "Ex: un détective privé...",
        isCustom: false,
    },
    {
        id: 'nature-bioluminescente',
        title: 'Nature Bioluminescente',
        template: "Une photographie de nature fantastique d'un [SUJET] dans une forêt extraterrestre la nuit. La flore et la faune environnantes émettent une lumière bioluminescente douce et éthérée (bleu, vert, violet). Des particules de poussière magiques flottent dans l'air. L'atmosphère est onirique et enchantée. Longue exposition, couleurs vibrantes, détails incroyables, style Avatar de James Cameron, ambiance mystique.",
        placeholder: "Ex: un cerf majestueux...",
        isCustom: false,
    },
    {
        id: 'art-gastronomique',
        title: 'Art Gastronomique',
        template: "Photographie culinaire de style haute gastronomie, un [SUJET] transformé en un dessert complexe et élégant. Le plat est présenté sur une assiette en ardoise, avec des garnitures délicates comme des fleurs comestibles, des gouttes de coulis et de la poussière d'or. L'éclairage est doux et directionnel pour accentuer les textures. Arrière-plan sombre et minimaliste, très faible profondeur de champ, hyper-détaillé, qualité magazine.",
        placeholder: "Ex: un volcan en éruption...",
        isCustom: false,
    },
    {
        id: 'art-du-papier',
        title: 'Art du Papier (Kirigami)',
        template: "Une œuvre d'art complexe entièrement réalisée en papier découpé (style kirigami). La scène représente un [SUJET] avec des détails incroyablement fins et des couches de papier superposées pour créer de la profondeur. La composition est centrée et symétrique, le tout dans une seule couleur de papier, posé sur un fond contrasté. Éclairage latéral pour créer des ombres longues et mettre en valeur les découpes, très détaillé, minimaliste, élégant.",
        placeholder: "Ex: un paysage de montagne...",
        isCustom: false,
    }
];

const DEFAULT_MODULE_ID = defaultInspirationModules.length > 0 ? defaultInspirationModules[0].id : '';

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
        } catch(e) {
            console.error(`Impossible de sauvegarder les items dans ${storageKey}:`, e);
        }
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
                if (newItems.length > 0) alert(`${newItems.length} module(s) importé(s) !`); else alert("Aucun nouveau module importé (les modules avec des titres déjà existants ont été ignorés).");
                return [...prev, ...newItems];
            });
        } catch (error: any) {
            alert(`Erreur: ${error.message || "Fichier invalide."}`);
        }
    }, []);

    const exportItems = useCallback((downloadName: string) => {
        if (items.length === 0) {
            alert("Il n'y a aucun module à exporter.");
            return;
        }
        const dataStr = JSON.stringify(items.map(({id, isCustom, ...rest}) => rest), null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        a.click();
        URL.revokeObjectURL(url);
    }, [items]);

    const mergeRemoteItems = useCallback((remoteItems: any[]) => {
        if (!Array.isArray(remoteItems)) return;
        setItems(prevItems => {
            const existingTitles = new Set(prevItems.map(item => item.title));
            const newItems = remoteItems
                .filter(remoteItem => remoteItem.title && !existingTitles.has(remoteItem.title))
                .map(remoteItem => ({
                    ...remoteItem,
                    id: crypto.randomUUID(),
                    isCustom: false,
                }));
            return [...prevItems, ...newItems];
        });
    }, []);

    return { items, addItem, deleteItem, importItems, exportItems, mergeRemoteItems };
};

interface VTexteProps {
    onUsageUpdate: (count: number) => void;
    onSendToEditor: (imageUrl: string) => void;
    onLoadComplete: (status: 'success' | 'error') => void;
}

const VTexte: React.FC<VTexteProps> = ({ onUsageUpdate, onSendToEditor, onLoadComplete }) => {
    const importModulesInputRef = useRef<HTMLInputElement>(null);
    const { items: modules, addItem: addModule, deleteItem: deleteModule, importItems: importModules, exportItems: exportModules, mergeRemoteItems } = useGenericItems('customInspirationModules', defaultInspirationModules);

    const [selectedModuleId, setSelectedModuleId] = useState(DEFAULT_MODULE_ID);
    const [moduleInput, setModuleInput] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    
    const [editableTemplate, setEditableTemplate] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [newModuleTemplate, setNewModuleTemplate] = useState('');
    const [newModuleError, setNewModuleError] = useState('');

    const [moduleToDelete, setModuleToDelete] = useState<any | null>(null);
    const [remoteModuleStatus, setRemoteModuleStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    
    useEffect(() => {
        const fetchRemoteModules = async () => {
            setRemoteModuleStatus('loading');
            try {
                const fileId = '1Poy99Tq3W4fNkcnlxof6wj4LM1bDa-Qa';
                const directDownloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(directDownloadUrl)}`;

                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
                }
                const remoteModules = await response.json();
                mergeRemoteItems(remoteModules);
                setRemoteModuleStatus('success');
                onLoadComplete('success');
            } catch (err) {
                console.error("Impossible de charger les modules V-TEXTE distants:", err);
                setRemoteModuleStatus('error');
                onLoadComplete('error');
            }
        };

        if (remoteModuleStatus === 'idle') {
            fetchRemoteModules();
        }
    }, [remoteModuleStatus, mergeRemoteItems, onLoadComplete]);

    useEffect(() => {
        const selectedExists = modules.some(m => m.id === selectedModuleId);
        if (!selectedExists) {
            setSelectedModuleId(modules.length > 0 ? modules[0].id : '');
        }
    }, [modules, selectedModuleId]);

    const activeModule = useMemo(() => modules.find(m => m.id === selectedModuleId), [selectedModuleId, modules]);
    
    useEffect(() => {
        if (activeModule) {
            setEditableTemplate(activeModule.template);
        } else {
            setEditableTemplate('');
        }
    }, [activeModule]);

    const finalPrompt = useMemo(() => {
        if (!activeModule) return '';
        return editableTemplate.replace(/\[SUJET\]/gi, moduleInput || '[SUJET]');
    }, [editableTemplate, moduleInput, activeModule]);

    const handleGenerate = useCallback(async () => {
        if (!finalPrompt || !moduleInput) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const imageUrls = await generateImage(finalPrompt, '', '1:1', 1);
            if (imageUrls.length > 0) {
                setGeneratedImage(imageUrls[0]);
                onUsageUpdate(1);
            } else throw new Error("L'API n'a retourné aucune image.");
        } catch (e: any) {
            setError(e.message || "Une erreur est survenue.");
        } finally {
            setIsLoading(false);
        }
    }, [finalPrompt, moduleInput, onUsageUpdate]);

    const handleSaveNewModule = () => {
        if (!newModuleTitle.trim()) { setNewModuleError('Le titre est requis.'); return; }
        if (!newModuleTemplate.trim().includes('[SUJET]')) { setNewModuleError("Le modèle doit contenir la variable [SUJET]."); return; }
        const newModule = addModule({ title: newModuleTitle.trim(), template: newModuleTemplate.trim(), placeholder: 'Votre texte ici...' });
        setSelectedModuleId(newModule.id);
        setIsAddModalOpen(false);
        setNewModuleTitle('');
        setNewModuleTemplate('');
        setNewModuleError('');
    };

    const handleDeleteClick = () => {
        if (activeModule?.isCustom) {
            setModuleToDelete(activeModule);
        }
    };

    const handleConfirmDelete = () => {
        if (moduleToDelete) {
            deleteModule(moduleToDelete.id);
            setModuleToDelete(null);
        }
    };
    
    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => importModules(event.target?.result as string);
            reader.readAsText(file);
            e.target.value = '';
        }
    };

    useEffect(() => {
        setModuleInput('');
        setGeneratedImage(null);
        setError(null);
    }, [selectedModuleId]);

    return (
        <div className="space-y-8">
            <input type="file" ref={importModulesInputRef} onChange={handleImportFile} className="hidden" accept=".json" />
            <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-sky-600 dark:text-sky-500 inline-flex items-center gap-2">
                    <span>V-TEXTE · Création par Modèle</span>
                     <HelpTooltip title="Comment utiliser V-TEXTE ?">
                       <p>Les modules sont des modèles de prompts avancés pour créer des images complexes et stylisées très facilement.</p>
                       <ol>
                           <li><strong>Choisissez un module</strong> dans la liste. Son modèle de prompt s'affichera.</li>
                           <li><strong>Remplissez le champ "Sujet"</strong> (ex: <code>un chat</code>) pour remplacer la variable <code>[SUJET]</code>.</li>
                           <li><strong>Visualisez et modifiez l'aperçu du prompt final</strong> pour voir et ajuster exactement ce que l'IA recevra.</li>
                           <li><strong>Cliquez sur "Générer"</strong> et admirez le résultat !</li>
                           <li><strong>Personnalisez :</strong> Créez vos propres modules avec ➕, importez-en ou exportez-les pour les partager.</li>
                       </ol>
                    </HelpTooltip>
                </h1>
                <p className="mt-2 text-lg text-bunker-600 dark:text-bunker-400">Utilisez des modèles de prompts pour générer des images au style unique.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 bg-bunker-100 dark:bg-bunker-900 p-6 rounded-xl shadow-lg flex flex-col gap-6">
                    <div>
                        <label htmlFor="module-select" className="flex items-center gap-2 text-lg font-bold mb-2">
                            <span>1. Choisissez un module</span>
                            {remoteModuleStatus === 'success' && <span className="text-green-500 font-bold text-sm">OK</span>}
                            {remoteModuleStatus === 'loading' && <span className="text-sm text-bunker-400 animate-pulse">Chargement...</span>}
                            {remoteModuleStatus === 'error' && <span title="Le chargement des modules distants a échoué" className="text-red-500 font-bold text-sm">Erreur</span>}
                        </label>
                        <div className="flex items-stretch gap-2">
                            <select id="module-select" value={selectedModuleId} onChange={(e) => setSelectedModuleId(e.target.value)} className="flex-grow w-full p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg focus:ring-2 focus:ring-sky-500">
                                {modules.length === 0 && <option value="">Créez ou importez un module...</option>}
                                {modules.map(m => <option key={m.id} value={m.id}>{m.isCustom ? '👤' : '⚙️'} {m.title}</option>)}
                            </select>
                            <button onClick={() => setIsAddModalOpen(true)} className="p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700" title="Ajouter"><PlusCircleIcon className="w-6 h-6"/></button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                             <button onClick={() => importModulesInputRef.current?.click()} className="flex-1 py-2 px-3 text-sm bg-bunker-200 dark:bg-bunker-800 rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700 flex items-center justify-center gap-2" title="Importer"><ArrowDownOnSquareIcon className="w-5 h-5"/> Importer</button>
                             <button onClick={() => exportModules('v-texte-modules.json')} className="flex-1 py-2 px-3 text-sm bg-bunker-200 dark:bg-bunker-800 rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700 flex items-center justify-center gap-2" title="Exporter"><ArrowUpOnSquareIcon className="w-5 h-5"/> Exporter</button>
                             <button onClick={handleDeleteClick} disabled={!activeModule?.isCustom} className="flex-1 py-2 px-3 text-sm bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2" title="Supprimer"><TrashIcon className="w-5 h-5" /> Supprimer</button>
                        </div>
                    </div>

                    {activeModule && (
                        <>
                            <div>
                                <label htmlFor="module-input" className="block text-lg font-bold mb-2">2. Définissez votre sujet</label>
                                <input id="module-input" type="text" value={moduleInput} onChange={(e) => setModuleInput(e.target.value)} placeholder={activeModule.placeholder} className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg focus:ring-2 focus:ring-sky-500"/>
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
                             <button onClick={handleGenerate} disabled={!moduleInput || !finalPrompt || isLoading} className="w-full py-3 bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-sky-700 disabled:bg-bunker-400 disabled:cursor-not-allowed transition-transform duration-200 transform hover:scale-105 shadow-lg">
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
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsPreviewOpen(true)}
                                aria-label="Agrandir l'image"
                            >
                                <img src={generatedImage} alt={`Génération pour ${moduleInput}`} className="w-full h-full object-contain rounded-lg shadow-md" />
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                                    <MagnifyingGlassIcon className="w-12 h-12 text-white" />
                                </div>
                            </div>
                        )}
                        {!isLoading && !error && !generatedImage && <p className="text-bunker-500 dark:text-bunker-400 p-4 text-center">Le résultat de votre création apparaîtra ici.</p>}
                    </div>
                </div>
            </div>

            {generatedImage && (
                <ImagePreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    imageUrl={generatedImage}
                    onSendToEditor={onSendToEditor}
                />
            )}

            <ConfirmationModal
                isOpen={!!moduleToDelete}
                onClose={() => setModuleToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirmer la suppression"
            >
                <p>Voulez-vous vraiment supprimer le module suivant ?</p>
                <p className="my-3 p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg text-center font-semibold text-sky-600 dark:text-sky-400">
                    {moduleToDelete?.title}
                </p>
                <p>Cette action est irréversible.</p>
            </ConfirmationModal>

            {isAddModalOpen && (
                 <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setIsAddModalOpen(false)}>
                    <div className="bg-bunker-100 dark:bg-bunker-900 rounded-xl p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold">Ajouter un nouveau module</h3>
                        <div>
                            <label htmlFor="new-module-title" className="font-semibold mb-2 block">Titre</label>
                            <input id="new-module-title" type="text" value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} placeholder="Ex: Style Aquarelle" className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg"/>
                        </div>
                        <div>
                            <label htmlFor="new-module-template" className="font-semibold mb-2 block">Modèle (doit inclure <strong className="text-sky-500">[SUJET]</strong>)</label>
                            <textarea id="new-module-template" value={newModuleTemplate} onChange={(e) => setNewModuleTemplate(e.target.value)} placeholder="Ex: Une aquarelle douce de [SUJET]..." className="w-full h-32 p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg" />
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

export default VTexte;