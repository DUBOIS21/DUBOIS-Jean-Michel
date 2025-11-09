import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateVideo } from '../services/geminiService';
import { SparklesIcon, VideoCameraIcon, DownloadIcon, PlayIcon, ArrowUturnLeftIcon } from './Icons';
import HelpTooltip from './HelpTooltip';

type VideoModel = 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';
type VideoAspectRatio = '16:9' | '9:16';
type VideoResolution = '720p' | '1080p';

interface VideoGeneratorProps {
    onUsageUpdate: (count: number) => void;
}

const loadingMessages = [
    "Initialisation du moteur de rendu vidéo...",
    "Allocation des ressources de calcul quantique...",
    "Consultation des muses de la créativité...",
    "L'IA est en train de rêver à votre vidéo...",
    "Assemblage des pixels en une histoire visuelle...",
    "Polissage des photons pour un rendu parfait...",
    "La génération peut prendre quelques minutes, merci de votre patience.",
    "Synchronisation des flux temporels pour votre scène...",
    "Ne quittez pas, la magie est en cours...",
];

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onUsageUpdate }) => {
    const [step, setStep] = useState<'prompt' | 'preview' | 'full'>('prompt');
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState<VideoModel>('veo-3.1-fast-generate-preview');
    const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
    const [resolution, setResolution] = useState<VideoResolution>('720p');

    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState<'preview' | 'full' | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');

    const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const loadingIntervalRef = useRef<number | null>(null);

    const [isUnlocked, setIsUnlocked] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const passwordRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const urlsToClean = [previewVideoUrl, generatedVideoUrl];
        return () => {
            urlsToClean.forEach(url => {
                if (url && url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
            if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
        };
    }, [previewVideoUrl, generatedVideoUrl]);

    useEffect(() => {
        if (isLoading) {
            let i = 0;
            setLoadingMessage(loadingMessages[0]);
            loadingIntervalRef.current = window.setInterval(() => {
                i = (i + 1) % loadingMessages.length;
                setLoadingMessage(loadingMessages[i]);
            }, 5000);
        } else {
            if (loadingIntervalRef.current) {
                clearInterval(loadingIntervalRef.current);
                loadingIntervalRef.current = null;
            }
        }
    }, [isLoading]);
    
    useEffect(() => {
        if (showPasswordModal) {
            setTimeout(() => passwordRef.current?.focus(), 100);
        }
    }, [showPasswordModal]);
    
    const handleReset = useCallback(() => {
        setStep('prompt');
        setPreviewVideoUrl(null);
        setGeneratedVideoUrl(null);
        setError(null);
        setIsLoading(false);
        setLoadingStep(null);
    }, []);

    const handlePromptInteraction = () => {
        if (!isUnlocked) {
            setShowPasswordModal(true);
        }
    };

    const handlePasswordCheck = (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordInput === 'dubois21') {
            setIsUnlocked(true);
            setShowPasswordModal(false);
            setPasswordError('');
            setPasswordInput('');
        } else {
            setPasswordError('Mot de passe incorrect.');
            setPasswordInput('');
        }
    };

    const handleGeneratePreview = useCallback(async () => {
        if (!prompt || isLoading || !isUnlocked) return;

        setIsLoading(true);
        setLoadingStep('preview');
        setError(null);
        setPreviewVideoUrl(null);
        
        try {
            // L'aperçu utilise toujours le modèle rapide et 720p pour la vitesse
            const videoUrl = await generateVideo(prompt, 'veo-3.1-fast-generate-preview', aspectRatio, '720p');
            setPreviewVideoUrl(videoUrl);
            onUsageUpdate(2); // L'aperçu est moins coûteux
            setStep('preview');
        } catch (e: any) {
            setError(e.message || "Une erreur inconnue est survenue lors de la génération de l'aperçu.");
        } finally {
            setIsLoading(false);
            setLoadingStep(null);
        }
    }, [prompt, aspectRatio, isLoading, onUsageUpdate, isUnlocked]);

    const handleGenerateFull = useCallback(async () => {
        if (!prompt || isLoading || !isUnlocked) return;

        setIsLoading(true);
        setLoadingStep('full');
        setError(null);
        setGeneratedVideoUrl(null);
        
        try {
            // La génération complète utilise les paramètres sélectionnés par l'utilisateur
            const videoUrl = await generateVideo(prompt, model, aspectRatio, resolution);
            setGeneratedVideoUrl(videoUrl);
            onUsageUpdate(5); // La génération complète est plus coûteuse
            setStep('full');
        } catch (e: any) {
            setError(e.message || "Une erreur inconnue est survenue lors de la génération complète.");
        } finally {
            setIsLoading(false);
            setLoadingStep(null);
        }
    }, [prompt, model, aspectRatio, resolution, isLoading, onUsageUpdate, isUnlocked]);

    const renderOptionGroup = (title: string, options: string[], selectedValue: string, setter: (value: any) => void) => (
        <div>
            <label className="font-semibold">{title}</label>
            <div className="flex flex-wrap gap-2 mt-2">
                {options.map(option => (
                    <button 
                        key={option} 
                        onClick={() => setter(option)} 
                        className={`py-2 px-4 rounded-lg text-sm transition-colors flex-1 ${selectedValue === option ? 'bg-sky-600 text-white font-bold' : 'bg-bunker-200 dark:bg-bunker-800 hover:bg-bunker-300 dark:hover:bg-bunker-700'}`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderControlPanel = () => {
        if (step === 'preview') {
            return (
                <div className="space-y-4">
                    <div>
                        <p className="font-semibold text-lg text-bunker-800 dark:text-bunker-200">Aperçu généré !</p>
                        <p className="text-sm text-bunker-600 dark:text-bunker-400">Le résultat vous plaît ? Vous pouvez maintenant lancer la génération complète avec les paramètres de qualité de votre choix.</p>
                    </div>
                     <div className="p-3 bg-bunker-50 dark:bg-bunker-950 rounded-lg border border-bunker-200 dark:border-bunker-800">
                        <p className="font-semibold text-sm">Prompt utilisé :</p>
                        <p className="text-sm text-bunker-700 dark:text-bunker-300 italic">"{prompt}"</p>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-bunker-200 dark:border-bunker-800">
                        <button onClick={handleGenerateFull} disabled={isLoading || !isUnlocked} className="w-full py-3 px-4 bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-sky-700 disabled:bg-bunker-400 disabled:cursor-not-allowed transform hover:scale-105">
                            <SparklesIcon className="w-6 h-6" />
                            <span>Générer la Vidéo Complète</span>
                        </button>
                        <button onClick={handleReset} disabled={isLoading} className="w-full py-2 px-4 bg-bunker-500 text-bunker-100 font-semibold rounded-lg hover:bg-bunker-600 flex items-center justify-center gap-2">
                            <ArrowUturnLeftIcon className="w-5 h-5" />
                            <span>Modifier le Prompt</span>
                        </button>
                    </div>
                </div>
            );
        }

        if (step === 'full') {
            return (
                <div className="text-center space-y-4">
                    <h3 className="text-xl font-bold text-green-500">Vidéo générée avec succès !</h3>
                    <p className="text-bunker-600 dark:text-bunker-400">Votre vidéo est prête. Vous pouvez la télécharger ou recommencer pour créer autre chose.</p>
                     <button onClick={handleReset} className="w-full py-3 px-4 bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-sky-700">
                        <SparklesIcon className="w-6 h-6" />
                        <span>Générer une autre vidéo</span>
                    </button>
                </div>
            );
        }

        // Default step: 'prompt'
        return (
            <div className="space-y-4">
                <div>
                    <label htmlFor="prompt" className="font-semibold">Votre Instruction (Prompt)</label>
                    <textarea
                        id="prompt"
                        value={prompt}
                        onFocus={handlePromptInteraction}
                        onChange={(e) => setPrompt(e.target.value)}
                        readOnly={!isUnlocked}
                        placeholder={isUnlocked ? "Ex: Un chaton DJ avec des lunettes de soleil..." : "Cliquez ici et entrez le mot de passe pour commencer..."}
                        className={`w-full h-32 p-3 mt-2 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors ${!isUnlocked ? 'cursor-pointer' : ''}`}
                    />
                </div>
                <details className="space-y-4 pt-4 border-t border-bunker-200 dark:border-bunker-800" open>
                    <summary className="font-semibold list-none cursor-pointer">Paramètres de la vidéo complète</summary>
                    <div className="space-y-4 mt-2">
                        {renderOptionGroup("Modèle VEO 3.1", ['veo-3.1-fast-generate-preview', 'veo-3.1-generate-preview'], model, setModel)}
                        {renderOptionGroup("Format", ['16:9', '9:16'], aspectRatio, setAspectRatio)}
                        {renderOptionGroup("Résolution", ['720p', '1080p'], resolution, setResolution)}
                    </div>
                </details>
                <div className="mt-4 pt-4 border-t border-bunker-200 dark:border-bunker-800">
                    <button onClick={handleGeneratePreview} disabled={isLoading || !prompt || !isUnlocked} className="w-full py-3 px-4 bg-teal-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-teal-700 disabled:bg-bunker-400 dark:disabled:bg-bunker-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg">
                        <PlayIcon className="w-6 h-6" />
                        <span>Générer un Aperçu (rapide)</span>
                    </button>
                    <p className="text-xs text-center mt-2 text-bunker-500 dark:text-bunker-400">Validez votre idée avec un aperçu rapide avant de lancer la génération complète.</p>
                </div>
            </div>
        );
    };
    
    const renderVideoPanel = () => {
        if (isLoading) {
             return (
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-t-transparent border-sky-500 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 font-semibold text-lg">
                        {loadingStep === 'preview' ? "Création de l'aperçu..." : "Génération de la vidéo..."}
                    </p>
                    <p className="mt-2 text-sm text-bunker-500 dark:text-bunker-400 min-h-[2em]">{loadingMessage}</p>
                </div>
            );
        }
        if (error) return <p className="text-red-500 font-semibold text-center">{error}</p>;
        
        if (step === 'full' && generatedVideoUrl) {
            return (
                <div className="w-full h-full flex flex-col gap-4">
                    <h3 className="text-xl font-bold text-center">Vidéo Complète</h3>
                    <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full rounded-lg bg-black" />
                    <a href={generatedVideoUrl} download="video-ia-creatif.mp4" className="w-full text-center py-2 px-4 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 shadow-md flex items-center justify-center gap-2">
                        <DownloadIcon className="w-5 h-5"/>
                        <span>Télécharger la Vidéo</span>
                    </a>
                </div>
            );
        }

        if (step === 'preview' && previewVideoUrl) {
            return (
                <div className="w-full h-full flex flex-col gap-4">
                    <h3 className="text-xl font-bold text-center">Aperçu Vidéo</h3>
                    <video src={previewVideoUrl} controls autoPlay loop className="w-full h-full rounded-lg bg-black" />
                </div>
            );
        }

        // Default 'prompt' step
        return (
            <div className="text-center text-bunker-500 dark:text-bunker-400">
                 <VideoCameraIcon className="w-16 h-16 mx-auto text-bunker-400 dark:text-bunker-600"/>
                <h3 className="mt-4 text-xl font-semibold">Votre vidéo apparaîtra ici</h3>
                <p className="mt-1">Décrivez une scène et générez d'abord un aperçu.</p>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-bunker-100 dark:bg-bunker-900 p-4 sm:p-6 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold mb-4 text-sky-600 dark:text-sky-500 flex items-center gap-2">
                        <span>Générateur Vidéo</span>
                        <HelpTooltip title="Comment générer une vidéo ?">
                            <p>Donnez vie à vos idées en quelques étapes :</p>
                            <ol>
                                <li><strong>Déverrouiller :</strong> Cliquez sur la zone de texte et entrez le mot de passe pour activer la génération.</li>
                                <li><strong>Instruction (Prompt) :</strong> Décrivez la scène, l'action ou le concept de votre vidéo.</li>
                                <li><strong>Générer un Aperçu :</strong> Cliquez pour obtenir rapidement une version courte de votre vidéo. C'est idéal pour vérifier si l'IA a bien compris votre idée avant d'aller plus loin.</li>
                                <li><strong>Paramètres (optionnel) :</strong> Avant de générer la vidéo complète, vous pouvez ajuster le modèle, le format et la résolution pour une meilleure qualité.</li>
                                <li><strong>Générer la Vidéo Complète :</strong> Si l'aperçu vous plaît, lancez la génération finale. Ce processus peut prendre plusieurs minutes.</li>
                            </ol>
                        </HelpTooltip>
                    </h2>
                    {renderControlPanel()}
                </div>
            </div>

            <div className="lg:col-span-3 bg-bunker-100 dark:bg-bunker-900 p-4 sm:p-6 rounded-xl shadow-lg flex items-center justify-center min-h-[400px] lg:min-h-0">
                <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-bunker-300 dark:border-bunker-700 rounded-lg p-4 transition-all duration-300">
                    {renderVideoPanel()}
                </div>
            </div>

            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}>
                    <div className="bg-bunker-100 dark:bg-bunker-900 rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-sky-600 dark:text-sky-500">Accès restreint</h3>
                        <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200">
                            <p className="font-bold">Attention</p>
                            <p>Cela utilise l'API qui est PAYANTE, donc cette section est verrouillée par défaut.</p>
                        </div>
                        <form onSubmit={handlePasswordCheck}>
                            <label htmlFor="video-password" className="font-semibold block mb-2">Mot de passe</label>
                            <input
                                ref={passwordRef}
                                id="video-password"
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="w-full p-3 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                            />
                            {passwordError && <p className="text-red-500 text-sm mt-2">{passwordError}</p>}
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setShowPasswordModal(false)} className="py-2 px-4 bg-bunker-200 dark:bg-bunker-800 font-semibold rounded-lg hover:bg-bunker-300 dark:hover:bg-bunker-700 transition-colors">Fermer</button>
                                <button type="submit" className="py-2 px-6 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 transition-colors">Déverrouiller</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoGenerator;