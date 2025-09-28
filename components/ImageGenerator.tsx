
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateImage } from '../services/geminiService';
import { AspectRatio, HistoryEntry } from '../types';

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.077-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

const DiceIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="8.5" cy="8.5" r=".5" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r=".5" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="15.5" r=".5" fill="currentColor" />
      <circle cx="12" cy="12" r=".5" fill="currentColor" />
    </svg>
);

const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
);

const ArrowUpOnSquareIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
);

const ArrowDownOnSquareIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
);

const MagnifyingGlassIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

const XMarkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

const PhotoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
);


// MODAL COMPONENT
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
                <div className="flex-shrink-0 flex items-center justify-center gap-4">
                     <button
                        onClick={handleSendToEditorClick}
                        className="bg-sky-600 text-white py-3 px-6 rounded-lg flex items-center gap-2 hover:bg-sky-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                        title="Envoyer vers l'éditeur"
                    >
                        <ArrowRightIcon className="w-5 h-5" />
                        <span>Vers l'éditeur</span>
                    </button>
                    <a
                        href={imageUrl}
                        download="creation-ia.jpg"
                        className="bg-bunker-100 dark:bg-bunker-800 text-bunker-900 dark:text-bunker-100 py-3 px-6 rounded-lg flex items-center gap-2 hover:bg-bunker-200 dark:hover:bg-bunker-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
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
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onSendToEditor }) => {
    const [prompt, setPrompt] = useState<string>('');
    const [negativePrompt, setNegativePrompt] = useState<string>(DEFAULT_NEGATIVE_PROMPT);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio | null>('1:1');
    const [customWidth, setCustomWidth] = useState<string>('');
    const [customHeight, setCustomHeight] = useState<string>('');
    const [modelStyle, setModelStyle] = useState<string>('');
    const [generatedImages, setGeneratedImages] = useState<string[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [activeImageUrlForModal, setActiveImageUrlForModal] = useState<string | null>(null);
    const [inputImage, setInputImage] = useState<File | null>(null);
    const [inputImageUrl, setInputImageUrl] = useState<string | null>(null);
    const [numberOfImages, setNumberOfImages] = useState<number>(1);
    const importInputRef = useRef<HTMLInputElement>(null);
    const uploadInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('generationHistory');
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (e) {
            console.error("Impossible de charger l'historique:", e);
        }
    }, []);

    const updateLocalStorageHistory = (updatedHistory: HistoryEntry[]) => {
        try {
            localStorage.setItem('generationHistory', JSON.stringify(updatedHistory));
        } catch (e) {
            console.error("Impossible de sauvegarder l'historique:", e);
        }
    };

    const addToHistory = (entry: Omit<HistoryEntry, 'id' | 'timestamp'>, imageUrls: string[]) => {
        setHistory(prevHistory => {
            const newEntry: HistoryEntry = {
                ...entry,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                imageUrls: imageUrls,
            };
            const updatedHistory = [newEntry, ...prevHistory].slice(0, 20); // Limit history to 20 items
            updateLocalStorageHistory(updatedHistory);
            return updatedHistory;
        });
    };
    
    const deleteFromHistory = useCallback((idToDelete: string) => {
        setHistory(prevHistory => {
            const updatedHistory = prevHistory.filter(entry => entry.id !== idToDelete);
            updateLocalStorageHistory(updatedHistory);
            return updatedHistory;
        });
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!prompt || isLoading) return;

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

        try {
            const imageUrls = await generateImage(finalPrompt, negativePrompt, finalAspectRatio, numberOfImages, inputImageUrl);
            setGeneratedImages(imageUrls);
            addToHistory({ prompt, negativePrompt, aspectRatio: finalAspectRatio, modelStyle, inputImageUrl, numberOfImages }, imageUrls);
        } catch (e: any) {
            setError(e.message || "Une erreur inconnue est survenue.");
        } finally {
            setIsLoading(false);
        }
    }, [prompt, negativePrompt, aspectRatio, customWidth, customHeight, isLoading, modelStyle, inputImageUrl, numberOfImages]);
    
    const handleReset = useCallback(() => {
        setPrompt('');
        setNegativePrompt(DEFAULT_NEGATIVE_PROMPT);
        setAspectRatio('1:1');
        setCustomWidth('');
        setCustomHeight('');
        setModelStyle('');
        setGeneratedImages(null);
        setError(null);
        setInputImage(null);
        setInputImageUrl(null);
        setNumberOfImages(1);
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
        setGeneratedImages(entry.imageUrls || null);
        setInputImageUrl(entry.inputImageUrl || null);
        setNumberOfImages(entry.numberOfImages || 1);
        setInputImage(null);
    };
    
    const clearHistory = useCallback(() => {
        setHistory([]);
        try {
            localStorage.removeItem('generationHistory');
        } catch (e) {
            console.error("Impossible de vider l'historique:", e);
        }
    }, []);

    const handleRandomPrompt = useCallback(() => {
        const prompts = Object.values(preFilledPrompts);
        const randomIndex = Math.floor(Math.random() * prompts.length);
        const randomPrompt = prompts[randomIndex];
        setPrompt(randomPrompt);
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

                // Basic validation
                if (Array.isArray(importedHistory) && importedHistory.every(item => 'id' in item && 'prompt' in item && 'timestamp' in item)) {
                    setHistory(importedHistory);
                    updateLocalStorageHistory(importedHistory);
                } else {
                    throw new Error("Format de fichier invalide.");
                }
            } catch (error) {
                alert("Erreur: Le fichier est invalide ou corrompu et ne peut pas être importé.");
                console.error("Erreur d'importation de l'historique:", error);
            }
        };
        reader.readAsText(file);

        // Reset input value to allow re-importing the same file
        e.target.value = '';
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setInputImage(file);
            setNumberOfImages(1); // Force 1 image when using an input image
            const reader = new FileReader();
            reader.onloadend = () => {
                setInputImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setInputImage(null);
        setInputImageUrl(null);
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
        const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow numbers
        if (dimension === 'width') {
            setCustomWidth(value);
        } else {
            setCustomHeight(value);
        }
        if (aspectRatio !== null) {
            setAspectRatio(null);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
            />
            {/* Colonne de gauche: Panneau de contrôle */}
            <div className="lg:col-span-1 flex flex-col gap-6">
                <div className="bg-bunker-100 dark:bg-bunker-900 p-6 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold mb-4 text-sky-600 dark:text-sky-500">Panneau de Contrôle</h2>
                    
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
                            className="w-full h-32 p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                        />
                    </div>

                    {/* Style */}
                    <div className="mt-4 space-y-2">
                         <label htmlFor="model-style" className="font-semibold">Style:</label>
                         <select 
                            id="model-style" 
                            value={modelStyle}
                            onChange={(e) => setModelStyle(e.target.value)} 
                            className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
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

                    {/* Options Avancées */}
                    <div className="mt-6 pt-6 border-t border-bunker-300 dark:border-bunker-700 space-y-4">
                        <h3 className="text-lg font-semibold">Options Avancées</h3>
                        <div>
                            <label className="font-semibold">Image d'Inspiration (Optionnel)</label>
                            <div 
                                onClick={() => !inputImageUrl && uploadInputRef.current?.click()}
                                className={`mt-2 w-full aspect-video rounded-lg border-2 border-dashed border-bunker-300 dark:border-bunker-700 flex items-center justify-center transition-colors ${!inputImageUrl ? 'cursor-pointer hover:bg-bunker-200 dark:hover:bg-bunker-800' : ''} relative overflow-hidden bg-bunker-200/50 dark:bg-bunker-800/50`}
                            >
                                {!inputImageUrl ? (
                                    <div className="text-center text-bunker-500 dark:text-bunker-400">
                                        <PhotoIcon className="w-10 h-10 mx-auto" />
                                        <p className="mt-2 text-sm">Cliquez pour ajouter une image</p>
                                    </div>
                                ) : (
                                    <>
                                        <img src={inputImageUrl} alt="Aperçu de l'image d'entrée" className="w-full h-full object-cover" />
                                        <button
                                            onClick={handleRemoveImage}
                                            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                                            aria-label="Supprimer l'image"
                                        >
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    </>
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
                        <div className={`${inputImageUrl ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
                                disabled={!!inputImageUrl}
                                className="w-full mt-2 h-2 bg-bunker-200 dark:bg-bunker-700 rounded-lg appearance-none cursor-pointer accent-sky-600 disabled:accent-bunker-500"
                            />
                             {inputImageUrl && <p className="text-xs text-bunker-500 dark:text-bunker-400 mt-2">Une seule image peut être générée avec une image d'inspiration.</p>}
                        </div>
                        <div>
                            <label className="font-semibold">Format de l'image</label>
                            <div className={`grid grid-cols-5 gap-2 mt-2 ${inputImageUrl ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {aspectRatios.map(ar => (
                                    <button 
                                        key={ar} 
                                        onClick={() => handleAspectRatioSelect(ar)} 
                                        disabled={!!inputImageUrl}
                                        className={`py-2 rounded-lg text-sm transition ${aspectRatio === ar ? 'bg-sky-600 text-white font-bold ring-2 ring-sky-500' : 'bg-bunker-200 dark:bg-bunker-800 hover:bg-bunker-300 dark:hover:bg-bunker-700'}`}
                                    >
                                        {ar}
                                    </button>
                                ))}
                            </div>
                            <div className={`mt-3 grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 ${inputImageUrl ? 'opacity-50' : ''}`}>
                                <input
                                    type="number"
                                    placeholder="Largeur"
                                    value={customWidth}
                                    onChange={(e) => handleCustomDimChange(e, 'width')}
                                    disabled={!!inputImageUrl}
                                    className="w-full p-2 text-center bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition disabled:cursor-not-allowed"
                                    aria-label="Largeur personnalisée en pixels"
                                />
                                <span className="font-semibold text-bunker-400">px</span>
                                <input
                                    type="number"
                                    placeholder="Hauteur"
                                    value={customHeight}
                                    onChange={(e) => handleCustomDimChange(e, 'height')}
                                    disabled={!!inputImageUrl}
                                    className="w-full p-2 text-center bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition disabled:cursor-not-allowed"
                                    aria-label="Hauteur personnalisée en pixels"
                                />
                                 <span className="font-semibold text-bunker-400">px</span>
                            </div>
                            {inputImageUrl && <p className="text-xs text-bunker-500 dark:text-bunker-400 mt-2">Le format est déterminé par l'image d'inspiration.</p>}
                        </div>
                    </div>
                    
                    <div className="mt-8">
                        <button 
                            onClick={handleReset} 
                            className="w-full mb-4 py-2 px-4 bg-bunker-500 text-bunker-100 font-semibold rounded-lg hover:bg-bunker-600 dark:bg-bunker-700 dark:hover:bg-bunker-600 transition-colors shadow-md"
                        >
                            Réinitialiser
                        </button>
                        <button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full py-3 px-4 bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-sky-700 disabled:bg-bunker-400 dark:disabled:bg-bunker-600 disabled:cursor-not-allowed transition-transform duration-200 transform hover:scale-105 shadow-lg">
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                    <span>Génération en cours...</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-6 h-6" />
                                    <span>Générer {numberOfImages > 1 ? `les ${numberOfImages} images` : "l'Image"}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                 {/* Historique */}
                 {history.length > 0 && (
                    <div className="bg-bunker-100 dark:bg-bunker-900 p-6 rounded-xl shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Historique</h3>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={handleImportClick}
                                    aria-label="Importer un historique"
                                    title="Importer un historique"
                                    className="p-1.5 rounded-full text-bunker-500 hover:text-sky-500 dark:text-bunker-400 dark:hover:text-sky-400 hover:bg-sky-500/10 transition-colors duration-200"
                                >
                                    <ArrowDownOnSquareIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleExportHistory}
                                    aria-label="Exporter l'historique"
                                    title="Exporter l'historique"
                                    className="p-1.5 rounded-full text-bunker-500 hover:text-sky-500 dark:text-bunker-400 dark:hover:text-sky-400 hover:bg-sky-500/10 transition-colors duration-200"
                                >
                                    <ArrowUpOnSquareIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={clearHistory} 
                                    aria-label="Vider tout l'historique" 
                                    title="Vider tout l'historique"
                                    className="p-1.5 rounded-full text-bunker-500 hover:text-red-500 dark:text-bunker-400 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors duration-200"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
                            {history.map(entry => (
                                <div key={entry.id} className="p-2 bg-bunker-200 dark:bg-bunker-800 rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700 transition flex items-center justify-between gap-3">
                                    <div onClick={() => loadFromHistory(entry)} className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                                        {entry.imageUrls && entry.imageUrls[0] && <img src={entry.imageUrls[0]} alt="aperçu" className="w-10 h-10 object-cover rounded-md flex-shrink-0" />}
                                        <p className="text-sm truncate">{entry.prompt}</p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <a 
                                            href={entry.imageUrls?.[0]} 
                                            download={`creation-ia-${entry.id.substring(0, 8)}.jpg`}
                                            onClick={(e) => e.stopPropagation()}
                                            title="Télécharger la première image"
                                            className="p-2 rounded-full text-bunker-600 hover:text-sky-600 dark:text-bunker-300 dark:hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                                        >
                                            <DownloadIcon className="w-5 h-5" />
                                        </a>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onSendToEditor(entry.imageUrls![0]); }}
                                            title="Envoyer la première image vers l'éditeur"
                                            className="p-2 rounded-full text-bunker-600 hover:text-sky-600 dark:text-bunker-300 dark:hover:text-sky-400 hover:bg-sky-500/10 transition-colors"
                                        >
                                            <ArrowRightIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteFromHistory(entry.id); }}
                                            title="Supprimer de l'historique"
                                            className="p-2 rounded-full text-bunker-600 hover:text-red-500 dark:text-bunker-300 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Colonne de droite: Affichage de l'image */}
            <div className="lg:col-span-2 bg-bunker-100 dark:bg-bunker-900 p-6 rounded-xl shadow-lg flex items-center justify-center min-h-[400px] lg:min-h-0">
                <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-bunker-300 dark:border-bunker-700 rounded-lg p-4">
                    {isLoading && (
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-t-transparent border-sky-500 rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 font-semibold">L'IA réfléchit...</p>
                            <p className="text-sm text-bunker-500 dark:text-bunker-400">La création peut prendre un moment.</p>
                        </div>
                    )}
                    {error && <p className="text-red-500 font-semibold">{error}</p>}
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
                            <p className="mt-1">Remplissez les options et cliquez sur "Générer".</p>
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
        </div>
    );
};

export default ImageGenerator;
