import React, { useState, useRef } from 'react';
import { describeImage } from '../services/geminiService';
import { PhotoIcon, XMarkIcon, SparklesIcon, ClipboardIcon, CheckIcon } from './Icons';
import HelpTooltip from './HelpTooltip';

const PromptBuilder: React.FC = () => {
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [promptCopied, setPromptCopied] = useState(false);
    const uploadInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedImage(file);
            setGeneratedPrompt('');
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setUploadedImage(null);
        setUploadedImageUrl(null);
        setGeneratedPrompt('');
        setError(null);
        if (uploadInputRef.current) {
            uploadInputRef.current.value = '';
        }
    };

    const handleDescribeImage = async () => {
        if (!uploadedImageUrl) return;

        setIsLoading(true);
        setError(null);
        setGeneratedPrompt('');

        try {
            const mimeType = uploadedImageUrl.match(/data:(.*);base64,/)?.[1] || 'image/png';
            const base64Data = uploadedImageUrl.split(',')[1];
            // FIX: Pass the required custom prompt to the describeImage function.
            const customPrompt = "Décris cette image avec un niveau de détail extrême, en te concentrant sur les éléments visuels, le style artistique, la composition, l'éclairage, la palette de couleurs et l'ambiance générale. Le but est de créer un prompt textuel qui pourrait être utilisé par une intelligence artificielle génératrice d'images pour recréer une image aussi similaire que possible.";
            const description = await describeImage(base64Data, mimeType, customPrompt);
            setGeneratedPrompt(description);
        } catch (e: any) {
            setError(e.message || "Une erreur est survenue lors de la description de l'image.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyPrompt = () => {
        if (!generatedPrompt) return;
        navigator.clipboard.writeText(generatedPrompt);
        setPromptCopied(true);
        setTimeout(() => setPromptCopied(false), 2000);
    };

    return (
        <div className="container mx-auto space-y-12">
            <input
                type="file"
                ref={uploadInputRef}
                onChange={handleImageUpload}
                className="hidden"
                accept="image/*"
            />
            
            <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-bold text-sky-600 dark:text-sky-500 inline-flex items-center gap-2">
                    <span>Créateur de Prompt par l'Image</span>
                    <HelpTooltip title="Qu'est-ce que le Créateur de Prompt ?">
                        <p>Vous avez une image que vous adorez et vous aimeriez en créer des variantes ? Cet outil est fait pour vous !</p>
                        <ol>
                            <li><strong>Importez une image :</strong> Cliquez sur la zone pour choisir une image de votre appareil.</li>
                            <li><strong>Décrivez l'image :</strong> L'IA va analyser l'image et générer une description textuelle (un "prompt") très détaillée.</li>
                            <li><strong>Utilisez le prompt :</strong> Copiez ce prompt et collez-le dans l'onglet "Générateur" pour créer des images dans le même style. C'est un excellent moyen de découvrir comment "pense" une IA !</li>
                        </ol>
                    </HelpTooltip>
                </h1>
                <p className="mt-2 text-lg text-bunker-600 dark:text-bunker-400">Transformez n'importe quelle image en un prompt détaillé pour l'IA.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="bg-bunker-100 dark:bg-bunker-900 p-6 rounded-xl shadow-lg flex flex-col items-center justify-center">
                    <div 
                        onClick={() => !uploadedImageUrl && uploadInputRef.current?.click()}
                        className={`w-full aspect-square max-w-md rounded-lg border-2 border-dashed border-bunker-300 dark:border-bunker-700 flex items-center justify-center transition-colors ${!uploadedImageUrl ? 'cursor-pointer hover:bg-bunker-200 dark:hover:bg-bunker-800' : ''} relative overflow-hidden bg-bunker-200/50 dark:bg-bunker-800/50`}
                    >
                        {!uploadedImageUrl ? (
                            <div className="text-center text-bunker-500 dark:text-bunker-400 p-4">
                                <PhotoIcon className="w-12 h-12 mx-auto" />
                                <p className="mt-2 font-semibold">Cliquez pour ajouter une image</p>
                                <p className="text-sm">Téléchargez une image pour en extraire un prompt.</p>
                            </div>
                        ) : (
                            <>
                                <img src={uploadedImageUrl} alt="Aperçu de l'image" className="w-full h-full object-contain" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                                    aria-label="Supprimer l'image"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
                
                <div className="bg-bunker-100 dark:bg-bunker-900 p-6 rounded-xl shadow-lg space-y-4">
                    <button
                        onClick={handleDescribeImage}
                        disabled={!uploadedImageUrl || isLoading}
                        className="w-full py-3 px-4 bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-sky-700 disabled:bg-bunker-400 dark:disabled:bg-bunker-600 disabled:cursor-not-allowed transition-transform duration-200 transform hover:scale-105 shadow-lg"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                <span>Analyse en cours...</span>
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="w-6 h-6" />
                                <span>Décrire l'image</span>
                            </>
                        )}
                    </button>
                    {error && <p className="text-red-500 text-center font-semibold">{error}</p>}
                    <div className="relative">
                        <textarea
                            readOnly
                            value={generatedPrompt}
                            placeholder="Le prompt détaillé généré par l'IA apparaîtra ici..."
                            className="w-full h-64 p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition resize-none"
                            aria-label="Prompt généré"
                        />
                        {generatedPrompt && (
                            <button
                                onClick={handleCopyPrompt}
                                title="Copier le prompt"
                                className="absolute top-2 right-2 p-2 bg-bunker-300 dark:bg-bunker-700 text-bunker-700 dark:text-bunker-200 font-semibold rounded-lg hover:bg-bunker-400 dark:hover:bg-bunker-600 transition-colors flex items-center justify-center gap-2"
                            >
                                {promptCopied ? (
                                    <>
                                        <CheckIcon className="w-5 h-5 text-green-500" />
                                    </>
                                ) : (
                                    <>
                                        <ClipboardIcon className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PromptBuilder;