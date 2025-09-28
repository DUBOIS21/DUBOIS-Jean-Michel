
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { editImage, generateImage } from '../services/geminiService';
import MaskableImage from './MaskableImage';
import ImageComparisonSlider from './ImageComparisonSlider';
import { AspectRatio } from '../types';

const ArrowUturnLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
    </svg>
);

const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const MagnifyingGlassIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
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

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);


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

const useCases = {
    category: "🖼️ Cas d'utilisation",
    options: [
      { label: "Cas 1: Illustration à la figure", prompt: "Illustration à la figure" },
      { label: "Cas 2: Générer une vue au sol à partir d'une flèche de carte", prompt: "Générer une vue au sol à partir d'une flèche de carte" },
      { label: "Cas 3: Informations de réalité augmentée", prompt: "Informations de réalité augmentée" },
      { label: "Cas 4: Extraire des bâtiments 3D/Créer des modèles isométriques", prompt: "Extraire des bâtiments 3D/Créer des modèles isométriques" },
      { label: "Cas 5: Photos de vous à différentes époques", prompt: "Photos de vous à différentes époques" },
      { label: "Cas 6: Génération d'images multi références", prompt: "Génération d'images multi références" },
      { label: "Cas 7: Retouche photo automatique", prompt: "Retouche photo automatique" },
      { label: "Cas 8: Le dessin à la main contrôle les poses multi-personnages", prompt: "Le dessin à la main contrôle les poses multi-personnages" },
      { label: "Cas 9: Génération d'images à vue croisée", prompt: "Génération d'images à vue croisée" },
      { label: "Cas 10: Autocollants de personnages personnalisés", prompt: "Autocollants de personnages personnalisés" },
      { label: "Cas 11: Anime à Real Coser", prompt: "Anime à Real Coser" },
      { label: "Cas 12: Générer la conception du personnage", prompt: "Générer la conception du personnage" },
      { label: "Cas 13: Dessin au trait avec palette de couleurs", prompt: "Dessin au trait avec palette de couleurs" },
      { label: "Cas 14: Infographie de l'article", prompt: "Infographie de l'article" },
      { label: "Cas 15: Changer plusieurs coiffures", prompt: "Changer plusieurs coiffures" },
      { label: "Cas 16: Diagramme explicatif des annotations du modèle", prompt: "Diagramme explicatif des annotations du modèle" },
      { label: "Cas 17: Sculpture en marbre personnalisée", prompt: "Sculpture en marbre personnalisée" },
      { label: "Cas 18: Cuisiner à partir d'ingrédients", prompt: "Cuisiner à partir d'ingrédients" },
      { label: "Cas 19: Raisonnement sur des problèmes mathématiques", prompt: "Raisonnement sur des problèmes mathématiques" },
      { label: "Cas 20: Colorisation d'une ancienne photo", prompt: "Colorisation d'une ancienne photo" },
      { label: "Cas 21: Tenue OOTD", prompt: "Tenue OOTD" },
      { label: "Cas 22: Changement de vêtements de personnage", prompt: "Changement de vêtements de personnage" },
      { label: "Cas 23: Génération de résultats multi-vues", prompt: "Génération de résultats multi-vues" },
      { label: "Cas 24: Storyboard de film", prompt: "Storyboard de film" },
      { label: "Cas 25: Modification de la pose du personnage", prompt: "Modification de la pose du personnage" },
      { label: "Cas 26: Générer une image à partir d'un dessin au trait", prompt: "Générer une image à partir d'un dessin au trait" },
      { label: "Cas 27: Ajouter un filigrane à l'image", prompt: "Ajouter un filigrane à l'image" },
      { label: "Cas 28: Génération d'images par raisonnement intellectuel", prompt: "Génération d'images par raisonnement intellectuel" },
      { label: "Cas 29: Annotations au stylo rouge", prompt: "Annotations au stylo rouge" },
      { label: "Cas 30: Nourriture explosive", prompt: "Nourriture explosive" },
      { label: "Cas 31: Créer une bande dessinée", prompt: "Créer une bande dessinée" },
      { label: "Cas 32: Figurine d'action", prompt: "Figurine d'action" },
      { label: "Cas 33: Carte des bâtiments isométriques", prompt: "Carte des bâtiments isométriques" },
      { label: "Cas 34: L'image de référence contrôle l'expression de caractère", prompt: "L'image de référence contrôle l'expression de caractère" },
      { label: "Cas 35: Processus de dessin d'illustration en quatre panneaux", prompt: "Processus de dessin d'illustration en quatre panneaux" },
      { label: "Cas 36: Essai de maquillage virtuel", prompt: "Essai de maquillage virtuel" },
      { label: "Cas 37: Analyse du maquillage", prompt: "Analyse du maquillage" },
      { label: "Cas 38: Vue Google Maps de la Terre du Milieu", prompt: "Vue Google Maps de la Terre du Milieu" },
      { label: "Cas 39: Génération d'illustrations typographiques", prompt: "Génération d'illustrations typographiques" },
      { label: "Cas 40: Génération de poses de personnages multiples", prompt: "Génération de poses de personnages multiples" },
      { label: "Cas 41: Génération d'emballages de produits", prompt: "Génération d'emballages de produits" },
      { label: "Cas 42: Filtre/matériau de superposition", prompt: "Filtre/matériau de superposition" },
      { label: "Cas 43: Contrôler la forme du visage du personnage", prompt: "Contrôler la forme du visage du personnage" },
      { label: "Cas 44: Contrôle de l'éclairage", prompt: "Contrôle de l'éclairage" },
      { label: "Cas 45: Figurine LEGO", prompt: "Figurine LEGO" },
      { label: "Cas 46: Figurine modèle Gundam", prompt: "Figurine modèle Gundam" },
      { label: "Cas 47: Vue éclatée du matériel", prompt: "Vue éclatée du matériel" },
      { label: "Cas 48: Annotation des calories alimentaires", prompt: "Annotation des calories alimentaires" },
      { label: "Cas 49: Extraire le sujet et le placer sur un calque transparent", prompt: "Extraire le sujet et le placer sur un calque transparent" },
      { label: "Cas 50: Réparation de l'image décolorée", prompt: "Réparation de l'image décolorée" },
      { label: "Cas 51: Carte ancienne → Photo de scène historique", prompt: "Carte ancienne → Photo de scène historique" },
      { label: "Cas 52: Collage de Moodboard de mode", prompt: "Collage de Moodboard de mode" },
      { label: "Cas 53: Photo de produit délicate et mignonne", prompt: "Photo de produit délicate et mignonne" },
      { label: "Cas 54: Placer une statue d'anime dans la vie réelle", prompt: "Placer une statue d'anime dans la vie réelle" },
      { label: "Cas 55: Créer une voiture Itasha", prompt: "Créer une voiture Itasha" },
      { label: "Cas 56: Composition de manga", prompt: "Composition de manga" },
      { label: "Cas 57: Conversion de style manga", prompt: "Conversion de style manga" },
      { label: "Cas 58: Wireframe holographique isométrique", prompt: "Wireframe holographique isométrique" },
      { label: "Cas 59: Génération de scènes de style Minecraft", prompt: "Génération de scènes de style Minecraft" },
      { label: "Cas 60: Appliquer Material Sphere au logo", prompt: "Appliquer Material Sphere au logo" },
      { label: "Cas 61: Plan d'étage", prompt: "Plan d'étage" },
      { label: "Cas 62: Réinitialiser les paramètres de l'appareil photo", prompt: "Réinitialiser les paramètres de l'appareil photo" },
      { label: "Cas 63: Créer une photo d'identité", prompt: "Créer une photo d'identité" },
      { label: "Cas 64: Carte pliante Scène A6", prompt: "Carte pliante Scène A6" },
      { label: "Cas 65: Concevoir un jeu d'échecs", prompt: "Concevoir un jeu d'échecs" },
      { label: "Cas 66: Photo de style contraste fractionné", prompt: "Photo de style contraste fractionné" },
      { label: "Cas 67: Conception d'une collection de bijoux", prompt: "Conception d'une collection de bijoux" },
      { label: "Cas 68: Conception de produits dérivés", prompt: "Conception de produits dérivés" },
      { label: "Cas 69: Projection holographique du modèle", prompt: "Projection holographique du modèle" },
      { label: "Cas 70: Échafaudage à figures géantes", prompt: "Échafaudage à figures géantes" },
      { label: "Cas 71: Extraction d'un bâtiment à partir d'une image de télédétection", prompt: "Extraction d'un bâtiment à partir d'une image de télédétection" },
      { label: "Cas 72: Extraction de composants", prompt: "Extraction de composants" },
      { label: "Cas 73: Supprimer les ingrédients du burger", prompt: "Supprimer les ingrédients du burger" },
      { label: "Cas 74: Restauration d'image haute résolution", prompt: "Restauration d'image haute résolution" },
      { label: "Cas 75: Générer une scène miniature à partir d'une image", prompt: "Générer une scène miniature à partir d'une image" },
      { label: "Cas 76: Bande dessinée éducative", prompt: "Bande dessinée éducative" },
      { label: "Cas 77: Génération d'un pack d'émojis de personnages personnalisés", prompt: "Génération d'un pack d'émojis de personnages personnalisés" },
      { label: "Cas 78: Restaurer un aliment partiellement consommé", prompt: "Restaurer un aliment partiellement consommé" },
      { label: "Cas 79: Création d'interface de jeu de combat", prompt: "Création d'interface de jeu de combat" },
      { label: "Cas 80: Coupe transversale du modèle", prompt: "Coupe transversale du modèle" },
      { label: "Cas 81: Avis de recherche de pirate", prompt: "Avis de recherche de pirate" },
      { label: "Cas 82: Présentoir de marchandises", prompt: "Présentoir de marchandises" },
      { label: "Cas 83: Stand de convention de bandes dessinées", prompt: "Stand de convention de bandes dessinées" },
      { label: "Cas 84: Dessin au trait en dessin griffonné", prompt: "Dessin au trait en dessin griffonné" },
      { label: "Cas 85: Espace d'exposition d'art contemporain", prompt: "Espace d'exposition d'art contemporain" },
      { label: "Cas 86: Carte de tarot gothique sombre", prompt: "Carte de tarot gothique sombre" },
      { label: "Cas 87: Graphique d'évolution en noir et blanc", prompt: "Graphique d'évolution en noir et blanc" },
      { label: "Cas 88: Souvenir en bouteille de verre", prompt: "Souvenir en bouteille de verre" },
      { label: "Cas 89: Magasin miniature", prompt: "Magasin miniature" },
      { label: "Cas 90: Devenir un Vtuber", prompt: "Devenir un Vtuber" },
      { label: "Cas 91: Affiche du film « Train Station »", prompt: "Affiche du film « Train Station »" },
      { label: "Cas 92: Movie Lounge", prompt: "Movie Lounge" },
      { label: "Cas 93: Trancher un objet avec un effet d'explosion de dessin animé", prompt: "Trancher un objet avec un effet d'explosion de dessin animé" },
      { label: "Cas 94: Train à thème de personnages", prompt: "Train à thème de personnages" },
      { label: "Cas 95: Parc à thème personnalisé", prompt: "Parc à thème personnalisé" },
      { label: "Cas 96: Créer une image de constellation", prompt: "Créer une image de constellation" },
      { label: "Cas 97: Transformer une image en fond d'écran", prompt: "Transformer une image en fond d'écran" },
      { label: "Cas 98: Créer une affiche de film", prompt: "Créer une affiche de film" },
      { label: "Cas 99: Transformer un compte X en disquette", prompt: "Transformer un compte X en disquette" },
      { label: "Cas 100: Rendre l'objet image de référence transparent", prompt: "Rendre l'objet image de référence transparent" },
      { label: "Cas 101: Illustration d'un judas fisheye", prompt: "Illustration d'un judas fisheye" },
      { label: "Cas 102: Design d'intérieur de super-héros", prompt: "Design d'intérieur de super-héros" },
      { label: "Cas 103: Machine à griffes personnalisée", prompt: "Machine à griffes personnalisée" },
      { label: "Cas 104: Conception de logo typographique", prompt: "Conception de logo typographique" },
      { label: "Cas 105: Interface utilisateur de statut de personnage RPG", prompt: "Interface utilisateur de statut de personnage RPG" },
      { label: "Cas 106: Convertir un diagramme de texte en pictogrammes", prompt: "Convertir un diagramme de texte en pictogrammes" },
      { label: "Cas 107: Dessiner sur un écran à stylet", prompt: "Dessiner sur un écran à stylet" },
      { label: "Cas 108: Créer une image de tampon LINE", prompt: "Créer une image de tampon LINE" },
      { label: "Cas 109: Thérapie pour le soi enfantin", prompt: "Thérapie pour le soi enfantin" },
      { label: "Cas 110: Portrait de style Pixar", prompt: "Portrait de style Pixar" },
    ]
};

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
    const [selectedUseCase, setSelectedUseCase] = useState<string>('');
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
            setOriginalImage(file);
            setOriginalImageUrl(URL.createObjectURL(file));
            setEditedImageUrl(null);
            setError(null);
        }
    };

    const handleReset = useCallback(() => {
        setOriginalImage(null);
        setOriginalImageUrl(null);
        setEditedImageUrl(null);
        setPrompt('');
        setSelectedAction('');
        setSelectedUseCase('');
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
        setSelectedUseCase('');
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
            setSelectedUseCase('');

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
        setSelectedUseCase('');
    };

    const handleUseCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedPrompt = e.target.value;
        setSelectedUseCase(selectedPrompt);
        setPrompt(selectedPrompt);
        setSelectedAction('');
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="bg-bunker-100 dark:bg-bunker-900 p-6 rounded-xl shadow-lg">
                <div className="flex flex-col gap-6">
                    <div>
                        <label className="font-semibold block mb-2 text-lg">1. Préparez votre image</label>
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
                                    className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
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
                                <select
                                    id="use-cases"
                                    value={selectedUseCase}
                                    onChange={handleUseCaseChange}
                                    disabled={!originalImage || isLoading || isGenerating}
                                    className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                                >
                                    <option value="">{useCases.category}...</option>
                                    {useCases.options.map(option => (
                                        <option key={option.label} value={option.prompt}>{option.label}</option>
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
                                        className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
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
                                <button onClick={handleEdit} disabled={isLoading || !prompt || !originalImage || isGenerating} className="py-3 px-6 bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-sky-700 disabled:bg-bunker-400 dark:disabled:bg-bunker-600 disabled:cursor-not-allowed transition-transform duration-200 transform hover:scale-105 shadow-lg">
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
                            className="w-48"
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
                                <div className="relative group">
                                    <h3 className="text-xl font-bold mb-4">Comparez Avant / Après</h3>
                                    <ImageComparisonSlider beforeSrc={originalImageUrl} afterSrc={editedImageUrl} />
                                    <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                                        <button onClick={handleDiscardEdit} className="bg-red-600 text-white p-3 rounded-lg transition-all flex items-center gap-2 shadow-lg hover:bg-red-700" title="Annuler et revenir à l'édition"><XCircleIcon className="w-5 h-5" /></button>
                                        <button onClick={handleContinueEditing} className="bg-bunker-100 dark:bg-bunker-800 text-bunker-900 dark:text-bunker-100 p-3 rounded-lg transition-all flex items-center gap-2 shadow-lg hover:bg-bunker-200 dark:hover:bg-bunker-700" title="Continuer les modifications"><PencilIcon className="w-5 h-5" /></button>
                                        <button onClick={() => setIsPopupOpen(true)} className="bg-bunker-100 dark:bg-bunker-800 text-bunker-900 dark:text-bunker-100 p-3 rounded-lg transition-all flex items-center gap-2 shadow-lg hover:bg-bunker-200 dark:hover:bg-bunker-700" title="Voir en taille réelle"><MagnifyingGlassIcon className="w-5 h-5" /></button>
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
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
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
