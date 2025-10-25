import React from 'react';
import { useTheme } from '../App';
import { Tab } from '../types';
import { SunIcon, MoonIcon, SparklesIcon, PencilIcon, PhotoIcon, SquaresPlusIcon, VideoCameraIcon } from './Icons';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  vTexteLoadStatus: 'loading' | 'success' | 'error';
  vImageLoadStatus: 'loading' | 'success' | 'error';
}

const NavButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
  }> = ({ label, isActive, onClick, children, className = '' }) => {
    return (
      <button
        onClick={onClick}
        aria-label={label}
        className={`font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bunker-50 dark:focus:ring-offset-bunker-950 focus:ring-sky-500
          ${isActive
            ? 'bg-sky-600 text-white shadow-md'
            : 'text-bunker-600 dark:text-bunker-300 hover:bg-bunker-200 dark:hover:bg-bunker-800'
          } ${className}`}
      >
        {children}
      </button>
    );
};
  

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, vTexteLoadStatus, vImageLoadStatus }) => {
  const { theme, toggleTheme } = useTheme();

  const tabs = [
    { id: Tab.GENERATOR, label: 'GENERATEUR', icon: <SparklesIcon className="w-5 h-5" /> },
    { id: Tab.EDITOR, label: 'EDITEUR', icon: <PencilIcon className="w-5 h-5" /> },
    { id: Tab.PROMPT_BUILDER, label: 'CREATEUR', icon: <PhotoIcon className="w-5 h-5" /> },
    { id: Tab.V_STYLES, label: 'V-STYLES', icon: <SquaresPlusIcon className="w-5 h-5" /> },
    { id: Tab.V_TEXTE, label: 'V-TEXTE', icon: <SquaresPlusIcon className="w-5 h-5" /> },
    { id: Tab.V_IMAGE, label: 'V-IMAGE', icon: <PhotoIcon className="w-5 h-5" /> },
    { id: Tab.VIDEO, label: 'VIDEO', icon: <VideoCameraIcon className="w-5 h-5" /> },
  ];

  return (
    <header className="sticky top-0 z-10 bg-bunker-100/80 dark:bg-bunker-900/80 backdrop-blur-sm shadow-md transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <h1 className="text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-500 flex items-baseline flex-wrap">
              <span>Studio Créatif IA</span>
              <span className="hidden sm:inline text-xs sm:text-sm font-normal text-bunker-500 dark:text-bunker-400 ml-2">
                (Offert par : www.dubois21.com)
              </span>
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Tabs */}
            <div className="hidden sm:flex items-center p-1 bg-bunker-200 dark:bg-bunker-800 rounded-lg">
                {tabs.map(tab => (
                    <NavButton key={tab.id} label={tab.label} isActive={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className="px-4 py-2 text-sm sm:text-base">
                        <span className="flex items-center justify-center gap-1.5">
                            <span>{tab.label}</span>
                            {tab.id === Tab.V_TEXTE && vTexteLoadStatus === 'success' && <span className="text-green-500 font-bold text-xs">OK</span>}
                            {tab.id === Tab.V_TEXTE && vTexteLoadStatus === 'error' && <span className="text-red-500 font-bold text-xs" title="Erreur de chargement">Erreur</span>}
                            {tab.id === Tab.V_IMAGE && vImageLoadStatus === 'success' && <span className="text-green-500 font-bold text-xs">OK</span>}
                            {tab.id === Tab.V_IMAGE && vImageLoadStatus === 'error' && <span className="text-red-500 font-bold text-xs" title="Erreur de chargement">Erreur</span>}
                        </span>
                    </NavButton>
                ))}
            </div>
             {/* Mobile Tabs */}
             <div className="sm:hidden flex items-center p-1 bg-bunker-200 dark:bg-bunker-800 rounded-lg">
                {tabs.map(tab => (
                    <NavButton key={tab.id} label={tab.label} isActive={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className="p-2.5 relative group">
                        {tab.icon}
                        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 bg-bunker-900 text-bunker-100 text-xs font-semibold rounded-md shadow-lg opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-200 pointer-events-none">
                            {tab.label}
                        </span>
                        {tab.id === Tab.V_TEXTE && vTexteLoadStatus === 'success' && <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-bunker-100 dark:ring-bunker-900"></span>}
                        {tab.id === Tab.V_TEXTE && vTexteLoadStatus === 'error' && <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-bunker-100 dark:ring-bunker-900"></span>}
                        {tab.id === Tab.V_IMAGE && vImageLoadStatus === 'success' && <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-bunker-100 dark:ring-bunker-900"></span>}
                        {tab.id === Tab.V_IMAGE && vImageLoadStatus === 'error' && <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-bunker-100 dark:ring-bunker-900"></span>}
                    </NavButton>
                ))}
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