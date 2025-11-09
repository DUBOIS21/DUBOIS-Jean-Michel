import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateImage, enhancePrompt } from '../services/geminiService';
import { AspectRatio, HistoryEntry } from '../types';
import { SparklesIcon, TrashIcon, ArrowDownOnSquareIcon, ArrowUpOnSquareIcon, MagnifyingGlassIcon, XMarkIcon, PhotoIcon, ArrowPathIcon, ArchiveBoxIcon } from './Icons';
import HelpTooltip from './HelpTooltip';
import ImagePreviewModal from './ImagePreviewModal';
import ConfirmationModal from './ConfirmationModal';
import { resizeImage, saveHistorySafely } from '../hooks/useVHistory';

const aspectRatios: AspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4"];
const MAX_INFLUENCE_IMAGES = 3;

interface ExamplesProps {
    onSendToEditor: (imageUrl: string) => void;
    dailyUsage: number;
    limit: number;
    onUsageUpdate: (count: number) => void;
    onLoadComplete: (status: 'success' | 'error') => void;
}

const defaultHistory: HistoryEntry[] = [
  {
    "id": "e215f7b4-0b19-4b2a-a701-0428d052a975",
    "timestamp": 1720188806950,
    "prompt": "Un renard roux de style dessin animé lisant un livre dans une bibliothèque confortable, lumière chaude, très détaillé",
    "negativePrompt": "",
    "aspectRatio": "1:1",
    "inputImageUrls": [],
    "imageUrls": [
      "https://storage.googleapis.com/aistudio-hosting.appspot.com/history/images/e6f9661f-9989-4e08-912f-8700a45558d1.jpeg"
    ],
    "numberOfImages": 1
  },
  {
    "id": "c86915b2-3e4b-4896-857c-d380e927515e",
    "timestamp": 1720188673740,
    "prompt": "Un astronaute surfant sur une vague cosmique, nébuleuse colorée en arrière-plan, style art numérique, épique",
    "negativePrompt": "",
    "aspectRatio": "16:9",
    "inputImageUrls": [],
    "imageUrls": [
      "https://storage.googleapis.com/aistudio-hosting.appspot.com/history/images/2704337b-0444-48f8-b4b6-71d50a2debb6.jpeg"
    ],
    "numberOfImages": 1
  },
  {
    "id": "f5f13459-7095-46e3-9828-e4b52478d108",
    "timestamp": 1720188583486,
    "prompt": "Portrait d'une femme guerrière avec des peintures faciales tribales, éclairage dramatique, hyperréaliste, fantasy",
    "negativePrompt": "",
    "aspectRatio": "3:4",
    "inputImageUrls": [],
    "imageUrls": [
      "https://storage.googleapis.com/aistudio-hosting.appspot.com/history/images/df8749a4-3783-4a0b-9993-9d41d7d07c39.jpeg"
    ],
    "numberOfImages": 1
  },
  {
    "id": "a984084f-e274-4b5a-a316-f6d2f9547b74",
    "timestamp": 1720188448512,
    "prompt": "Un robot jouant aux échecs contre un écureuil dans un parc, style peinture à l'huile, fantaisiste",
    "negativePrompt": "",
    "aspectRatio": "4:3",
    "inputImageUrls": [],
    "imageUrls": [
      "https://storage.googleapis.com/aistudio-hosting.appspot.com/history/images/dd0f42b3-7647-4950-8b01-a47732a3962d.jpeg"
    ],
    "numberOfImages": 1
  }
];


const Examples: React.FC<ExamplesProps> = ({ onSendToEditor, dailyUsage, limit, onUsageUpdate, onLoadComplete }) => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [influenceImages, setInfluenceImages] = useState<(string | null)[]>(Array(MAX_INFLUENCE_IMAGES).fill(null));
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);
    const [entryToDelete, setEntryToDelete] = useState<HistoryEntry | null>(null);

    const [archiveSuccess, setArchiveSuccess] = useState(false);
    const [archiveMessage, setArchiveMessage] = useState('Archiver le Résultat');

    const importInputRef = useRef<HTMLInputElement>(null);
    const uploadInputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const hasInfluenceImages = influenceImages.some(img => img !== null);

    useEffect(() => {
        const loadHistory = () => {
            try {
                const savedHistory = localStorage.getItem('examplesHistory');
                if (savedHistory) {
                    setHistory(JSON.parse(savedHistory));
                } else {
                    setHistory(defaultHistory);
                    saveHistorySafely<HistoryEntry>('examplesHistory', defaultHistory);
                }
                onLoadComplete('success');
            } catch (e) {
                console.error("Impossible de charger l'historique des exemples:", e);
                onLoadComplete('error');
            }
        };

        loadHistory();
    }, [onLoadComplete]);

    const handleGenerate = useCallback(async () => {
        if (!prompt || isLoading || dailyUsage >= limit) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        const validInfluenceImages = influenceImages.filter((img): img is string => img !== null);

        try {
            const imageUrls = await generateImage(prompt, '', aspectRatio, 1, validInfluenceImages.length > 0 ? validInfluenceImages : null);
            if (imageUrls && imageUrls.length > 0) {
                const newImage = imageUrls[0];
                setGeneratedImage(newImage);
                onUsageUpdate(1);
            } else {
                throw new Error("L'API n'a retourné aucune image.");
            }
        } catch (e: any) {
            setError(e.message || "Une erreur inconnue est survenue.");
            // Si l'erreur est une erreur de quota, synchronisez la jauge de l'interface utilisateur avec la limite
            if ((e as any).isQuotaError) {
                if (dailyUsage < limit) {
                    onUsageUpdate(limit - dailyUsage);
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, [prompt, aspectRatio, influenceImages, isLoading, dailyUsage, limit, onUsageUpdate]);

    const handleArchiveResult = useCallback(async () => {
        if (!generatedImage || !prompt) return;
    
        setArchiveMessage('Archivage...');
        setArchiveSuccess(false);
        setError(null);
    
        const imageUrlForHistory = await resizeImage(generatedImage);
    
        const validInfluenceImages = influenceImages.filter((img): img is string => img !== null);
        const resizedInfluenceImages = await Promise.all(validInfluenceImages.map(url => resizeImage(url)));

        const newEntry: HistoryEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            prompt,
            negativePrompt: '',
            aspectRatio,
            inputImageUrls: resizedInfluenceImages,
            imageUrls: [imageUrlForHistory],
            numberOfImages: 1,
        };
    
        // Check for duplicates in BOTH histories before updating
        const isDuplicateInExamples = history.some(entry => entry.imageUrls && entry.imageUrls[0] === newEntry.imageUrls![0]);
        
        let mainHistory: HistoryEntry[] = [];
        try {
            const mainHistoryRaw = localStorage.getItem('generationHistory');
            mainHistory = mainHistoryRaw ? JSON.parse(mainHistoryRaw) : [];
        } catch (e) {
            console.error("Impossible de lire l'historique principal", e);
        }
        const isDuplicateInMain = mainHistory.some(entry => entry.imageUrls && entry.imageUrls[0] === newEntry.imageUrls![0]);
    
        if (isDuplicateInExamples && isDuplicateInMain) {
            setArchiveMessage('Déjà archivé !');
            setArchiveSuccess(true);
            setTimeout(() => { setArchiveSuccess(false); setArchiveMessage('Archiver le Résultat'); }, 2000);
            return;
        }
    
        // Update Examples History (this component's state)
        if (!isDuplicateInExamples) {
            setHistory(prevHistory => {
                const updatedHistory = [newEntry, ...prevHistory].slice(0, 50);
                return saveHistorySafely<HistoryEntry>('examplesHistory', updatedHistory) ?? prevHistory;
            });
        }
    
        // Update Main Generator History (in localStorage)
        if (!isDuplicateInMain) {
            const updatedMainHistory = [newEntry, ...mainHistory].slice(0, 20);
            const saved = saveHistorySafely<HistoryEntry>('generationHistory', updatedMainHistory);
            if (saved === null) {
                console.error("Impossible d'enregistrer dans l'historique principal (quota dépassé).");
                setError("L'archivage dans l'historique principal a échoué (stockage plein).");
            }
        }
    
        setArchiveMessage('Archivé !');
        setArchiveSuccess(true);
        setTimeout(() => {
            setArchiveSuccess(false);
            setArchiveMessage('Archiver le Résultat');
        }, 2000);
    
    }, [generatedImage, prompt, aspectRatio, influenceImages, history]);

    const handleEnhancePrompt = useCallback(async () => {
        if (!prompt || isEnhancing) return;
        setIsEnhancing(true);
        setError(null);
        try {
            const enhanced = await enhancePrompt(prompt);
            setPrompt(enhanced);
        } catch (e: any) {
            setError(e.message || "Erreur lors de l'amélioration du prompt.");
        } finally {
            setIsEnhancing(false);
        }
    }, [prompt, isEnhancing]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setInfluenceImages(prev => {
                    const newImages = [...prev];
                    newImages[index] = reader.result as string;
                    return newImages;
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const removeInfluenceImage = (index: number) => {
        setInfluenceImages(prev => {
            const newImages = [...prev];
            newImages[index] = null;
            return newImages;
        });
    };
    
    const handleReset = () => {
        setPrompt('');
        setInfluenceImages(Array(MAX_INFLUENCE_IMAGES).fill(null));
        setGeneratedImage(null);
        setError(null);
        setAspectRatio('1:1');
    };

    const handleReuse = (entry: HistoryEntry) => {
        setPrompt(entry.prompt);
        setAspectRatio(entry.aspectRatio);
        const paddedImages = [...(entry.inputImageUrls || [])];
        while (paddedImages.length < MAX_INFLUENCE_IMAGES) {
            paddedImages.push(null);
        }
        setInfluenceImages(paddedImages);
        setGeneratedImage(entry.imageUrls ? entry.imageUrls[0] : null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string) => {
        const updated = history.filter(entry => entry.id !== id);
        const finalHistory = saveHistorySafely<HistoryEntry>('examplesHistory', updated);
        if (finalHistory !== null) {
            setHistory(finalHistory);
        }
        setEntryToDelete(null);
    };

    const handleClearHistory = () => {
        const finalHistory = saveHistorySafely<HistoryEntry>('examplesHistory', []);
        if(finalHistory !== null) {
            setHistory(finalHistory);
        }
        setIsConfirmingClear(false);
    };
    
    const handleExportHistory = () => {
        if (history.length === 0) return;
        const dataStr = JSON.stringify(history, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'studio-creatif-ia-exemples-historique.json';
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target?.result as string);
                if (Array.isArray(imported)) {
                    setHistory(prevHistory => {
                         const existingIds = new Set(prevHistory.map(entry => entry.id));
                         const newEntries = imported.filter((entry: HistoryEntry) => !existingIds.has(entry.id));
                         const merged = [...newEntries, ...prevHistory]
                            .sort((a, b) => b.timestamp - a.timestamp)
                            .slice(0, 50);
                         const finalHistory = saveHistorySafely<HistoryEntry>('examplesHistory', merged);
                         return finalHistory !== null ? finalHistory : prevHistory;
                    });
                }
            } catch (error) { console.error("Erreur d'importation:", error); }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return (
        <div className="space-y-8">
             <style>{`
                @keyframes pulse-once {
                    0% { opacity: 0; }
                    50% { opacity: 1; }
                    100% { opacity: 0; }
                }
                .animate-pulse-once {
                    animation: pulse-once 1s ease-in-out forwards;
                }
            `}</style>
            <div className="bg-bunker-100 dark:bg-bunker-900 p-4 sm:p-6 rounded-xl shadow-lg border border-bunker-200 dark:border-bunker-800">
                <h2 className="text-2xl font-bold mb-4 text-bunker-800 dark:text-bunker-200 flex items-center gap-2">
                    <span>1. Zone de Création Active</span>
                     <HelpTooltip title="Comment utiliser les Exemples ?">
                        <ol>
                            <li><b>Prompt :</b> Décrivez votre image.</li>
                            <li><b>Améliorer (optionnel) :</b> Cliquez sur ✨ pour que l'IA enrichisse votre prompt.</li>
                            <li><b>Images d'influence (optionnel) :</b> Ajoutez jusqu'à 3 images pour guider le style ou le contenu.</li>
                            <li><b>Format :</b> Choisissez le format de sortie.</li>
                            <li><b>Générer :</b> Lancez la création.</li>
                            <li><b>Archiver :</b> Si le résultat vous plaît, cliquez sur "Archiver le Résultat" pour le sauvegarder dans l'historique de cet onglet ET dans celui du "Générateur".</li>
                        </ol>
                    </HelpTooltip>
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="prompt-input" className="font-semibold text-bunker-800 dark:text-bunker-200">Prompt IA</label>
                                <button onClick={handleEnhancePrompt} disabled={isEnhancing || !prompt} className="flex items-center gap-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors disabled:opacity-50">
                                    {isEnhancing ? <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin"></div> : '✨'}
                                    <span>Améliorer le Prompt</span>
                                </button>
                            </div>
                            <textarea id="prompt-input" value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg border border-bunker-300 dark:border-bunker-700 focus:ring-2 focus:ring-sky-500 transition"/>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-3 text-bunker-800 dark:text-bunker-200">Images d'Influence (Max {MAX_INFLUENCE_IMAGES})</h3>
                            <div className="grid grid-cols-3 gap-4">
                                {Array.from({ length: MAX_INFLUENCE_IMAGES }).map((_, i) => (
                                    <div key={i}>
                                        <input type="file" ref={el => uploadInputRefs.current[i] = el} onChange={(e) => handleImageUpload(e, i)} className="hidden" accept="image/*" />
                                        <div className="w-full aspect-square bg-bunker-200 dark:bg-bunker-800 rounded-lg flex items-center justify-center relative border-2 border-dashed border-bunker-300 dark:border-bunker-700">
                                            {influenceImages[i] ? (
                                                <>
                                                    <img src={influenceImages[i] as string} alt={`Influence ${i+1}`} className="w-full h-full object-cover rounded-md" />
                                                    <button onClick={() => removeInfluenceImage(i)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"><XMarkIcon className="w-4 h-4"/></button>
                                                </>
                                            ) : (
                                                <button onClick={() => uploadInputRefs.current[i]?.click()} className="w-full h-full flex flex-col items-center justify-center text-bunker-500 dark:text-bunker-400 hover:bg-bunker-300 dark:hover:bg-bunker-700 transition">
                                                    <PhotoIcon className="w-8 h-8"/>
                                                    <span className="text-xs mt-1">Image {i+1}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div>
                            <label className="font-semibold text-bunker-800 dark:text-bunker-200">Format de sortie</label>
                            <div className={`flex flex-wrap gap-2 mt-2 ${hasInfluenceImages ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {aspectRatios.map(ar => (
                                    <button
                                        key={ar}
                                        onClick={() => setAspectRatio(ar)}
                                        disabled={hasInfluenceImages}
                                        className={`py-2 px-3 rounded-lg text-sm transition-colors flex-1 ${aspectRatio === ar ? 'bg-sky-600 text-white font-bold' : 'bg-bunker-200 dark:bg-bunker-800 hover:bg-bunker-300 dark:hover:bg-bunker-700'}`}
                                    >
                                        {ar}
                                    </button>
                                ))}
                            </div>
                            {hasInfluenceImages && (
                                <p className="text-xs text-bunker-500 dark:text-bunker-400 mt-2">
                                    Le format est déterminé par l'IA lors de l'utilisation d'images d'influence.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <h3 className="font-semibold mb-3 text-bunker-800 dark:text-bunker-200">Image Résultante</h3>
                        <div className="w-full aspect-square bg-bunker-200 dark:bg-bunker-800 rounded-xl shadow-inner flex items-center justify-center p-2">
                            {isLoading && <div className="w-10 h-10 border-4 border-t-transparent border-sky-500 rounded-full animate-spin"></div>}
                            {error && <p className="text-red-500 text-center p-4">{error}</p>}
                            {generatedImage && !isLoading && (
                                <img src={generatedImage} alt="Résultat" onClick={() => setIsPreviewOpen(true)} className="max-w-full max-h-full object-contain rounded-lg cursor-pointer"/>
                            )}
                            {!generatedImage && !isLoading && !error && <p className="text-bunker-500 text-center text-sm">Le résultat apparaîtra ici.</p>}
                        </div>
                    </div>
                </div>
                 <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-bunker-200 dark:border-bunker-800">
                    <button onClick={handleGenerate} disabled={isLoading || !prompt || dailyUsage >= limit} className="flex-1 py-3 bg-bunker-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-bunker-600 disabled:bg-bunker-400">
                        {isLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <SparklesIcon className="w-6 h-6"/>}
                        <span>Générer</span>
                    </button>
                     <button onClick={handleArchiveResult} disabled={!generatedImage || isLoading || !prompt} className="flex-1 py-3 bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-sky-700 disabled:bg-bunker-400 dark:disabled:bg-bunker-600 relative overflow-hidden transition-colors">
                        <ArchiveBoxIcon className="w-6 h-6"/>
                        <span>{archiveMessage}</span>
                        {archiveSuccess && <div className="absolute inset-0 bg-white/20 animate-pulse-once rounded-lg"></div>}
                    </button>
                    <button onClick={handleReset} className="flex-1 py-3 bg-bunker-500 text-white font-semibold rounded-lg hover:bg-bunker-600">
                        Réinitialiser
                    </button>
                </div>
            </div>

            <div className="bg-bunker-100 dark:bg-bunker-900 p-4 sm:p-6 rounded-xl shadow-lg border border-bunker-200 dark:border-bunker-800">
                <h2 className="text-2xl font-bold text-bunker-800 dark:text-bunker-200 mb-4">2. Archive et Historique</h2>
                <div className="flex flex-wrap gap-4 mb-6 p-4 bg-bunker-50 dark:bg-bunker-950/50 rounded-lg border dark:border-bunker-800">
                    <button onClick={handleExportHistory} className="flex-grow sm:flex-grow-0 px-4 py-2 text-sm bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Exporter</button>
                    <input type="file" ref={importInputRef} onChange={handleImportFile} className="hidden" accept=".json"/>
                    <button onClick={() => importInputRef.current?.click()} className="flex-grow sm:flex-grow-0 px-4 py-2 text-sm bg-yellow-400 text-bunker-900 font-semibold rounded-lg hover:bg-yellow-500">Importer</button>
                    <button onClick={() => setIsConfirmingClear(true)} className="flex-grow sm:flex-grow-0 px-4 py-2 text-sm bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Vider l'historique</button>
                </div>
                <div className="space-y-3 max-h-[40rem] overflow-y-auto pr-2">
                    {history.length === 0 ? <p className="text-center text-bunker-500 py-4">L'historique est vide.</p> :
                     history.map(entry => (
                        <div key={entry.id} className="bg-bunker-200 dark:bg-bunker-800 p-3 rounded-lg flex items-center gap-4">
                            <img src={entry.imageUrls?.[0]} onClick={() => { setGeneratedImage(entry.imageUrls?.[0] || null); setIsPreviewOpen(true); }} alt="aperçu" className="w-16 h-16 object-cover rounded-md cursor-pointer flex-shrink-0"/>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm truncate font-semibold" title={entry.prompt}>{entry.prompt}</p>
                                <p className="text-xs text-bunker-500 dark:text-bunker-400">{new Date(entry.timestamp).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-1">
                                <button onClick={() => handleReuse(entry)} title="Réutiliser" className="p-2 rounded-full text-bunker-600 dark:text-bunker-300 hover:bg-bunker-300 dark:hover:bg-bunker-700 transition"><ArrowPathIcon className="w-5 h-5"/></button>
                                <button onClick={() => setEntryToDelete(entry)} title="Supprimer" className="p-2 rounded-full text-red-500 hover:bg-red-500/10 transition"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                     ))}
                </div>
            </div>

            {generatedImage && <ImagePreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} imageUrl={generatedImage} onSendToEditor={onSendToEditor}/>}
            <ConfirmationModal isOpen={isConfirmingClear} onClose={() => setIsConfirmingClear(false)} onConfirm={handleClearHistory} title="Vider tout l'historique ?">
                <p>Cette action est irréversible.</p>
            </ConfirmationModal>
            <ConfirmationModal isOpen={!!entryToDelete} onClose={() => setEntryToDelete(null)} onConfirm={() => handleDelete(entryToDelete!.id)} title="Supprimer cette archive ?">
                <p>Cette action est irréversible.</p>
            </ConfirmationModal>
        </div>
    );
};

export default Examples;