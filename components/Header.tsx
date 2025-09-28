import React from 'react';
import { useTheme } from '../App';
import { Tab } from '../types';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z" />
    </svg>
);
  
const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
    </svg>
);

const TabButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
  }> = ({ label, isActive, onClick }) => {
    return (
      <button
        onClick={onClick}
        className={`px-4 py-2 text-sm sm:text-base font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bunker-50 dark:focus:ring-offset-bunker-950 focus:ring-sky-500
          ${isActive
            ? 'bg-sky-600 text-white shadow-md'
            : 'text-bunker-600 dark:text-bunker-300 hover:bg-bunker-200 dark:hover:bg-bunker-800'
          }`}
      >
        {label}
      </button>
    );
};
  

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-10 bg-bunker-100/80 dark:bg-bunker-900/80 backdrop-blur-sm shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-500 flex items-baseline flex-wrap">
              <span>Studio Créatif IA</span>
              <span className="text-xs sm:text-sm font-normal text-bunker-500 dark:text-bunker-400 ml-2">
                (Offert par : www.dubois21.com)
              </span>
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center p-1 bg-bunker-200 dark:bg-bunker-800 rounded-lg">
                <TabButton label="Générateur" isActive={activeTab === Tab.GENERATOR} onClick={() => setActiveTab(Tab.GENERATOR)} />
                <TabButton label="Éditeur" isActive={activeTab === Tab.EDITOR} onClick={() => setActiveTab(Tab.EDITOR)} />
            </div>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-bunker-600 dark:text-bunker-300 hover:bg-bunker-200 dark:hover:bg-bunker-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bunker-50 dark:focus:ring-offset-bunker-950 focus:ring-sky-500"
              aria-label="Changer de thème"
            >
              {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;