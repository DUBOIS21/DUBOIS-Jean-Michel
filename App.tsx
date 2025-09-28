import React, { useState, createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.GENERATOR);
  const [theme, setTheme] = useState<Theme>('dark');
  const [imageForEditor, setImageForEditor] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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

  const themeValue = useMemo(() => ({ theme, toggleTheme }), [theme]);

  return (
    <ThemeContext.Provider value={themeValue}>
      <div className="min-h-screen bg-bunker-50 dark:bg-bunker-950 font-sans transition-colors duration-300 flex flex-col">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="p-4 sm:p-6 lg:p-8 flex-grow">
          {activeTab === Tab.GENERATOR && <ImageGenerator onSendToEditor={handleSendImageToEditor} />}
          {activeTab === Tab.EDITOR && <ImageEditor initialImage={imageForEditor} onImageProcessed={handleImageProcessedByEditor} />}
        </main>
        <footer className="text-center p-4 mt-4 border-t border-bunker-200 dark:border-bunker-800 text-bunker-500 dark:text-bunker-400 text-sm">
          Propulsé par <a href="https://www.dubois21.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-600 dark:text-sky-500 hover:underline">www.dubois21.com</a>
        </footer>
      </div>
    </ThemeContext.Provider>
  );
};

export default App;