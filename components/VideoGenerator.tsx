import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateVideo } from '../services/geminiService';
import { SparklesIcon, VideoCameraIcon, DownloadIcon } from './Icons';
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
    const [prompt, setPrompt] = useState('');
    const [model, setModel] = useState<VideoModel>('veo-3.1-fast-generate-preview');
    const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
    const [resolution, setResolution] = useState<VideoResolution>('720p');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const loadingIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (generatedVideoUrl) {
                URL.revokeObjectURL(generatedVideoUrl);
            }
            if (loadingIntervalRef.current) {
                clearInterval(loadingIntervalRef.current);
            }
        };
    }, [generatedVideoUrl]);

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

    const handleGenerate = useCallback(async () => {
        if (!prompt || isLoading) return;

        setIsLoading(true);
        setError(null);
        if (generatedVideoUrl) {
            URL.revokeObjectURL(generatedVideoUrl);
        }
        setGeneratedVideoUrl(null);
        
        try {
            const videoUrl = await generateVideo(prompt, model, aspectRatio, resolution);
            setGeneratedVideoUrl(videoUrl);
            onUsageUpdate(5); // La génération vidéo est plus coûteuse
        } catch (e: any) {
            setError(e.message || "Une erreur inconnue est survenue.");
        } finally {
            setIsLoading(false);
        }
    }, [prompt, model, aspectRatio, resolution, isLoading, onUsageUpdate, generatedVideoUrl]);

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

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-bunker-100 dark:bg-bunker-900 p-4 sm:p-6 rounded-xl shadow-lg">
                    <h2 className="text-2xl font-bold mb-4 text-sky-600 dark:text-sky-500 flex items-center gap-2">
                        <span>Générateur Vidéo</span>
                        <HelpTooltip title="Comment générer une vidéo ?">
                            <p>Donnez vie à vos idées en quelques étapes :</p>
                            <ol>
                                <li><strong>Instruction (Prompt) :</strong> Décrivez la scène, l'action ou le concept de votre vidéo. Soyez aussi imaginatif que possible !</li>
                                <li><strong>Modèle :</strong> Choisissez "Rapide" pour des tests et des itérations rapides, ou "Standard" pour une qualité potentiellement supérieure (mais plus lente).</li>
                                <li><strong>Format & Résolution :</strong> Sélectionnez le format (paysage ou portrait) et la qualité souhaitée pour votre vidéo.</li>
                                <li><strong>Générer :</strong> Lancez la création. Ce processus peut prendre plusieurs minutes. Un peu de patience, la magie opère !</li>
                            </ol>
                        </HelpTooltip>
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="prompt" className="font-semibold">Votre Instruction (Prompt)</label>
                            <textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Ex: Un chaton DJ avec des lunettes de soleil dans une discothèque spatiale..."
                                className="w-full h-32 p-3 mt-2 bg-bunker-200 dark:bg-bunker-800 border border-bunker-300 dark:border-bunker-700 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none transition-colors"
                            />
                        </div>

                        {renderOptionGroup("Modèle VEO 3.1", ['veo-3.1-fast-generate-preview', 'veo-3.1-generate-preview'], model, setModel)}
                        {renderOptionGroup("Format", ['16:9', '9:16'], aspectRatio, setAspectRatio)}
                        {renderOptionGroup("Résolution", ['720p', '1080p'], resolution, setResolution)}
                    </div>

                    <div className="mt-8">
                        <button onClick={handleGenerate} disabled={isLoading || !prompt} className="w-full py-3 px-4 bg-sky-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-sky-700 disabled:bg-bunker-400 dark:disabled:bg-bunker-600 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg">
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                    <span>Génération en cours...</span>
                                </>
                            ) : (
                                <>
                                    <SparklesIcon className="w-6 h-6" />
                                    <span>Générer la Vidéo</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-3 bg-bunker-100 dark:bg-bunker-900 p-4 sm:p-6 rounded-xl shadow-lg flex items-center justify-center min-h-[400px] lg:min-h-0">
                <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-bunker-300 dark:border-bunker-700 rounded-lg p-4 transition-all duration-300">
                    {isLoading && (
                        <div className="text-center">
                            <div className="w-12 h-12 border-4 border-t-transparent border-sky-500 rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 font-semibold text-lg">La magie est en cours...</p>
                            <p className="mt-2 text-sm text-bunker-500 dark:text-bunker-400 min-h-[2em]">{loadingMessage}</p>
                        </div>
                    )}
                    {error && <p className="text-red-500 font-semibold text-center">{error}</p>}
                    {!isLoading && !error && generatedVideoUrl && (
                        <div className="w-full h-full flex flex-col gap-4">
                            <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full rounded-lg bg-black" />
                            <a 
                                href={generatedVideoUrl} 
                                download="video-ia-creatif.mp4"
                                className="w-full text-center py-2 px-4 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-md flex items-center justify-center gap-2"
                            >
                                <DownloadIcon className="w-5 h-5"/>
                                <span>Télécharger la Vidéo</span>
                            </a>
                        </div>
                    )}
                    {!isLoading && !error && !generatedVideoUrl && (
                        <div className="text-center text-bunker-500 dark:text-bunker-400">
                             <VideoCameraIcon className="w-16 h-16 mx-auto text-bunker-400 dark:text-bunker-600"/>
                            <h3 className="mt-4 text-xl font-semibold">Votre vidéo apparaîtra ici</h3>
                            <p className="mt-1">Décrivez une scène et cliquez sur "Générer".</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoGenerator;
