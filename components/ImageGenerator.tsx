
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateImage } from '../services/geminiService';
import { AspectRatio, HistoryEntry } from '../types';
import { SparklesIcon, TrashIcon, DiceIcon, ArrowRightIcon, DownloadIcon, ArrowUpOnSquareIcon, ArrowDownOnSquareIcon, MagnifyingGlassIcon, XMarkIcon, ChevronDownIcon, PhotoIcon, ArrowPathIcon } from './Icons';
import HelpTooltip from './HelpTooltip';
import ImagePreviewModal from './ImagePreviewModal';
import ConfirmationModal from './ConfirmationModal';
import { resizeImage, saveHistorySafely } from '../hooks/useVHistory';


const DEFAULT_NEGATIVE_PROMPT = '';

const models = [
    {
        label: "🎨 Mouvements Artistiques",
        options: [
            "Abstrait",
            "Impressionniste",
            "Minimaliste",
            "Peinture (classique, moderne)",
            "Surréaliste",
        ]
    },
    {
        label: "🖌️ Techniques & Médiums",
        options: [
            "Aquarelle / Peinture à l'huile / Crayons",
            "Dessin au trait (Line Art)",
            "Gravure sur bois / Linogravure",
            "Papier Plié / Origami",
        ]
    },
    {
        label: "✏️ Illustration & Dessin",
        options: [
            "Bande Dessinée (BD) / Comics",
            "Cartoon",
            "Illustration",
            "Manga / Anime",
        ]
    },
    {
        label: "💻 Styles Numériques",
        options: [
            "Art numérique / Low Poly",
            "Pixel Art",
            "Vecteur",
        ]
    },
    {
        label: "📷 Photographie",
        options: [
            "Hyper-réaliste / Photo-réaliste",
            "Photographie de portrait",
            "Photographie de voyage",
            "Vintage / Rétro",
        ]
    },
    {
        label: "🌟 Thèmes & Genres",
        options: [
            "Futuriste",
            "Paysage fantastique",
            "Paysage urbain",
            "Post-apocalyptique",
        ]
    }
];

const preFilledPrompts = {
    "Paysages fantastiques": "Un paysage de montagne à couper le souffle avec des cascades flottantes et des cristaux lumineux, style art numérique, très détaillé, concept art.",
    "Portraits futuristes": "Portrait d'un cyborg avec des yeux néon et des détails chromés, éclairage cinématique, science-fiction, hyperréaliste.",
    "Art abstrait": "Une explosion de couleurs vives et de formes géométriques, peinture acrylique, dynamique et énergique.",
    "Animaux mignons": "Un petit renard roux endormi dans une forêt moussue, lumière douce du matin, photographie macro, adorable.",
    "Chat Steampunk": "Un chat steampunk avec des lunettes de protection et des engrenages en cuivre, assis sur une pile de vieux livres.",
    "Ville sous-marine": "Une ville sous-marine bioluminescente avec des bâtiments en forme de coquillages et des poissons lumineux comme véhicules.",
    "Forêt enchantée": "Une forêt enchantée la nuit, avec des champignons qui brillent d'une lumière douce et des fées qui volent.",
    "Jardinier de l'espace": "Un robot jardinier s'occupant de plantes exotiques sur une station spatiale, avec la Terre visible par la fenêtre.",
    "Marché médiéval fantastique": "Un marché médiéval animé avec des dragons perchés sur les toits des étals.",
    "Planète dessert": "Un dessert gastronomique qui ressemble à une planète miniature, avec des anneaux de sucre et des lunes en chocolat blanc.",
    "Bibliothèque infinie": "Une bibliothèque infinie où les étagères se tordent et défient la gravité, style M.C. Escher.",
    "Samouraï Cybernétique": "Un guerrier samouraï cybernétique méditant sous un cerisier en fleurs holographique.",
    "Montgolfière méduse": "Une montgolfière en forme de méduse flottant au-dessus d'un paysage de nuages au coucher du soleil.",
    "Détective Néo-Tokyo": "Un détective film noir dans une ruelle pluvieuse de Tokyo, éclairée par des néons.",
    "Créature mythique": "Une créature majestueuse, mi-cerf mi-hibou, se tenant dans une clairière baignée de clair de lune.",
    "Voiture volante vintage": "Une voiture de course vintage modifiée pour voler à travers un canyon désertique.",
    "Reine égyptienne futuriste": "Un portrait d'une reine égyptienne antique avec des tatouages de circuits imprimés lumineux sur son visage.",
    "Serre abandonnée": "Une serre abandonnée envahie par une végétation luxuriante et des fleurs étranges et colorées.",
    "Ruines sur Mars": "Un astronaute découvrant une ancienne ruine extraterrestre sur Mars.",
    "Café parisien hanté": "Un café parisien confortable avec des fantômes spectraux sirotant leur café.",
    "Golem de cristal": "Un golem de cristal massif gardant l'entrée d'une grotte cachée.",
    "Château flottant": "Une île flottante avec un château de style gothique et des cascades tombant dans le vide.",
    "Chaman nordique": "Un chaman nordique invoquant un esprit de loup fait d'aurores boréales.",
    "Œil de dragon": "Un plan rapproché d'un œil de dragon, reflétant une bataille épique.",
    "Paysage de bonbons": "Un train à vapeur traversant un paysage de bonbons et de rivières de chocolat.",
    "Musicien de jazz magique": "Un musicien de jazz jouant du saxophone, dont les notes se transforment en oiseaux colorés.",
    "Ville dans un flocon de neige": "Une vue microscopique d'un flocon de neige, révélant une ville complexe à l'intérieur.",
    "Chevalier galactique": "Un chevalier en armure polie chevauchant une licorne à travers une galaxie nébuleuse.",
    "Atelier du sorcier": "Un vieux sorcier dans son atelier, entouré de potions bouillonnantes et de grimoires flottants.",
    "Plage de sable noir": "Une plage tropicale avec du sable noir et une eau phosphorescente la nuit.",
};

const aspectRatios: AspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4"];

const predefinedStyles = ['Rétro futuriste', 'Cyberpunk', 'Peinture à l\'huile', 'Aquarelle', 'Noir et blanc'];

interface ImageGeneratorProps {
    onSendToEditor: (imageUrl: string) => void;
    dailyUsage: number;
    limit: number;
    onUsageUpdate: (count: number) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onSendToEditor, dailyUsage, limit, onUsageUpdate }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [negativePrompt, setNegativePrompt] = useState<string>(DEFAULT_NEGATIVE_PROMPT);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio | null>('1:1');
    const [customWidth, setCustomWidth] = useState<string>('');
    const [customHeight, setCustomHeight] = useState<string>('');
    const [modelStyle, setModelStyle] = useState<string>('');
    const [seed, setSeed] = useState<string>('');
    const [generatedImages, setGeneratedImages] = useState<string[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [activeImageUrlForModal, setActiveImageUrlForModal] = useState<string | null>(null);
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);
    const [isConfirmingDeleteSelected, setIsConfirmingDeleteSelected] = useState(false);
    const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<string>>(new Set());
    const [inputImages, setInputImages] = useState<File[]>([]);
    const [inputImageUrls, setInputImageUrls] = useState<string[]>([]);
    const [numberOfImages, setNumberOfImages] = useState<number>(1);
    const importInputRef = useRef<HTMLInputElement>(null);
    const uploadInputRef = useRef<HTMLInputElement>(null);
    const [examplesHistory, setExamplesHistory] = useState<HistoryEntry[]>([]);
    const [selectedExampleId, setSelectedExampleId] = useState<string>('');

    const MAX_INSPIRATION_IMAGES = 3;

    const updateExamplesHistory = useCallback(() => {
        try {
            const savedHistory = localStorage.getItem('examplesHistory');
            if (savedHistory) {
                setExamplesHistory(JSON.parse(savedHistory));
            }
        } catch (e) {
            console.error("Impossible de charger l'historique des exemples:", e);
        }
    }, []);

    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('generationHistory');
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
            const savedSettings = localStorage.getItem('generationSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                if (settings.seed) setSeed(String(settings.seed));
            }
        } catch (e) {
            console.error("Impossible de charger l'historique ou les paramètres:", e);
        }
        updateExamplesHistory();
    }, [updateExamplesHistory]);
    
    useEffect(() => {
        try {
            localStorage.setItem('generationSettings', JSON.stringify({ seed }));
        } catch (e) {
            console.error("Impossible de sauvegarder les paramètres de génération:", e);
        }
    }, [seed]);

    const addToHistory = useCallback(async (entry: Omit<HistoryEntry, 'id' | 'timestamp'>, imageUrls: string[]) => {
        const resizedImageUrls = await Promise.all(imageUrls.map(url => resizeImage(url)));
        const resizedInputImageUrls = entry.inputImageUrls ? await Promise.all(entry.inputImageUrls.map(url => resizeImage(url))) : [];

        setHistory(prevHistory => {
            const newEntry: HistoryEntry = {
                ...entry,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                imageUrls: resizedImageUrls,
                inputImageUrls: resizedInputImageUrls,
            };
            const updatedHistory = [newEntry, ...prevHistory].slice(0, 20);
            
            const finalHistory = saveHistorySafely<HistoryEntry>('generationHistory', updatedHistory);
            
            if (finalHistory !== null) {
                return finalHistory;
            }
            setError("Une erreur est survenue lors de la sauvegarde de l'historique. Le stockage local est peut-être plein.");
            return prevHistory;
        });
    }, []);
    
    const deleteFromHistory = useCallback((idToDelete: string) => {
        setHistory(prevHistory => {
            const updatedHistory = prevHistory.filter(entry => entry.id !== idToDelete);
            const finalHistory = saveHistorySafely<HistoryEntry>('generationHistory', updatedHistory);

            if (finalHistory !== null) {
                return finalHistory;
            }
            return prevHistory;
        });
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!prompt || isLoading || dailyUsage >= limit) return;

        let finalAspectRatio: AspectRatio | null = aspectRatio;

        if (!finalAspectRatio) {
            const width = parseInt(customWidth, 10);
            const height = parseInt(customHeight, 10);

            if (width > 0 && height > 0) {
                const ratio = width / height;
                const ratios: { name: AspectRatio; value: number }[] = [
                    { name: '1:1', value: 1 },
                    { name: '16:9', value: 16 / 9 },
                    { name: '9:16', value: 9 / 16 },
                    { name: '4:3', value: 4 / 3 },
                    { name: '3:4', value: 3 / 4 },
                ];

                finalAspectRatio = ratios.reduce((prev, curr) =>
                    Math.abs(curr.value - ratio) < Math.abs(prev.value - ratio) ? curr : prev
                ).name;

            } else {
                setError("Veuillez sélectionner un format ou entrer des dimensions valides.");
                return;
            }
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImages(null);

        const finalPrompt = modelStyle ? `${prompt}, style ${modelStyle}` : prompt;
        const numericSeed = seed ? parseInt(seed, 10) : undefined;

        try {
            const imagesToGenerate = inputImageUrls.length > 0 ? 1 : numberOfImages;
            const imageUrls = await generateImage(finalPrompt, negativePrompt, finalAspectRatio, imagesToGenerate, inputImageUrls, numericSeed);
            setGeneratedImages(imageUrls);
            addToHistory({ prompt, negativePrompt, aspectRatio: finalAspectRatio, modelStyle, inputImageUrls, numberOfImages: imagesToGenerate, seed: numericSeed }, imageUrls);
            onUsageUpdate(imagesToGenerate);
        } catch (e: any) {
            setError(e.message || "Une erreur inconnue est survenue.");
            // If the error is a quota error, sync the UI gauge to the limit
            if (e.isQuotaError) {
                if (dailyUsage < limit) {
                    onUsageUpdate(limit - dailyUsage);
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, [prompt, negativePrompt, aspectRatio, customWidth, customHeight, isLoading, modelStyle, seed, inputImageUrls, numberOfImages, dailyUsage, limit, onUsageUpdate, addToHistory]);
    
    const handleReset = useCallback(() => {
        setPrompt('');
        setNegativePrompt(DEFAULT_NEGATIVE_PROMPT);
        setAspectRatio('1:1');
        setCustomWidth('');
        setCustomHeight('');
        setModelStyle('');
        setSeed('');
        setGeneratedImages(null);
        setError(null);
        setInputImages([]);
        setInputImageUrls([]);
        setNumberOfImages(1);
        setSelectedExampleId('');
        if (uploadInputRef.current) {
            uploadInputRef.current.value = '';
        }

        const modelStyleSelect = document.getElementById('model-style') as HTMLSelectElement;
        if (modelStyleSelect) modelStyleSelect.selectedIndex = 0;
    }, []);

    const loadFromHistory = (entry: HistoryEntry) => {
        setPrompt(entry.prompt);
        setNegativePrompt(entry.negativePrompt);
        setAspectRatio(entry.aspectRatio);
        setCustomWidth('');
        setCustomHeight('');
        setModelStyle(entry.modelStyle || '');
        setSeed(entry.seed ? String(entry.seed) : '');
        setGeneratedImages(entry.imageUrls || null);
        setInputImageUrls(entry.inputImageUrls || []);
        setNumberOfImages(entry.numberOfImages || 1);
        setInputImages([]);
    };
    
    const clearHistory = useCallback(() => {
        const clearedHistory = saveHistorySafely<HistoryEntry>('generationHistory', []);
        if (clearedHistory !== null) {
            setHistory(clearedHistory);
        }
        setIsConfirmingClear(false);
    }, []);

    const handleConfirmClear = useCallback(() => {
        clearHistory();
    }, [clearHistory]);

    const handleRandomPrompt = useCallback(() => {
        const prompts = Object.values(preFilledPrompts);
        const randomIndex = Math.floor(Math.random() * prompts.length);
        const randomPrompt = prompts[randomIndex];
        setPrompt(randomPrompt);
    }, []);

    const handleRandomSeed = useCallback(() => {
        const randomSeed = Math.floor(Math.random() * 2147483647);
        setSeed(String(randomSeed));
    }, []);

    const handleExportHistory = useCallback(() => {
        if (history.length === 0) {
            alert("L'historique est vide. Il n'y a rien à exporter.");
            return;
        }
        const dataStr = JSON.stringify(history, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'studio-creatif-ia-historique.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [history]);
    
    const handleImportClick = () => {
        importInputRef.current?.click();
    };
    
    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const importedHistory = JSON.parse(content);

                if (Array.isArray(importedHistory) && importedHistory.every(item => item && typeof item === 'object' && 'id' in item && 'prompt' in item && 'timestamp' in item)) {
                    const finalHistory = saveHistorySafely<HistoryEntry>('generationHistory', importedHistory);
                    if (finalHistory !== null) {
                        setHistory(finalHistory);
                    } else {
                        throw new Error("Le stockage local est plein, impossible d'importer l'historique.");
                    }
                } else {
                    throw new Error("Format de fichier invalide.");
                }
            } catch (error: any) {
                alert(`Erreur: ${error.message || "Le fichier est invalide ou corrompu et ne peut pas être importé."}`);
                console.error("Erreur d'importation de l'historique:", error);
            }
        };
        reader.readAsText(file);

        e.target.value = '';
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const newFiles = Array.from(files);
            const totalFiles = inputImageUrls.length + newFiles.length;
    
            if (totalFiles > MAX_INSPIRATION_IMAGES) {
                alert(`Vous ne pouvez pas dépasser ${MAX_INSPIRATION_IMAGES} images d'inspiration.`);
                if(e.target) e.target.value = '';
                return;
            }
    
            setInputImages(prev => [...prev, ...newFiles]);
            setNumberOfImages(1); 
    
            newFiles.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setInputImageUrls(prev => [...prev, reader.result as string]);
                };
                reader.readAsDataURL(file as Blob);
            });
            if(e.target) e.target.value = '';
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setInputImages(prev => prev.filter((_, index) => index !== indexToRemove));
        setInputImageUrls(prev => prev.filter((_, index) => index !== indexToRemove));
        if (uploadInputRef.current) {
            uploadInputRef.current.value = '';
        }
    };

    const openPreviewModal = (imageUrl: string) => {
        setActiveImageUrlForModal(imageUrl);
        setIsPreviewOpen(true);
    };

    const handleAspectRatioSelect = (ar: AspectRatio) => {
        setAspectRatio(ar);
        setCustomWidth('');
        setCustomHeight('');
    };
    
    const handleCustomDimChange = (e: React.ChangeEvent<HTMLInputElement>, dimension: 'width' | 'height') => {
        const value = e.target.value.replace(/[^0-9]/g, ''); 
        if (dimension === 'width') {
            setCustomWidth(value);
        } else {
            setCustomHeight(value);
        }
        if (aspectRatio !== null) {
            setAspectRatio(null);
        }
    };

    const handleHistorySelectionChange = (id: string) => {
        setSelectedHistoryIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    
    const handleSelectAllHistory = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedHistoryIds(new Set(history.map(entry => entry.id)));
        } else {
            setSelectedHistoryIds(new Set());
        }
    };

    const deleteSelectedFromHistory = useCallback(() => {
        setHistory(prevHistory => {
            const updatedHistory = prevHistory.filter(entry => !selectedHistoryIds.has(entry.id));
            const finalHistory = saveHistorySafely<HistoryEntry>('generationHistory', updatedHistory);
            setSelectedHistoryIds(new Set());
            if (finalHistory !== null) {
                return finalHistory;
            }
            return prevHistory;
        });
        setIsConfirmingDeleteSelected(false);
    }, [selectedHistoryIds]);

    const handleExampleSelect = (id: string) => {
        setSelectedExampleId(id);
        if (!id) return;
        
        const entry = examplesHistory.find(e => e.id === id);
        if (entry) {
            loadFromHistory(entry);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <input 
                type="file"
                ref={importInputRef}
                onChange={handleImportFile}
                className="hidden"
                accept=".json"
            />
            <input
                type="file"
                ref={uploadInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
                multiple
            />
            {/* Colonne de gauche: Panneau de contrôle */}
            <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-bunker-100 dark:bg-bunker-900 p-4 sm:p-6 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold mb-4 text-sky-600 dark:text-sky-500 flex items-center gap-2">
                        <span>Panneau de Contrôle</span>
                        <HelpTooltip title="Comment utiliser le Générateur ?">
                            <p>Suivez ces étapes pour donner vie à vos idées :</p>
                            <ol>
                                <li><strong>Instruction (Prompt) :</strong> Décrivez en détail ce que vous souhaitez créer. Soyez précis ! Utilisez le bouton 🎲 pour des idées.</li>
                                <li><strong>Style :</strong> Choisissez un style prédéfini ou combinez-le avec votre prompt pour affiner le rendu artistique.</li>
                                <li><strong>Options Avancées :</strong>
                                    <ul>
                                        <li><strong>Image(s) d'Inspiration :</strong> Importez jusqu'à {MAX_INSPIRATION_IMAGES} images pour guider l'IA.</li>
                                        <li><strong>Prompt Négatif :</strong> Indiquez ce que vous ne voulez PAS voir (ex: <code>texte, flou</code>).</li>
                                        <li><strong>Nombre & Format :</strong> Ajustez la quantité et les dimensions (désactivé si vous utilisez des images d'inspiration).</li>
                                    </ul>
                                </li>
                                <li><strong>Générer :</strong> Cliquez pour lancer la création. Vos images apparaîtront à droite.</li>
                                <li><strong>Historique :</strong> Retrouvez vos créations passées en bas du panneau pour les recharger, télécharger ou supprimer.</li>
                            </ol>
                        </HelpTooltip>
                    </h2>
                    
                    {/* Prompt Principal */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                           <label htmlFor="prompt" className="font-semibold">Votre Instruction (Prompt)</label>
                           <button
                                onClick={handleRandomPrompt}
                                className="flex items-center gap-1.5 text-sm font-medium text-sky-600 dark:text-sky-500 hover:text-sky-700 dark:hover:text-sky-400 transition-colors"
                                title="Générer un prompt aléatoire"
                            >
                                <DiceIcon className="w-4 h-4" />
                                <span>Prompt aléatoire</span>
                            </button>
                        </div>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ex: Un astronaute surfant sur une vague cosmique..."
                            className="w-full h-32 p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Style */}
                    <div className="mt-4 space-y-2">
                         <label htmlFor="model-style" className="font-semibold">Style:</label>
                         <select 
                            id="model-style" 
                            value={modelStyle}
                            onChange={(e) => setModelStyle(e.target.value)} 
                            className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors"
                         >
                            <option value="">Choisir un style...</option>
                            {models.map(group => (
                                <optgroup key={group.label} label={group.label}>
                                    {group.options.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                    ))}
                                </optgroup>
                            ))}
                         </select>
                    </div>

                    {/* Styles Rapides */}
                    <div className="mt-4 space-y-2">
                        <p className="font-semibold">Styles Rapides</p>
                        <div className="flex flex-wrap gap-2">
                            {predefinedStyles.map(style => (
                                <button
                                    key={style}
                                    onClick={() => setModelStyle(style)}
                                    className={`px-3 py-1.5 text-sm rounded-full transition-colors duration-200 ${
                                        modelStyle === style
                                            ? 'bg-sky-600 text-white font-bold shadow-md'
                                            : 'bg-bunker-200 dark:bg-bunker-800 hover:bg-bunker-300 dark:hover:bg-bunker-700 text-bunker-800 dark:text-bunker-200'
                                    }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Style 2 */}
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2">
                           <label htmlFor="example-style-select" className="font-semibold">Style 2 (Archive Exemples)</label>
                           <HelpTooltip title="Utiliser un style archivé">
                                <p>Cette liste contient les créations que vous avez générées et archivées depuis l'onglet "Exemples".</p>
                                <ol>
                                    <li>Sélectionnez un prompt dans la liste pour charger instantanément ses paramètres (prompt, images d'influence, format).</li>
                                    <li>Cliquez sur le bouton 🔄 pour rafraîchir la liste si vous avez récemment archivé de nouveaux éléments.</li>
                                </ol>
                            </HelpTooltip>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                id="example-style-select"
                                value={selectedExampleId}
                                onChange={(e) => handleExampleSelect(e.target.value)}
                                className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors"
                            >
                                <option value="">Choisir un style archivé...</option>
                                {examplesHistory.map(entry => (
                                    <option key={entry.id} value={entry.id} title={entry.prompt}>
                                        {entry.prompt.substring(0, 50)}{entry.prompt.length > 50 ? '...' : ''}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={updateExamplesHistory}
                                title="Mettre à jour la liste"
                                className="p-3 bg-bunker-200 dark:bg-bunker-800 rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700 transition-colors"
                            >
                                <ArrowPathIcon className="w-5 h-5 text-bunker-600 dark:text-bunker-300" />
                            </button>
                        </div>
                    </div>

                    {/* Options Avancées */}
                     <details className="mt-6 pt-6 border-t border-bunker-300 dark:border-bunker-700 group" open>
                        <summary className="list-none flex justify-between items-center cursor-pointer">
                            <h3 className="text-lg font-semibold">Options Avancées</h3>
                            <ChevronDownIcon className="w-5 h-5 text-bunker-500 group-open:rotate-180 transition-transform duration-300" />
                        </summary>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="font-semibold">Image(s) d'Inspiration (Optionnel, {MAX_INSPIRATION_IMAGES} max.)</label>
                                <div className="mt-2 w-full p-2 rounded-lg border-2 border-dashed border-bunker-300 dark:border-bunker-700 bg-bunker-200/50 dark:bg-bunker-800/50">
                                    {inputImageUrls.length > 0 && (
                                        <div className="grid grid-cols-3 gap-2 mb-2">
                                            {inputImageUrls.map((url, index) => (
                                                <div key={index} className="relative group aspect-square">
                                                    <img src={url} alt={`Inspiration ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                                                    <button
                                                        onClick={() => handleRemoveImage(index)}
                                                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-all duration-200"
                                                        aria-label={`Supprimer l'image ${index + 1}`}
                                                    >
                                                        <XMarkIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {inputImageUrls.length < MAX_INSPIRATION_IMAGES && (
                                        <button
                                            onClick={() => uploadInputRef.current?.click()}
                                            className="w-full py-3 px-4 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg flex items-center justify-center gap-2 hover:bg-bunker-300 dark:hover:bg-bunker-700 transition-colors text-bunker-600 dark:text-bunker-300"
                                        >
                                            <PhotoIcon className="w-5 h-5" />
                                            <span>{inputImageUrls.length > 0 ? 'Ajouter une autre image' : 'Cliquez pour ajouter des images'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="negative-prompt" className="font-semibold">Prompt Négatif</label>
                                <input
                                    type="text"
                                    id="negative-prompt"
                                    value={negativePrompt}
                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                    placeholder="Ex: mal dessiné, texte, flou..."
                                    className="w-full mt-2 p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                                />
                            </div>
                            <div className={`${inputImageUrls.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <label htmlFor="number-of-images" className="font-semibold flex justify-between items-center">
                                    <span>Nombre d'images</span>
                                    <span className="font-bold text-sky-500">{numberOfImages}</span>
                                </label>
                                <input
                                    type="range"
                                    id="number-of-images"
                                    min="1"
                                    max="5"
                                    step="1"
                                    value={numberOfImages}
                                    onChange={(e) => setNumberOfImages(Number(e.target.value))}
                                    disabled={inputImageUrls.length > 0}
                                    className="w-full mt-2 h-2 bg-bunker-200 dark:bg-bunker-700 rounded-lg appearance-none cursor-pointer accent-sky-600 disabled:accent-bunker-500"
                                />
                                 {inputImageUrls.length > 0 && <p className="text-xs text-bunker-500 dark:text-bunker-400 mt-2">Une seule image peut être générée avec une ou plusieurs images d'inspiration.</p>}
                            </div>
                            <div>
                                <label className="font-semibold">Format de l'image</label>
                                <div className={`flex flex-wrap gap-2 mt-2 ${inputImageUrls.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    {aspectRatios.map(ar => (
                                        <button 
                                            key={ar} 
                                            onClick={() => handleAspectRatioSelect(ar)} 
                                            disabled={inputImageUrls.length > 0}
                                            className={`py-2 px-3 rounded-lg text-sm transition-colors flex-1 ${aspectRatio === ar ? 'bg-sky-600 text-white font-bold ring-2 ring-sky-500' : 'bg-bunker-200 dark:bg-bunker-800 hover:bg-bunker-300 dark:hover:bg-bunker-700'}`}
                                        >
                                            {ar}
                                        </button>
                                    ))}
                                </div>
                                <div className={`mt-3 grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 ${inputImageUrls.length > 0 ? 'opacity-50' : ''}`}>
                                    <input
                                        type="number"
                                        placeholder="Largeur"
                                        value={customWidth}
                                        onChange={(e) => handleCustomDimChange(e, 'width')}
                                        disabled={inputImageUrls.length > 0}
                                        className="w-full p-2 text-center bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition disabled:cursor-not-allowed"
                                        aria-label="Largeur personnalisée en pixels"
                                    />
                                    <span className="font-semibold text-bunker-400">px</span>
                                    <input
                                        type="number"
                                        placeholder="Hauteur"
                                        value={customHeight}
                                        onChange={(e) => handleCustomDimChange(e, 'height')}
                                        disabled={inputImageUrls.length > 0}
                                        className="w-full p-2 text-center bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition disabled:cursor-not-allowed"
                                        aria-label="Hauteur personnalisée en pixels"
                                    />
                                     <span className="font-semibold text-bunker-400">px</span>
                                </div>
                                {inputImageUrls.length > 0 && <p className="text-xs text-bunker-500 dark:text-bunker-400 mt-2">Le format est déterminé par l'IA lors de l'utilisation d'images d'inspiration.</p>}
                            </div>
                        </div>
                    </details>
                    
                    {/* Paramètres Avancés */}
                    <details className="mt-6 pt-6 border-t border-bunker-300 dark:border-bunker-700 group" open>
                        <summary className="list-none flex justify-between items-center cursor-pointer">
                            <h3 className="text-lg font-semibold">Paramètres Avancés</h3>
                            <ChevronDownIcon className="w-5 h-5 text-bunker-500 group-open:rotate-180 transition-transform duration-300" />
                        </summary>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label htmlFor="seed" className="font-semibold flex justify-between items-center">
                                    <span>Seed de génération</span>
                                    <button
                                        onClick={handleRandomSeed}
                                        className="flex items-center gap-1.5 text-sm font-medium text-sky-600 dark:text-sky-500 hover:text-sky-700 dark:hover:text-sky-400 transition-colors"
                                        title="Générer une seed aléatoire"
                                    >
                                        <DiceIcon className="w-4 h-4" />
                                        <span>Aléatoire</span>
                                    </button>
                                </label>
                                <input
                                    type="number"
                                    id="seed"
                                    value={seed}
                                    onChange={(e) => setSeed(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="Laisser vide pour aléatoire"
                                    className="w-full mt-2 p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                                />
                                <p className="text-xs text-bunker-500 dark:text-bunker-400 mt-1">Utiliser la même seed avec le même prompt produira des images similaires.</p>
                            </div>
                        </div>
                    </details>

                    <div className="mt-8 space-y-4">
                        <button 
                            onClick={handleReset} 
                            className="w-full py-2 px-4 bg-bunker-500 text-bunker-100 font-semibold rounded-lg hover:bg-bunker-600 dark:bg-bunker-700 dark:hover:bg-bunker-600 transition-colors shadow-md"
                        >
                            Réinitialiser
                        </button>

                        <button onClick={handleGenerate} disabled={isLoading || !prompt || dailyUsage >= limit} className="w-full py-3 px-4 bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-sky-700 disabled:bg-bunker-400 dark:disabled:bg-bunker-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg">
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                    <span>Génération en cours...</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-6 h-6" />
                                    <span>Générer {inputImageUrls.length > 0 ? "l'Image" : (numberOfImages > 1 ? `les ${numberOfImages} images` : "l'Image")}</span>
                                </>
                            )}
                        </button>
                        {dailyUsage >= limit && (
                            <p className="text-center text-sm font-semibold text-red-500">
                                Limite de génération quotidienne gratuite atteinte.
                            </p>
                        )}
                    </div>
                </div>

                 {/* Historique / Archive */}
                <details className="bg-bunker-100 dark:bg-bunker-900 p-4 sm:p-6 rounded-xl shadow-lg group" open={history.length > 0}>
                    <summary className="list-none flex justify-between items-center cursor-pointer mb-4">
                         <h3 className="text-xl font-bold">Historique / Archive</h3>
                         <div className="flex items-center">
                            <div className="flex items-center gap-1 mr-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleImportClick(); }}
                                    aria-label="Importer un historique"
                                    title="Importer un historique"
                                    className="p-1.5 rounded-full text-bunker-500 hover:text-sky-500 dark:text-bunker-400 dark:hover:text-sky-400 hover:bg-sky-500/10 transition-colors duration-200"
                                >
                                    <ArrowDownOnSquareIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleExportHistory(); }}
                                    aria-label="Exporter l'historique"
                                    title="Exporter l'historique"
                                    className="p-1.5 rounded-full text-bunker-500 hover:text-sky-500 dark:text-bunker-400 dark:hover:text-sky-400 hover:bg-sky-500/10 transition-colors duration-200"
                                >
                                    <ArrowUpOnSquareIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setIsConfirmingClear(true); }}
                                    aria-label="Vider tout l'historique" 
                                    title="Vider tout l'historique"
                                    className="p-1.5 rounded-full text-bunker-500 hover:text-red-500 dark:text-bunker-400 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors duration-200"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                            <ChevronDownIcon className="w-5 h-5 text-bunker-500 group-open:rotate-180 transition-transform duration-300" />
                        </div>
                    </summary>

                    {history.length > 0 && (
                        <div className="mb-2 p-2 bg-bunker-200 dark:bg-bunker-800 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAllHistory}
                                    checked={history.length > 0 && selectedHistoryIds.size === history.length}
                                    aria-label="Tout sélectionner"
                                    className="h-5 w-5 rounded text-sky-600 bg-bunker-300 dark:bg-bunker-700 border-bunker-400 dark:border-bunker-600 focus:ring-sky-500"
                                />
                                <label className="text-sm font-semibold select-none">
                                    {selectedHistoryIds.size > 0 ? `${selectedHistoryIds.size} sélectionné(s)` : "Tout sélectionner"}
                                </label>
                            </div>
                            {selectedHistoryIds.size > 0 && (
                                <button
                                    onClick={() => setIsConfirmingDeleteSelected(true)}
                                    className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 p-1 rounded-md hover:bg-red-500/10 transition-colors"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                    <span>Supprimer</span>
                                </button>
                            )}
                        </div>
                    )}

                    <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                        {history.length === 0 ? (
                            <p className="text-sm text-center text-bunker-500 dark:text-bunker-400 py-4">Votre historique est vide.</p>
                        ) : history.map(entry => (
                            <div 
                                key={entry.id} 
                                className={`p-2 rounded-lg transition-colors flex items-center justify-between gap-3 cursor-pointer ${selectedHistoryIds.has(entry.id) ? 'bg-sky-500/20 ring-2 ring-sky-500' : 'bg-bunker-200 dark:bg-bunker-800 hover:bg-bunker-300 dark:hover:bg-bunker-700'}`}
                                onClick={() => handleHistorySelectionChange(entry.id)}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <input
                                        type="checkbox"
                                        readOnly
                                        checked={selectedHistoryIds.has(entry.id)}
                                        aria-hidden="true"
                                        className="h-5 w-5 rounded text-sky-600 bg-bunker-300 dark:bg-bunker-700 border-bunker-400 dark:border-bunker-600 focus:ring-sky-500 flex-shrink-0 pointer-events-none"
                                    />
                                    {entry.imageUrls && entry.imageUrls[0] && 
                                        <img src={entry.imageUrls[0]} alt="aperçu" className="w-10 h-10 object-cover rounded-md flex-shrink-0" />
                                    }
                                    <div className="truncate" onClick={(e) => { e.stopPropagation(); loadFromHistory(entry); }} title="Recharger ces paramètres">
                                        <p className="text-sm truncate" title={entry.prompt}>{entry.prompt}</p>
                                        <p className="text-xs text-bunker-500 dark:text-bunker-400">
                                            {new Date(entry.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <a 
                                        href={entry.imageUrls?.[0]} 
                                        download={`creation-ia-${entry.id.substring(0, 8)}.jpg`}
                                        title="Télécharger la première image"
                                        className="p-2 rounded-full text-bunker-600 hover:text-sky-600 dark:text-bunker-300 dark:hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                                    >
                                        <DownloadIcon className="w-5 h-5" />
                                    </a>
                                    <button 
                                        onClick={() => onSendToEditor(entry.imageUrls![0])}
                                        title="Envoyer la première image vers l'éditeur"
                                        className="p-2 rounded-full text-bunker-600 hover:text-sky-600 dark:text-bunker-300 dark:hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                                    >
                                        <ArrowRightIcon className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => deleteFromHistory(entry.id)}
                                        title="Supprimer de l'historique"
                                        className="p-2 rounded-full text-bunker-600 hover:text-red-500 dark:text-bunker-300 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </details>
            </div>

            {/* Colonne de droite: Affichage de l'image */}
            <div className="lg:col-span-3 bg-bunker-100 dark:bg-bunker-900 p-4 sm:p-6 rounded-xl shadow-lg flex items-center justify-center min-h-[400px] lg:min-h-0">
                <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-bunker-300 dark:border-bunker-700 rounded-lg p-4 transition-all duration-300">
                    {isLoading && (
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-t-transparent border-sky-500 rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 font-semibold">L'IA réfléchit...</p>
                            <p className="text-sm text-bunker-500 dark:text-bunker-400">La création peut prendre un moment.</p>
                        </div>
                    )}
                    {error && <p className="text-red-500 font-semibold text-center">{error}</p>}
                    {!isLoading && !error && generatedImages && generatedImages.length > 0 && (
                        <div className="w-full h-full overflow-y-auto">
                             <div className={`grid gap-4 ${generatedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                {generatedImages.map((imageUrl, index) => (
                                    <div
                                        key={index}
                                        className="relative group w-full mx-auto cursor-pointer aspect-square"
                                        onClick={() => openPreviewModal(imageUrl)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && openPreviewModal(imageUrl)}
                                        aria-label={`Agrandir l'image ${index + 1}`}
                                    >
                                        <img src={imageUrl} alt={`Generated Art ${index + 1}`} className="rounded-lg shadow-2xl w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none">
                                            <MagnifyingGlassIcon className="w-12 h-12 text-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {!isLoading && !error && (!generatedImages || generatedImages.length === 0) && (
                        <div className="text-center text-bunker-500 dark:text-bunker-400">
                             <SparklesIcon className="w-16 h-16 mx-auto text-bunker-400 dark:text-bunker-600"/>
                            <h3 className="mt-4 text-xl font-semibold">Votre création apparaîtra ici</h3>
                            <p className="mt-1">Laissez libre cours à votre imagination et cliquez sur "Générer".</p>
                        </div>
                    )}
                </div>
            </div>
            {activeImageUrlForModal && (
                <ImagePreviewModal
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    imageUrl={activeImageUrlForModal}
                    onSendToEditor={onSendToEditor}
                />
            )}
            <ConfirmationModal
                isOpen={isConfirmingClear}
                onClose={() => setIsConfirmingClear(false)}
                onConfirm={handleConfirmClear}
                title="Vider tout l'historique"
                confirmText="Oui, Vider"
            >
                <p>Êtes-vous sûr de vouloir vider tout l'historique ? Cette action est irréversible.</p>
            </ConfirmationModal>
            <ConfirmationModal
                isOpen={isConfirmingDeleteSelected}
                onClose={() => setIsConfirmingDeleteSelected(false)}
                onConfirm={deleteSelectedFromHistory}
                title={`Supprimer ${selectedHistoryIds.size} élément(s)`}
                confirmText="Oui, Supprimer"
            >
                <p>Êtes-vous sûr de vouloir supprimer les ${selectedHistoryIds.size} éléments sélectionnés de l'historique ? Cette action est irréversible.</p>
            </ConfirmationModal>
        </div>
    );
};

export default ImageGenerator;
