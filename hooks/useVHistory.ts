import React, { useState, useCallback, useEffect, useRef } from 'react';
import { VHistoryEntry } from '../types';

export const resizeImage = (imageUrl: string, maxDimension: number = 256): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = img;

            if (width > height) {
                if (width > maxDimension) {
                    height *= maxDimension / width;
                    width = maxDimension;
                }
            } else {
                if (height > maxDimension) {
                    width *= maxDimension / height;
                    height = maxDimension;
                }
            }
            
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.warn("Impossible d'obtenir le contexte du canvas pour le redimensionnement. Utilisation de l'URL de l'image originale.");
                return resolve(imageUrl);
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.onerror = () => {
            console.warn("Impossible de charger l'image pour le redimensionnement (problème CORS ?). Utilisation de l'URL de l'image originale.");
            resolve(imageUrl);
        };
    });
};

export const saveHistorySafely = <T,>(storageKey: string, historyToSave: T[]): T[] | null => {
    let currentHistory = [...historyToSave];
    while (currentHistory.length > 0) {
        try {
            localStorage.setItem(storageKey, JSON.stringify(currentHistory));
            if (currentHistory.length < historyToSave.length) {
                console.warn(`Le quota de stockage local est dépassé. L'historique pour ${storageKey} a été automatiquement réduit à ${currentHistory.length} éléments.`);
            }
            return currentHistory;
        } catch (e: any) {
            if (e.name === 'QuotaExceededError' || String(e).toLowerCase().includes('quota')) {
                currentHistory.pop(); // Retire l'élément le plus ancien
            } else {
                console.error(`Impossible de sauvegarder l'historique dans ${storageKey}:`, e);
                return null;
            }
        }
    }

    if (historyToSave.length > 0) {
        console.error(`Impossible de sauvegarder la nouvelle entrée d'historique (potentiellement trop grande) dans ${storageKey}. L'historique n'a pas été modifié pour préserver son état.`);
        return null;
    } else {
        try {
            localStorage.setItem(storageKey, JSON.stringify([]));
            return [];
        } catch (e) {
            console.error(`Impossible de vider l'historique pour ${storageKey}:`, e);
            return null;
        }
    }
};


export const useVHistory = (storageKey: string) => {
    const [history, setHistory] = useState<VHistoryEntry[]>([]);
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);
    const importInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem(storageKey);
            if (savedHistory) {
                setHistory(JSON.parse(savedHistory));
            }
        } catch (e) {
            console.error(`Impossible de charger l'historique depuis ${storageKey}:`, e);
        }
    }, [storageKey]);

    const saveHistory = useCallback((historyToSave: VHistoryEntry[]): VHistoryEntry[] | null => {
        return saveHistorySafely<VHistoryEntry>(storageKey, historyToSave);
    }, [storageKey]);

    const addToHistory = useCallback(async (entry: Omit<VHistoryEntry, 'id' | 'timestamp'>) => {
        const resizedImageUrl = await resizeImage(entry.generatedImageUrl);
        
        let resizedBaseImageUrl: string | undefined = undefined;
        if (entry.baseImageUrl) {
            resizedBaseImageUrl = await resizeImage(entry.baseImageUrl);
        }

        setHistory(prevHistory => {
            const newEntry: VHistoryEntry = {
                ...entry,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                generatedImageUrl: resizedImageUrl,
                baseImageUrl: resizedBaseImageUrl,
            };
            const updatedHistory = [newEntry, ...prevHistory].slice(0, 50);
            return saveHistory(updatedHistory) ?? prevHistory;
        });
    }, [saveHistory]);

    const deleteFromHistory = useCallback((idToDelete: string) => {
        setHistory(prevHistory => {
            const updatedHistory = prevHistory.filter(entry => entry.id !== idToDelete);
            return saveHistory(updatedHistory) ?? prevHistory;
        });
    }, [saveHistory]);

    const clearHistory = useCallback(() => {
        setHistory(prev => {
            const cleared = saveHistory([]);
            return cleared === null ? prev : cleared;
        });
        setIsConfirmingClear(false);
    }, [saveHistory]);

    const exportHistory = useCallback(() => {
        if (history.length === 0) {
            alert("L'historique est vide.");
            return;
        }
        const dataStr = JSON.stringify(history, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${storageKey}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [history, storageKey]);

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const importedHistory: VHistoryEntry[] = JSON.parse(content);

                if (Array.isArray(importedHistory) && importedHistory.every(item => 'id' in item && 'finalPrompt' in item)) {
                    setHistory(prev => {
                        const existingIds = new Set(prev.map(p => p.id));
                        const newEntries = importedHistory.filter(i => !existingIds.has(i.id));
                        const merged = [...newEntries, ...prev].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
                        const saved = saveHistory(merged);
                        alert(`${newEntries.length} nouvelle(s) entrée(s) importée(s) avec succès.`);
                        return saved ?? prev;
                    });
                } else {
                    throw new Error("Format de fichier invalide.");
                }
            } catch (error: any) {
                alert(`Erreur: ${error.message || "Fichier invalide ou corrompu."}`);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    return {
        history,
        addToHistory,
        deleteFromHistory,
        clearHistory,
        exportHistory,
        importInputRef,
        handleImportFile,
        isConfirmingClear,
        setIsConfirmingClear,
    };
};