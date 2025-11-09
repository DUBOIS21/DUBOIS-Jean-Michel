
import { useState, useCallback, useEffect } from 'react';

export const useGenericItems = (storageKey: string, defaultItems: any[]) => {
    const getInitialItems = useCallback(() => {
        try {
            const savedCustomItems = localStorage.getItem(storageKey);
            if (savedCustomItems) {
                const parsedCustom = JSON.parse(savedCustomItems);
                if (Array.isArray(parsedCustom)) {
                    const defaultTitles = new Set(defaultItems.map(item => item.title));
                    const uniqueCustomItems = parsedCustom.filter(item => !defaultTitles.has(item.title));
                    return [...defaultItems, ...uniqueCustomItems];
                }
            }
        } catch (e) {
            console.error(`Impossible de charger les items depuis ${storageKey}:`, e);
            localStorage.removeItem(storageKey);
        }
        return defaultItems;
    }, [storageKey, defaultItems]);

    const [items, setItems] = useState(getInitialItems);

    useEffect(() => {
        const customItems = items.filter(m => m.isCustom);
        try {
            if (customItems.length > 0) {
                localStorage.setItem(storageKey, JSON.stringify(customItems));
            } else {
                // Si plus aucun item personnalisé n'existe, on nettoie le localStorage
                localStorage.removeItem(storageKey);
            }
        } catch(e) {
            console.error(`Impossible de sauvegarder les items dans ${storageKey}:`, e);
        }
    }, [items, storageKey]);

    const addItem = useCallback((itemData: { title: string; [key: string]: any; }) => {
        const newItem = { id: crypto.randomUUID(), ...itemData, isCustom: true };
        setItems(prev => [...prev, newItem]);
        return newItem;
    }, []);
    
    const deleteItem = useCallback((itemId: string) => {
        setItems(prev => prev.filter(m => m.id !== itemId));
    }, []);

    const importItems = useCallback((fileContent: string) => {
        try {
            const imported = JSON.parse(fileContent);
            if (!Array.isArray(imported) || !imported.every(i => 'title' in i && 'template' in i)) throw new Error("Format invalide.");
            setItems(prev => {
                const existing = new Set(prev.map(m => m.title));
                const newItems = imported
                    .filter((i: any) => !existing.has(i.title))
                    .map((i: any) => ({ ...i, id: crypto.randomUUID(), isCustom: true }));
                if (newItems.length > 0) {
                    alert(`${newItems.length} item(s) importé(s) !`);
                } else {
                    alert("Aucun nouvel item importé (les items avec des titres déjà existants ont été ignorés).");
                }
                return [...prev, ...newItems];
            });
        } catch (error: any) { alert(`Erreur: ${error.message || "Fichier invalide."}`); }
    }, []);

    const exportItems = useCallback((downloadName: string) => {
        const customItems = items.filter(m => m.isCustom);
        if (customItems.length === 0) {
            alert("Il n'y a aucun item personnalisé à exporter.");
            return;
        }
        const dataStr = JSON.stringify(customItems.map(({id, isCustom, ...rest}) => rest), null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        a.click();
        URL.revokeObjectURL(url);
    }, [items]);

    const mergeRemoteItems = useCallback((remoteItems: any[]) => {
        if (!Array.isArray(remoteItems)) return;
        setItems(prevItems => {
            const existingTitles = new Set(prevItems.map(item => item.title));
            const newItems = remoteItems
                .filter(remoteItem => remoteItem.title && !existingTitles.has(remoteItem.title))
                .map(remoteItem => ({
                    ...remoteItem,
                    id: crypto.randomUUID(),
                    isCustom: false,
                }));
            return [...prevItems, ...newItems];
        });
    }, []);

    return { items, addItem, deleteItem, importItems, exportItems, mergeRemoteItems };
};
