
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { editImage, generateImage } from '../services/geminiService';
import MaskableImage from './MaskableImage';
import ImageComparisonSlider from './ImageComparisonSlider';
import { AspectRatio } from '../types';
import { ArrowUturnLeftIcon, PencilIcon, DownloadIcon, MagnifyingGlassIcon, XCircleIcon, DiceIcon, SparklesIcon, XMarkIcon } from './Icons';
import HelpTooltip from './HelpTooltip';

const predefinedEdits = [
    {
      category: "Expression et Personnage",
      options: [
        { label: "Ajouter un sourire", prompt: "Ajoute un sourire naturel et joyeux au visage." },
        { label: "Expression surprise", prompt: "Change l'expression du visage pour montrer de la surprise." },
        { label: "Changer la pose (assis > debout)", prompt: "Change la pose de la personne pour qu'elle soit debout au lieu d'assise." },
        { label: "Changer la coiffure / couleur", prompt: "Change la coiffure pour des cheveux longs et blonds." },
        { label: "Modifier les traits du visage", prompt: "Change les traits du visage pour : [décrire les changements, ex: yeux bleus, cheveux courts et bruns]." },
        { label: "Vieillir la personne", prompt: "Fais vieillir la personne de 20 ans, en ajoutant des rides et des cheveux gris." },
        { label: "Rajeunir la personne", prompt: "Rajeunis la personne de 15 ans, en lissant la peau." },
        { label: "Ajouter des lunettes de soleil", prompt: "Ajoute des lunettes de soleil élégantes à la personne." },
        { label: "Tenue de super-héros", prompt: "Transforme les vêtements en une tenue de super-héros." },
        { label: "Faire un clin d'œil", prompt: "Fais un clin d'œil malicieux à la personne." },
        { label: "Ajouter une barbe", prompt: "Ajoute une barbe et une moustache bien taillées." },
        { label: "Changer la couleur des yeux", prompt: "Change la couleur des yeux en vert émeraude." },
      ]
    },
    {
      category: "Environnement et Scène",
      options: [
        { label: "Changer la saison (vers l'hiver)", prompt: "Transforme la scène pour qu'elle se déroule en hiver, avec de la neige au sol." },
        { label: "Changer la saison (vers l'été)", prompt: "Transforme la scène en un paysage d'été luxuriant et ensoleillé." },
        { label: "Passer du jour à la nuit", prompt: "Change l'éclairage pour une scène de nuit, avec la lune visible dans le ciel." },
        { label: "Changer l'arrière-plan (montagnes)", prompt: "Remplace l'arrière-plan par une vue sur les montagnes." },
        { label: "Ajouter des effets météo (pluie)", prompt: "Ajoute de la pluie à la scène, avec des flaques d'eau et des reflets." },
        { label: "Ajouter un arc-en-ciel", prompt: "Ajoute un arc-en-ciel vibrant dans le ciel." },
        { label: "Placer sur Mars", prompt: "Place la scène sur la planète Mars, avec un ciel rougeâtre et un sol rocheux." },
        { label: "Inonder le sol", prompt: "Inonde le sol avec de l'eau pour créer des reflets spectaculaires." },
        { label: "Ajouter du brouillard", prompt: "Ajoute une nappe de brouillard pour une ambiance mystérieuse." },
        { label: "Aurore boréale", prompt: "Fais apparaître une aurore boréale dans le ciel nocturne." },
        { label: "Forêt de bambous", prompt: "Transforme l'arrière-plan en une forêt de bambous dense." },
        { label: "Château flottant", prompt: "Ajoute un château majestueux flottant dans le ciel." },
      ]
    },
    {
      category: "Style et Colorimétrie",
      options: [
        { label: "Coloriser (N&B vers couleurs)", prompt: "Colorise cette image en noir et blanc avec des couleurs vives et réalistes." },
        { label: "Cadrage gros plan", prompt: "Recadre l'image pour en faire un gros plan sur le sujet principal." },
        { label: "Style Cinématographique", prompt: "Applique un étalonnage des couleurs de style cinématographique à l'image." },
        { label: "Transformer en style Anime/Manga", prompt: "Redessine l'image entière dans un style anime japonais." },
        { label: "Transformer en Mosaïque", prompt: "Transforme l'image en une mosaïque de style romain." },
        { label: "Transformer en Pixel Art", prompt: "Convertis l'image en pixel art 16-bit." },
        { label: "Transformer en Peinture à l'aquarelle", prompt: "Donne à l'image l'apparence d'une peinture à l'aquarelle." },
        { label: "Filtre Sépia", prompt: "Applique un filtre Sépia pour un look vintage et nostalgique." },
        { label: "Dessin au fusain", prompt: "Transforme l'image en un dessin artistique au fusain." },
        { label: "Palette de couleurs pastel", prompt: "Utilise une palette de couleurs douces et pastel." },
        { label: "Image thermique", prompt: "Convertis l'image en une vue thermique (infrarouge)." },
        { label: "Style 'Glitch Art'", prompt: "Donne un style 'glitch art' avec des distorsions numériques et des artefacts." },
        { label: "Transformer en vitrail", prompt: "Transforme l'image en un vitrail coloré." },
        { label: "Style Bande Dessinée", prompt: "Applique un style de bande dessinée avec des contours noirs épais et des couleurs plates." },
      ]
    },
    {
      category: "Objets et Effets Spéciaux",
      options: [
        { label: "Remplacer un objet", prompt: "Remplace l'objet sélectionné par une plante verte en pot." },
        { label: "Mettre un véhicule en feu", prompt: "Mets le feu au véhicule dans l'image, avec des flammes et de la fumée réalistes." },
        { label: "Ajouter des effets de lumière (néon)", prompt: "Ajoute des éclairages néon colorés à la scène." },
        { label: "Ajouter du texte sur l'image", prompt: "Inscrits le texte 'BIENVENUE' en haut de l'image avec une police audacieuse." },
        { label: "Ajouter un drone", prompt: "Ajoute un drone futuriste volant dans le ciel." },
        { label: "Placer un chaton", prompt: "Place un chaton adorable sur l'épaule de la personne." },
        { label: "Faire léviter un objet", prompt: "Fais léviter l'objet principal à quelques centimètres du sol." },
        { label: "Ajouter des éclairs", prompt: "Ajoute des éclairs spectaculaires frappant en arrière-plan." },
        { label: "Aura d'énergie", prompt: "Entoure le sujet d'une aura d'énergie bleue brillante." },
        { label: "Ajouter des papillons", prompt: "Ajoute des papillons colorés volant autour du sujet." },
        { label: "Transformer en fleurs", prompt: "Transforme l'objet tenu par la personne en un magnifique bouquet de fleurs." },
      ]
    },
    {
      category: "E-commerce et Architecture",
      options: [
        { label: "Changer la couleur du produit", prompt: "Change la couleur du produit en rouge vif." },
        { label: "Mettre le produit en situation", prompt: "Place le produit sur une table en bois dans un salon moderne." },
        { label: "Changer le style architectural", prompt: "Transforme le style architectural du bâtiment en style Art Déco." },
        { label: "Croquis vers rendu réaliste", prompt: "Transforme ce croquis architectural en un rendu 3D photoréaliste." },
        { label: "Changer le matériau du produit", prompt: "Change le matériau du produit pour qu'il soit en bois de chêne clair." },
        { label: "Emballage de luxe", prompt: "Présente le produit dans un emballage de luxe avec des rubans en soie." },
        { label: "Ajouter de la végétation", prompt: "Ajoute une végétation luxuriante et des jardins verticaux autour du bâtiment." },
        { label: "Bâtiment de nuit", prompt: "Montre le bâtiment la nuit, avec toutes les lumières intérieures allumées." },
        { label: "Design à toit ouvert", prompt: "Modifie les plans du bâtiment pour un design moderne à toit ouvert." },
        { label: "Isoler le produit", prompt: "Nettoie l'arrière-plan pour isoler complètement le produit sur un fond blanc pur." },
      ]
    },
    {
      category: "Restauration et Amélioration",
      options: [
        { label: "Restaurer une photo endommagée", prompt: "Restaure cette vieille photo, en corrigeant les rayures et les décolorations." },
        { label: "Améliorer la résolution (Upscale)", prompt: "Améliore considérablement la résolution et la netteté de cette image." },
        { label: "Supprimer les yeux rouges", prompt: "Corrige les yeux rouges sur la photo." },
        { label: "Supprimer un élément", prompt: "Enlève complètement la personne ou l'objet indésirable de l'arrière-plan." },
        { label: "Accentuer les détails", prompt: "Accentue les détails fins et la texture de l'image pour la rendre plus nette." },
      ]
    },
];


const preFilledPromptsForGeneration = {
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

const allEditPrompts = predefinedEdits.flatMap(group => group.options.map(option => option.prompt));

interface ImageEditorProps {
    initialImage: string | null;
    onImageProcessed: () => void;
}

const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: blob.type });
};

const ImageEditor: React.FC<ImageEditorProps> = ({ initialImage, onImageProcessed }) => {
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [selectedAction, setSelectedAction] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [brushSize, setBrushSize] = useState<number>(20);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const maskableImageRef = useRef<{ getImageWithMask: () => string | null }>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Effect to handle cleanup of object URLs to prevent memory leaks
    useEffect(() => {
        const currentUrl = originalImageUrl;
        return () => {
            if (currentUrl && currentUrl.startsWith('blob:')) {
                URL.revokeObjectURL(currentUrl);
            }
        };
    }, [originalImageUrl]);

    useEffect(() => {
        if (initialImage) {
            (async () => {
                try {
                    const file = await dataUrlToFile(initialImage, `generated-image-${Date.now()}.png`);
                    
                    handleReset();

                    // Set new image (this will trigger the cleanup effect for the previous URL)
                    setOriginalImage(file);
                    setOriginalImageUrl(URL.createObjectURL(file));
                    
                    // Notify parent that image has been consumed
                    onImageProcessed();
                } catch (e) {
                    setError("Impossible de charger l'image transférée.");
                    console.error("Erreur lors de la conversion de Data URL en Fichier:", e);
                }
            })();
        }
    }, [initialImage, onImageProcessed]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            setIsPopupOpen(false);
          }
        };
    
        if (isPopupOpen) {
          document.addEventListener('keydown', handleKeyDown);
        }
    
        return () => {
          document.removeEventListener('keydown', handleKeyDown);
        };
      }, [isPopupOpen]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            handleReset();
            setOriginalImage(file);
            setOriginalImageUrl(URL.createObjectURL(file));
        }
    };

    const handleReset = useCallback(() => {
        setOriginalImage(null);
        setOriginalImageUrl(null);
        setEditedImageUrl(null);
        setPrompt('');
        setSelectedAction('');
        setError(null);
        setIsLoading(false);
        setIsGenerating(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleRandomPrompt = () => {
        if (allEditPrompts.length === 0) return;
        const randomIndex = Math.floor(Math.random() * allEditPrompts.length);
        const randomPrompt = allEditPrompts[randomIndex];
        setPrompt(randomPrompt);
        setSelectedAction(randomPrompt);
    };

    const handleGenerateRandomImage = async () => {
        handleReset();
    
        setIsGenerating(true);
        setError(null);
    
        try {
            const prompts = Object.values(preFilledPromptsForGeneration);
            const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
            
            const imageUrls = await generateImage(randomPrompt, '', '1:1', 1);
            
            const file = await dataUrlToFile(imageUrls[0], `random-image-${Date.now()}.png`);
            setOriginalImage(file);
            setOriginalImageUrl(URL.createObjectURL(file));
        } catch (e: any) {
            setError(e.message || "Une erreur est survenue lors de la génération de l'image.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleEdit = useCallback(async () => {
        if (!originalImage || !prompt || isLoading || !maskableImageRef.current) return;

        const compositedImageBase64 = maskableImageRef.current.getImageWithMask();
        if (!compositedImageBase64) {
            setError("Impossible d'obtenir l'image avec le masque.");
            return;
        }

        setIsLoading(true);
        setError(null);
        
        const base64Data = compositedImageBase64.split(',')[1];
        const fullPrompt = `Dans l'image suivante, modifie la zone mise en évidence en rose vif pour qu'elle corresponde à cette description : "${prompt}". Important : Renvoie l'image finale COMPLÈTE et MODIFIÉE, sans le surlignage rose.`;

        try {
            const result = await editImage(base64Data, originalImage.type, fullPrompt);
            setEditedImageUrl(result.imageUrl);
        } catch (e: any) {
            setError(e.message || "Une erreur inconnue est survenue lors de la modification.");
        } finally {
            setIsLoading(false);
        }
    }, [originalImage, prompt, isLoading]);

    const handleContinueEditing = useCallback(async () => {
        if (!editedImageUrl) return;
        
        try {
            const file = await dataUrlToFile(editedImageUrl, `edited-image-${Date.now()}.png`);
            
            setOriginalImage(file);
            setOriginalImageUrl(URL.createObjectURL(file));
            
            setEditedImageUrl(null);
            setError(null);
            setPrompt('');
            setSelectedAction('');

        } catch (e) {
            setError("Impossible de continuer la modification.");
            console.error("Erreur lors de la préparation de l'image suivante:", e);
        }
    }, [editedImageUrl]);

    const handleDiscardEdit = useCallback(() => {
        setEditedImageUrl(null);
        setError(null);
    }, []);

    const handlePredefinedEditChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedPrompt = e.target.value;
        setSelectedAction(selectedPrompt);
        setPrompt(selectedPrompt);
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="bg-bunker-100 dark:bg-bunker-900 p-6 rounded-xl shadow-lg">
                <div className="flex flex-col gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                           <label className="font-semibold block text-lg">1. Préparez votre image</label>
                            <HelpTooltip title="Comment utiliser l'Éditeur ?">
                                <ol>
                                    <li><strong>Préparez votre image :</strong> Importez une image de votre appareil ou générez-en une aléatoirement. Vous pouvez aussi envoyer une image depuis l'onglet "Générateur".</li>
                                    <li><strong>Décrivez la modification :</strong> Expliquez ce que vous voulez changer. Utilisez les actions rapides pour des idées ou écrivez votre propre instruction (ex: <code>ajoute un chapeau de pirate</code>).</li>
                                    <li><strong>Peignez la zone :</strong> Utilisez votre souris pour colorier en rose la partie de l'image que vous souhaitez modifier. Ajustez la taille du pinceau si besoin.</li>
                                    <li><strong>Modifier :</strong> Cliquez pour appliquer vos changements. Une comparaison "Avant/Après" apparaîtra. Vous pourrez alors télécharger le résultat ou continuer les modifications.</li>
                                </ol>
                            </HelpTooltip>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-bunker-50 dark:bg-bunker-950 rounded-lg border border-bunker-200 dark:border-bunker-800">
                            <div className="flex-1 w-full">
                                <p className="text-sm font-medium mb-2 text-bunker-700 dark:text-bunker-300">Choisissez une image locale</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    id="image-upload"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="block w-full text-sm text-bunker-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 dark:file:bg-sky-900/30 dark:file:text-sky-300 dark:hover:file:bg-sky-900/50"
                                />
                            </div>
                            <p className="text-bunker-500 dark:text-bunker-400 font-bold">OU</p>
                            <div className="flex-1 w-full">
                                <p className="text-sm font-medium mb-2 text-bunker-700 dark:text-bunker-300">Générez une image aléatoire</p>
                                <button onClick={handleGenerateRandomImage} disabled={isGenerating || isLoading} className="w-full py-2 px-4 bg-bunker-500 text-bunker-100 font-semibold rounded-lg hover:bg-bunker-600 dark:bg-bunker-700 dark:hover:bg-bunker-600 transition-colors shadow-md flex items-center justify-center gap-2 disabled:bg-bunker-400 dark:disabled:bg-bunker-600 disabled:cursor-not-allowed">
                                    {isGenerating ? (
                                        <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                    ) : (
                                        <SparklesIcon className="w-5 h-5" />
                                    )}
                                    <span>{isGenerating ? 'Génération...' : 'Image aléatoire'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="predefined-edits" className="font-semibold block mb-2 text-lg">2. Décrivez votre modification</label>
                        <div className="space-y-4">
                           <div className="flex flex-col sm:flex-row gap-4">
                                <select 
                                    id="predefined-edits"
                                    value={selectedAction}
                                    onChange={handlePredefinedEditChange}
                                    disabled={!originalImage || isLoading || isGenerating}
                                    className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors"
                                >
                                    <option value="">Choisissez une action rapide...</option>
                                    {predefinedEdits.map(group => (
                                        <optgroup key={group.category} label={group.category}>
                                            {group.options.map(option => (
                                                <option key={option.label} value={option.prompt}>{option.label}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                           </div>
                            <div className="flex gap-4 items-start">
                                <div className="flex-grow">
                                    <input
                                        type="text"
                                        id="edit-prompt"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="... ou écrivez une instruction personnalisée ici"
                                        className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors"
                                        disabled={!originalImage || isLoading || isGenerating}
                                    />
                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={handleRandomPrompt}
                                            disabled={isLoading || isGenerating}
                                            className="flex items-center gap-1.5 text-sm font-medium text-sky-600 dark:text-sky-500 hover:text-sky-700 dark:hover:text-sky-400 transition-colors disabled:text-bunker-400 dark:disabled:text-bunker-500 disabled:cursor-not-allowed"
                                            title="Suggérer une modification aléatoire"
                                        >
                                            <DiceIcon className="w-4 h-4" />
                                            <span>Prompt aléatoire</span>
                                        </button>
                                    </div>
                                </div>
                                <button onClick={handleEdit} disabled={isLoading || !prompt || !originalImage || isGenerating} className="py-3 px-6 bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-sky-700 disabled:bg-bunker-400 dark:disabled:bg-bunker-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg">
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                    ) : (
                                        <PencilIcon className="w-6 h-6" />
                                    )}
                                    <span>Modifier</span>
                                </button>
                                <button
                                    onClick={handleReset}
                                    disabled={(!originalImage && !originalImageUrl) || isLoading || isGenerating}
                                    className="p-3 bg-bunker-500 text-bunker-100 font-bold rounded-lg flex items-center justify-center hover:bg-bunker-600 dark:bg-bunker-700 dark:hover:bg-bunker-600 disabled:bg-bunker-400 dark:disabled:bg-bunker-600 disabled:cursor-not-allowed transition-colors shadow-lg"
                                    aria-label="Réinitialiser"
                                    title="Réinitialiser"
                                >
                                    <ArrowUturnLeftIcon className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {originalImage && !editedImageUrl && (
                    <div className="mt-6 pt-6 border-t border-bunker-200 dark:border-bunker-800 flex items-center gap-4">
                        <label htmlFor="brush-size" className="font-semibold">3. Peignez la zone à modifier</label>
                        <input
                            type="range"
                            id="brush-size"
                            min="5"
                            max="100"
                            value={brushSize}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-48 h-2 bg-bunker-200 dark:bg-bunker-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
                        />
                        <span className="text-sm">{brushSize}px</span>
                    </div>
                )}
            </div>

            <div className="bg-bunker-100 dark:bg-bunker-900 rounded-xl shadow-lg flex items-center justify-center p-6 min-h-[calc(50vh)]">
                <div className="w-full max-w-3xl mx-auto text-center">
                    {(() => {
                        if (isLoading || isGenerating) {
                            return (
                                <div className="text-center">
                                    <div className="w-12 h-12 border-4 border-t-transparent border-sky-500 rounded-full animate-spin mx-auto"></div>
                                    <p className="mt-4 font-semibold">{isGenerating ? "Génération de l'image..." : "Modification en cours..."}</p>
                                </div>
                            );
                        }
                        if (error) {
                            return <p className="text-red-500 font-semibold">{error}</p>;
                        }
                        if (originalImageUrl && editedImageUrl) {
                            return (
                                <div>
                                    <h3 className="text-xl font-bold mb-4">Comparez Avant / Après</h3>
                                    <ImageComparisonSlider beforeSrc={originalImageUrl} afterSrc={editedImageUrl} />
                                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                                        <button onClick={handleDiscardEdit} className="bg-red-600 text-white py-2 px-4 rounded-lg transition-all flex items-center gap-2 shadow-lg hover:bg-red-700" title="Annuler et revenir à l'édition"><XCircleIcon className="w-5 h-5" /><span>Annuler</span></button>
                                        <button onClick={handleContinueEditing} className="bg-bunker-100 dark:bg-bunker-800 text-bunker-900 dark:text-bunker-100 py-2 px-4 rounded-lg transition-all flex items-center gap-2 shadow-lg hover:bg-bunker-200 dark:hover:bg-bunker-700" title="Continuer les modifications"><PencilIcon className="w-5 h-5" /><span>Continuer</span></button>
                                        <button onClick={() => setIsPopupOpen(true)} className="bg-bunker-100 dark:bg-bunker-800 text-bunker-900 dark:text-bunker-100 py-2 px-4 rounded-lg transition-all flex items-center gap-2 shadow-lg hover:bg-bunker-200 dark:hover:bg-bunker-700" title="Voir en taille réelle"><MagnifyingGlassIcon className="w-5 h-5" /><span>Agrandir</span></button>
                                        <a href={editedImageUrl} download="modification-ia.png" className="bg-sky-600 text-white py-2 px-4 rounded-lg transition-all flex items-center gap-2 shadow-lg hover:bg-sky-700">
                                            <DownloadIcon className="w-5 h-5" />
                                            <span>Télécharger</span>
                                        </a>
                                    </div>
                                </div>
                            );
                        }
                        if (originalImageUrl) {
                            return (
                                <div>
                                    <h3 className="text-xl font-bold mb-4">Image Originale</h3>
                                    <div className="w-full aspect-square relative">
                                        <MaskableImage ref={maskableImageRef} src={originalImageUrl} brushSize={brushSize} />
                                    </div>
                                </div>
                            );
                        }
                        return <p className="text-bunker-500 dark:text-bunker-400">Veuillez charger ou générer une image pour commencer l'édition.</p>;
                    })()}
                </div>
            </div>

            {isPopupOpen && editedImageUrl && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsPopupOpen(false)}>
                    <button className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-black/80 transition-colors z-50" onClick={() => setIsPopupOpen(false)} aria-label="Fermer">
                         <XMarkIcon className="w-6 h-6" />
                    </button>
                    <div className="relative w-full h-full overflow-auto" onClick={(e) => e.stopPropagation()}>
                        <img src={editedImageUrl} alt="Image modifiée en taille réelle" className="max-w-none max-h-none mx-auto my-auto block"/>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageEditor;