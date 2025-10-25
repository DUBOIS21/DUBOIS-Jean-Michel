import React, { useState, createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
import PromptBuilder from './components/PromptBuilder';
import VTexte from './components/VTexte';
import VImage from './components/VImage';
import VideoGenerator from './components/VideoGenerator';
import { Tab } from './types';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé dans un ThemeProvider');
  }
  return context;
};

const DAILY_GENERATION_LIMIT = 25;

const loadingLogoBase64 = "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiByb2xlPSJpbWciIGFyaWEtbGFiZWw9IkxvZ28gZm9yIElBIEltYWdlcywgYW4gQUkgaW1hZ2UgZ2VuZXJhdGlvbiBhbmQgZWRpdGluZyB0b29sIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQtbGVmdCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNBQkUwNjM7IiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzU2QTNEMTsiIC8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQtcmlnaHQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojQzNBRUQ2OyIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM4QTZFRkY7IiAvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkLW1vdW50YWlucyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM5OEZCOTg7IiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6IzNDQjM3MTsiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZD0iTSA1MCAxMCBMIDg4IDM1IFYgNjUgTCA1MCA5MCBaIiBmaWxsPSJ1cmwoI2dyYWQtcmlnaHQpIi8+PHBhdGggZD0iTSA2NyA0MyBMIDcyIDM0IEwgNzcgNDMgTCA4MSAzOSBMIDg1IDQzIEwgODUgNDggTCA2NyA0OCBaIiBmaWxsPSJ1cmwoI2dyYWQtbW91bnRhaW5zKSIgLz48Y2lyY2xlIGN4PSI4MiIgY3k9IjMyIiByPSI0IiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiLz48cGF0aCBkPSJNIDY0IDUyIEggODUgTSA2NCA1NyBIIDg1IiBzdHJva2U9IiNGRkZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2Utb3BhY2l0eT0iMC43Ii8+PHBhdGggZD0iTSA1MCA1MCBMIDYyIDUwIEwgNjIgNjggTSA1MCA2OCBMIDYyIDY4IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIuNSIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiAvPjxwYXRoIGQ9Ik0gNTAgMTAgQyAyMCAyMCwgMTIgODAsIDUwIDkwIFYgMTAgWiIgZmlsbD0idXJsKCNncmFkLWxlZnQpIi8+PHBhdGggZD0iTSA1MCA1MCBMIDM4IDUwIEwgMzggMzIgTSA1MCAzMiBMIDM4IDMyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIuNSIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PGc+PHJlY3QgeD0iMjUiIHk9IjI1IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjQTFEQTcxIiAvPjxyZWN0IHg9IjIyIiB5PSIzMiIgd2lkdGg9IjMiIGhlaWdodD0iMyIgZmlsbD0iIzlBRDY3QyIgLz48cmVjdCB4PSIyNiIgeT0iMzgiIHdpZHRoPSIzLjUiIGhlaWdodD0iMy41IiBmaWxsPSIjOTNEMjg3IiAvPjxyZWN0IHg9IjIwIiB5PSI0NSIgd2lkdGg9IjQiIGhlaWdodD0iNCIgZmlsbD0iIzhCQ0U5MyIgLz48cmVjdCB4PSIyMyIgeT0iNTIiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiM4MEM4QTIiIC8+PHJlY3QgeD0iMTgiIHk9IjU5IiB3aWR0aD0iMy41IiBoZWlnaHQ9IjMuNSIgZmlsbD0iIzc2QzJCMSIgLz48cmVjdCB4PSIyMiIgeT0iNjYiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIGZpbGw9IiM2QkJEQzAiIC8+PHJlY3QgeD0iMTciIHk9IjczIiB3aWR0aD0iMi41IiBoZWlnaHQ9IjIuNSIgZmlsbD0iIzYxQjdDRSIgLz48L2c+PC9zdmc+";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.GENERATOR);
  const [theme, setTheme] = useState<Theme>('dark');
  const [imageForEditor, setImageForEditor] = useState<string | null>(null);
  const [dailyUsage, setDailyUsage] = useState<number>(0);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [vTexteLoadStatus, setVTexteLoadStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [vImageLoadStatus, setVImageLoadStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [minLoadingTimeElapsed, setMinLoadingTimeElapsed] = useState<boolean>(false);
  const [isVideoUnlocked, setIsVideoUnlocked] = useState<boolean>(false);

  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Daily usage initialization
    try {
        const usageDataStr = localStorage.getItem('dailyUsage');
        if (usageDataStr) {
            const usageData = JSON.parse(usageDataStr);
            const today = new Date().toISOString().split('T')[0];
            if (usageData.date === today) {
                setDailyUsage(usageData.count);
            } else {
                // It's a new day, reset
                localStorage.setItem('dailyUsage', JSON.stringify({ count: 0, date: today }));
                setDailyUsage(0);
            }
        }
    } catch (e) {
        console.error("Impossible de charger l'utilisation quotidienne:", e);
    }
    
    // Minimum loading time
    const timer = setTimeout(() => {
        setMinLoadingTimeElapsed(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const vTexteDone = vTexteLoadStatus !== 'loading';
    const vImageDone = vImageLoadStatus !== 'loading';
    if (vTexteDone && vImageDone && minLoadingTimeElapsed) {
        setIsAppLoading(false);
    }
  }, [vTexteLoadStatus, vImageLoadStatus, minLoadingTimeElapsed]);

  const updateDailyUsage = useCallback((newGenerations: number) => {
    setDailyUsage(currentUsage => {
      const newCount = currentUsage + newGenerations;
      try {
          const today = new Date().toISOString().split('T')[0];
          localStorage.setItem('dailyUsage', JSON.stringify({ count: newCount, date: today }));
      } catch (e) {
          console.error("Impossible de sauvegarder l'utilisation quotidienne:", e);
      }
      return newCount;
    });
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newTheme;
    });
  };

  const handleSendImageToEditor = useCallback((imageUrl: string) => {
    setImageForEditor(imageUrl);
    setActiveTab(Tab.EDITOR);
  }, []);

  const handleImageProcessedByEditor = useCallback(() => {
    setImageForEditor(null);
  }, []);

  const handleVTexteLoad = useCallback((status: 'success' | 'error') => setVTexteLoadStatus(status), []);
  const handleVImageLoad = useCallback((status: 'success' | 'error') => setVImageLoadStatus(status), []);

  const handleSetActiveTab = (tab: Tab) => {
    if (tab === Tab.VIDEO && !isVideoUnlocked) {
      const password = prompt("Veuillez entrer le mot de passe pour accéder à cet onglet.");
      if (password === "AAA") {
        setIsVideoUnlocked(true);
        setActiveTab(tab);
      } else if (password !== null) {
        alert("Mot de passe incorrect.");
      }
    } else {
      setActiveTab(tab);
    }
  };

  const themeValue = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={themeValue}>
        {isAppLoading && (
            <div className="fixed inset-0 bg-bunker-50 dark:bg-bunker-950 z-[100] flex flex-col items-center justify-center transition-opacity duration-500">
                <div className="relative w-48 h-48">
                    <img src={loadingLogoBase64} alt="Logo de démarrage" className="w-full h-full rounded-full object-cover shadow-2xl p-4" />
                    <div className="absolute inset-0 border-4 border-sky-500/50 border-t-sky-500 rounded-full animate-spin"></div>
                </div>
                <p className="mt-6 text-lg font-semibold text-bunker-700 dark:text-bunker-300">Chargement des modules...</p>
            </div>
        )}
      <div className={`min-h-screen bg-bunker-50 dark:bg-bunker-950 font-sans transition-colors duration-300 flex flex-col overflow-x-hidden ${isAppLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}`}>
        <Header activeTab={activeTab} setActiveTab={handleSetActiveTab} vTexteLoadStatus={vTexteLoadStatus} vImageLoadStatus={vImageLoadStatus} />
        <main className="p-4 sm:p-6 lg:p-8 flex-grow container mx-auto">
          <div style={{ display: activeTab === Tab.GENERATOR ? 'block' : 'none' }}>
            <ImageGenerator 
              onSendToEditor={handleSendImageToEditor}
              dailyUsage={dailyUsage}
              limit={DAILY_GENERATION_LIMIT}
              onUsageUpdate={updateDailyUsage}
            />
          </div>
          <div style={{ display: activeTab === Tab.EDITOR ? 'block' : 'none' }}>
            <ImageEditor initialImage={imageForEditor} onImageProcessed={handleImageProcessedByEditor} />
          </div>
          <div style={{ display: activeTab === Tab.PROMPT_BUILDER ? 'block' : 'none' }}>
            <PromptBuilder />
          </div>
          <div style={{ display: activeTab === Tab.V_TEXTE ? 'block' : 'none' }}>
            <VTexte onUsageUpdate={updateDailyUsage} onSendToEditor={handleSendImageToEditor} onLoadComplete={handleVTexteLoad} />
          </div>
          <div style={{ display: activeTab === Tab.V_IMAGE ? 'block' : 'none' }}>
            <VImage onUsageUpdate={updateDailyUsage} onSendToEditor={handleSendImageToEditor} onLoadComplete={handleVImageLoad} />
          </div>
          <div style={{ display: activeTab === Tab.VIDEO ? 'block' : 'none' }}>
            <VideoGenerator onUsageUpdate={updateDailyUsage} />
          </div>
        </main>
        <Footer usage={dailyUsage} limit={DAILY_GENERATION_LIMIT} />
      </div>
    </ThemeContext.Provider>
  );
};

export default App;