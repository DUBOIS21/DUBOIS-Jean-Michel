
import React, { useEffect } from 'react';
import { XMarkIcon, ChevronDownIcon } from './Icons';

interface GlobalHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <details className="group bg-bunker-50 dark:bg-bunker-950/50 p-3 rounded-lg border border-bunker-200 dark:border-bunker-800">
        <summary className="list-none flex justify-between items-center cursor-pointer font-semibold text-bunker-800 dark:text-bunker-200">
            {title}
            <ChevronDownIcon className="w-5 h-5 text-bunker-500 group-open:rotate-180 transition-transform duration-300" />
        </summary>
        <div className="mt-3 pt-3 border-t border-bunker-200 dark:border-bunker-800 text-sm text-bunker-700 dark:text-bunker-300 space-y-2 help-content">
            {children}
        </div>
    </details>
);

const GlobalHelpModal: React.FC<GlobalHelpModalProps> = ({ isOpen, onClose }) => {
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

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-help-title"
    >
        <div
            className="bg-bunker-100 dark:bg-bunker-900 rounded-xl shadow-2xl p-6 w-full max-w-2xl flex flex-col animate-fade-in-up-modal max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center flex-shrink-0">
                <h3 id="global-help-title" className="text-xl font-bold text-sky-600 dark:text-sky-500">Centre d'Aide</h3>
                <button onClick={onClose} aria-label="Fermer l'aide" className="p-1 rounded-full hover:bg-bunker-200 dark:hover:bg-bunker-800 transition-colors">
                   <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
            <div className="mt-4 flex-grow overflow-y-auto pr-2 space-y-2">
                <HelpSection title="Générateur d'Images">
                    <p>Suivez ces étapes pour donner vie à vos idées :</p>
                    <ol>
                        <li><strong>Instruction (Prompt) :</strong> Décrivez en détail ce que vous souhaitez créer. Soyez précis ! Utilisez le bouton 🎲 pour des idées.</li>
                        <li><strong>Style :</strong> Choisissez un style prédéfini ou combinez-le avec votre prompt pour affiner le rendu artistique.</li>
                        <li><strong>Options Avancées :</strong>
                            <ul>
                                <li><strong>Image(s) d'Inspiration :</strong> Importez jusqu'à 3 images pour guider l'IA.</li>
                                <li><strong>Prompt Négatif :</strong> Indiquez ce que vous ne voulez PAS voir (ex: <code>texte, flou</code>).</li>
                                <li><strong>Nombre & Format :</strong> Ajustez la quantité et les dimensions (désactivé si vous utilisez des images d'inspiration).</li>
                            </ul>
                        </li>
                        <li><strong>Générer :</strong> Cliquez pour lancer la création. Vos images apparaîtront à droite.</li>
                        <li><strong>Historique :</strong> Retrouvez vos créations passées en bas du panneau pour les recharger, télécharger ou supprimer.</li>
                    </ol>
                </HelpSection>

                <HelpSection title="Éditeur d'Images">
                    <ol>
                        <li><strong>Préparez votre image :</strong> Importez une image de votre appareil ou générez-en une aléatoirement. Vous pouvez aussi envoyer une image depuis l'onglet "Générateur".</li>
                        <li><strong>Décrivez la modification :</strong> Expliquez ce que vous voulez changer. Utilisez les actions rapides pour des idées ou écrivez votre propre instruction (ex: <code>ajoute un chapeau de pirate</code>).</li>
                        <li><strong>Peignez la zone :</strong> Utilisez votre souris pour colorier en rose la partie de l'image que vous souhaitez modifier. Ajustez la taille du pinceau si besoin.</li>
                        <li><strong>Modifier :</strong> Cliquez pour appliquer vos changements. Une comparaison "Avant/Après" apparaîtra. Vous pourrez alors télécharger le résultat ou continuer les modifications.</li>
                    </ol>
                </HelpSection>

                <HelpSection title="Créateur de Prompt par l'Image">
                    <p>Vous avez une image que vous adorez et vous aimeriez en créer des variantes ? Cet outil est fait pour vous !</p>
                    <ol>
                        <li><strong>Importez une image :</strong> Cliquez sur la zone pour choisir une image de votre appareil.</li>
                        <li><strong>Décrivez l'image :</strong> L'IA va analyser l'image et générer une description textuelle (un "prompt") très détaillée.</li>
                        <li><strong>Utilisez le prompt :</strong> Copiez ce prompt et collez-le dans l'onglet "Générateur" pour créer des images dans le même style. C'est un excellent moyen de découvrir comment "pense" une IA !</li>
                    </ol>
                </HelpSection>

                <HelpSection title="Exemples">
                     <ol>
                        <li><b>Prompt :</b> Décrivez votre image.</li>
                        <li><b>Améliorer (optionnel) :</b> Cliquez sur ✨ pour que l'IA enrichisse votre prompt.</li>
                        <li><b>Images d'influence (optionnel) :</b> Ajoutez jusqu'à 3 images pour guider le style ou le contenu.</li>
                        <li><b>Format :</b> Choisissez le format de sortie.</li>
                        <li><b>Générer :</b> Lancez la création.</li>
                        <li><b>Archiver :</b> Si le résultat vous plaît, cliquez sur "Archiver le Résultat" pour le sauvegarder.</li>
                    </ol>
                </HelpSection>

                 <HelpSection title="Générateur Vidéo">
                    <p>Donnez vie à vos idées en quelques étapes :</p>
                    <ol>
                        <li><strong>Déverrouiller :</strong> Cliquez sur la zone de texte et entrez le mot de passe pour activer la génération.</li>
                        <li><strong>Instruction (Prompt) :</strong> Décrivez la scène, l'action ou le concept de votre vidéo.</li>
                        <li><strong>Générer un Aperçu :</strong> Cliquez pour obtenir rapidement une version courte de votre vidéo. C'est idéal pour vérifier si l'IA a bien compris votre idée avant d'aller plus loin.</li>
                        <li><strong>Paramètres (optionnel) :</strong> Avant de générer la vidéo complète, vous pouvez ajuster le modèle, le format et la résolution pour une meilleure qualité.</li>
                        <li><strong>Générer la Vidéo Complète :</strong> Si l'aperçu vous plaît, lancez la génération finale. Ce processus peut prendre plusieurs minutes.</li>
                    </ol>
                </HelpSection>
            </div>
        </div>
        <style>{`
            @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
            .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
            @keyframes fade-in-up-modal { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
            .animate-fade-in-up-modal { animation: fade-in-up-modal 0.2s ease-out forwards; }
            .help-content ol, .help-content ul { padding-left: 1.25rem; list-style-position: outside; }
            .help-content ol { list-style-type: decimal; }
            .help-content ul { list-style-type: disc; }
            .help-content li { margin-top: 0.5em; margin-bottom: 0.5em; }
            .help-content strong { font-weight: 600; color: #0284c7; }
            .dark .help-content strong { color: #38bdf8; }
            .help-content code { font-size: 0.875em; font-weight: 600; padding: 0.2em 0.4em; margin: 0; border-radius: 0.25rem; background-color: #e8eaed; color: #0e1015; font-family: monospace; }
            .dark .help-content code { background-color: #383d46; color: #f4f5f6; }
        `}</style>
    </div>
  );
};

export default GlobalHelpModal;
