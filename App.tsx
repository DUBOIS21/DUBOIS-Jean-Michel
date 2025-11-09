
import React, { useState, createContext, useContext, useEffect, useMemo, useCallback, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
import PromptBuilder from './components/PromptBuilder';
import VideoGenerator from './components/VideoGenerator';
import Examples from './components/Examples';
import GlobalHelpModal from './components/GlobalHelpModal';
import { Tab } from './types';

type Theme = 'light' | 'dark';
type TabPosition = 'top' | 'bottom' | 'left' | 'right';

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

const loadingLogoBase64 = "PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiByb2xlPSJpbWciIGFyaWEtbGFiZWw9IkxvZ28gZGUgZMOpbWFycmFnZSBJQSI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiYW5hbmEtZ3JhZGllbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRUVBM0IiIC8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjRkFCQzA1IiAvPjwvbGluZWFyR3JhZGllbnQ+PGZpbHRlciBpZD0ic29mdC1nbG93IiB4PSItNTAlIiB5PSItNTAlIiB3aWR0aD0iMjAwJSIgaGVpZ2h0PSIyMDAlIj48ZmVHYXVzc2lhbkJsdXIgaW49IlNvdXJjZUdyYXBoaWMiIHN0ZERldmlhdGlvbj0iMyIgcmVzdWx0PSJibHVyIiAvPjxmZUNvbG9yTWF0cml4IGluPSJibHVyIiBtb2RlPSJtYXRyaXgiIHZhbHVlcz0iMSAwIDAgMCAwICAwIDEgMCAwIDAgIDAgMCAxIDAgMCAgMCAwIDAgMC43IDAiIHJlc3VsdD0iZ2xvdyIgLz48ZmVNZXJnZT48ZmVNZXJnZU5vZGUgaW49Imdsb3ciIC8+PGZlTWVyZ2VOb2RlIGluPSJTb3VyY2VHcmFwaGljIiAvPjwvZmVNZXJnZT48L2ZpbHRlcj48L2RlZnM+PGcgZmlsdGVyPSJ1cmwoI3NvZnQtZ2xvdykiPjxwYXRoIGQ9Ik0gMzAgNzAgUSA1MCAyMCwgODAgNjAgQyA3MCA4NSwgNDAgODUsIDMwIDcwIFoiIGZpbGw9InVybCgjYmFuYW5hLWdyYWRpZW50KSIvPjwvZz48cGF0aCBkPSJNNzggMjIgTCA4MCAyNyBMIDg1IDI5IEwgODAgMzEgTCA3OCAzNiBMIDc2IDMxIEwgNzEgMjkgTCA3NiAyNyBaIiBmaWxsPSJ3aGl0ZSIgb3BhY2l0eT0iMC44Ij48YW5pbWF0ZSBhdHRyaWJ1dGVOYW1lPSJvcGFjaXR5IiB2YWx1ZXM9IjAuODswLjM7MC44IiBkdXI9IjNzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgLz48L3BhdGg+PHBhdGggZD0iTTI1IDcwIEwgMjYgNzMgTCAyOSA3NCBMIDI2IDc1IEwgMjUgNzggTCAyNCA3NSBMIDIxIDc0IEwgMjQgNzMgWiIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuNiI+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0ib3BhY2l0eSIgdmFsdWVzPSIwLjY7MC4yOzAuNiIgZHVyPSI0cyIgcmVwZWF0Q291bnQ9ImluZGVmaW5pdGUiIC8+PC9wYXRoPjwvc3ZnPg==";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.GENERATOR);
  const [theme, setTheme] = useState<Theme>('dark');
  const [tabPosition, setTabPosition] = useState<TabPosition>('top');
  const [imageForEditor, setImageForEditor] = useState<string | null>(null);
  const [dailyUsage, setDailyUsage] = useState<number>(0);
  const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
  const [examplesLoadStatus, setExamplesLoadStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [minLoadingTimeElapsed, setMinLoadingTimeElapsed] = useState<boolean>(false);
  const [retryKey, setRetryKey] = useState<number>(0);
  const importBackupInputRef = useRef<HTMLInputElement>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

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

    // Tab position initialization
    const savedPosition = localStorage.getItem('tabPosition') as TabPosition | null;
    setTabPosition(savedPosition || 'top');

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
    const allSuccess = examplesLoadStatus === 'success';

    if (allSuccess && minLoadingTimeElapsed) {
        setIsAppLoading(false);
    }
  }, [examplesLoadStatus, minLoadingTimeElapsed]);
  
  const handleRetryAll = () => {
    setExamplesLoadStatus('loading');
    setRetryKey(prev => prev + 1);
  };

  const handleContinueAnyway = () => {
    setIsAppLoading(false);
  };

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

  const handleSetTabPosition = (position: TabPosition) => {
    setTabPosition(position);
    localStorage.setItem('tabPosition', position);
  };

  const handleSendImageToEditor = useCallback((imageUrl: string) => {
    setImageForEditor(imageUrl);
    setActiveTab(Tab.EDITOR);
  }, []);

  const handleImageProcessedByEditor = useCallback(() => {
    setImageForEditor(null);
  }, []);

  const handleExamplesLoad = useCallback((status: 'success' | 'error') => setExamplesLoadStatus(status), []);


  const handleSetActiveTab = (tab: Tab) => {
    setActiveTab(tab);
  };

  const themeValue = useMemo(() => ({ theme, toggleTheme }), [theme]);

  const handleExportAllData = useCallback(() => {
    const backupData: { [key: string]: any } = {};
    const keysToBackup = [
      'generationHistory', 'examplesHistory',
      'customInspirationModules', 'customImageModules',
      'theme', 'tabPosition'
    ];
    keysToBackup.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          backupData[key] = JSON.parse(data);
        } catch (e) {
          backupData[key] = data;
        }
      }
    });
    if (Object.keys(backupData).length === 0) {
      alert("Aucune donnée à sauvegarder !");
      return;
    }
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studio-creatif-ia-sauvegarde-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const handleImportAllData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        if (!content) throw new Error("Le fichier est vide.");
        const data = JSON.parse(content);
        const allPossibleKeys = [
            'generationHistory', 'examplesHistory',
            'customInspirationModules', 'customImageModules',
            'theme', 'tabPosition'
        ];
        if (typeof data !== 'object' || data === null || !Object.keys(data).some(key => allPossibleKeys.includes(key))) {
            throw new Error("Le fichier de sauvegarde semble invalide.");
        }
        if (!window.confirm("L'importation écrasera les données existantes et rechargera l'application. Continuer ?")) {
            if (event.target) event.target.value = '';
            return;
        }
        Object.keys(data).forEach(key => {
            if (allPossibleKeys.includes(key)) {
                const value = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
                localStorage.setItem(key, value);
            }
        });
        alert("Données importées ! L'application va se recharger.");
        window.location.reload();
      } catch (error: any) {
        alert(`Erreur d'importation : ${error.message}`);
      }
    };
    reader.readAsText(file);
    if (event.target) event.target.value = '';
  }, []);

  const handleImportClick = useCallback(() => {
    importBackupInputRef.current?.click();
  }, []);

  const headerElement = (
    <Header
      activeTab={activeTab}
      setActiveTab={handleSetActiveTab}
      examplesLoadStatus={examplesLoadStatus}
      tabPosition={tabPosition}
      onSetTabPosition={handleSetTabPosition}
      onExportAllData={handleExportAllData}
      onImportAllDataClick={handleImportClick}
      onOpenHelpModal={() => setIsHelpModalOpen(true)}
    />
  );

  const hasLoadingError = examplesLoadStatus === 'error';
  
  const mainContent = (
    <div className="flex-grow flex flex-col overflow-hidden w-full h-full">
      <main className="p-4 sm:p-6 lg:p-8 flex-grow container mx-auto overflow-y-auto">
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
        <div style={{ display: activeTab === Tab.EXAMPLES ? 'block' : 'none' }}>
            <Examples
                key={`examples-${retryKey}`}
                onSendToEditor={handleSendImageToEditor}
                dailyUsage={dailyUsage}
                limit={DAILY_GENERATION_LIMIT}
                onUsageUpdate={updateDailyUsage}
                onLoadComplete={handleExamplesLoad}
            />
        </div>
        <div style={{ display: activeTab === Tab.VIDEO ? 'block' : 'none' }}>
          <VideoGenerator onUsageUpdate={updateDailyUsage} />
        </div>
      </main>
      <Footer usage={dailyUsage} limit={DAILY_GENERATION_LIMIT} />
    </div>
  );

  return (
    <ThemeContext.Provider value={themeValue}>
      <input
        type="file"
        ref={importBackupInputRef}
        onChange={handleImportAllData}
        className="hidden"
        accept=".json"
      />
        {isAppLoading && (
            <div className="fixed inset-0 bg-bunker-50 dark:bg-bunker-950 z-[100] flex flex-col items-center justify-center text-center p-4 transition-opacity duration-300">
                <div className="relative w-48 h-48 mb-6">
                    <img src={loadingLogoBase64} alt="Logo de démarrage" className="w-full h-full rounded-full object-cover shadow-2xl p-4" />
                    <div className="absolute inset-0 border-4 border-sky-500/50 border-t-sky-500 rounded-full animate-spin"></div>
                </div>
                <h2 className="text-xl font-bold text-bunker-800 dark:text-bunker-200">Préparation du Studio Créatif...</h2>
                <div className="mt-4 space-y-2 w-full max-w-xs sm:max-w-sm">
                    <div className="flex justify-between items-center text-sm font-medium bg-bunker-100 dark:bg-bunker-900 px-3 py-2 rounded-lg shadow-inner">
                        <span className="text-bunker-700 dark:text-bunker-300">Modules Exemples</span>
                        {examplesLoadStatus === 'loading' && <span className="text-bunker-400 animate-pulse">Chargement...</span>}
                        {examplesLoadStatus === 'success' && <span className="text-green-500 font-bold">Prêt</span>}
                        {examplesLoadStatus === 'error' && <span className="text-red-500 font-bold">Erreur</span>}
                    </div>
                </div>
                {hasLoadingError && (
                    <div className="mt-6 text-center">
                        <p className="text-red-500 font-semibold mb-3">Un ou plusieurs modules n'ont pas pu être chargés.</p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <button 
                                onClick={handleRetryAll}
                                className="py-2 px-6 bg-sky-600 text-white font-bold rounded-lg hover:bg-sky-700 transition-colors shadow-lg w-full sm:w-auto"
                            >
                                Réessayer le chargement
                            </button>
                             <button 
                                onClick={handleContinueAnyway}
                                className="py-2 px-6 bg-bunker-500 text-white font-semibold rounded-lg hover:bg-bunker-600 dark:bg-bunker-700 dark:hover:bg-bunker-600 transition-colors shadow-lg w-full sm:w-auto"
                            >
                                Continuer quand même
                            </button>
                        </div>
                        <p className="text-xs text-bunker-500 dark:text-bunker-400 mt-3 px-4">
                            Attention : le ou les modules en erreur ne seront pas disponibles.
                        </p>
                    </div>
                )}
            </div>
        )}
      <div className={`min-h-screen bg-bunker-50 dark:bg-bunker-950 font-sans transition-colors duration-300 flex overflow-x-hidden ${isAppLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'} ${tabPosition === 'left' || tabPosition === 'right' ? 'flex-row' : 'flex-col'}`}>
        {(tabPosition === 'top' || tabPosition === 'left') && headerElement}
        {mainContent}
        {(tabPosition === 'bottom' || tabPosition === 'right') && headerElement}
        <GlobalHelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      </div>
    </ThemeContext.Provider>
  );
};

export default App;
