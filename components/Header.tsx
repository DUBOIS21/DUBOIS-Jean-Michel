
import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../App';
import { Tab } from '../types';
import { SunIcon, MoonIcon, SparklesIcon, PencilIcon, PhotoIcon, SquaresPlusIcon, VideoCameraIcon, Cog6ToothIcon, ClipboardIcon, BeakerIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, ArrowLeftCircleIcon, ArrowRightCircleIcon, ArrowDownOnSquareIcon, ArrowUpOnSquareIcon, QuestionMarkCircleIcon } from './Icons';

type TabPosition = 'top' | 'bottom' | 'left' | 'right';

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  examplesLoadStatus: 'loading' | 'success' | 'error';
  tabPosition: TabPosition;
  onSetTabPosition: (position: TabPosition) => void;
  onExportAllData: () => void;
  onImportAllDataClick: () => void;
  onOpenHelpModal: () => void;
}

const NavButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
    isVertical?: boolean;
  }> = ({ label, isActive, onClick, children, className = '', isVertical = false }) => {
    return (
      <button
        onClick={onClick}
        aria-label={label}
        className={`font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bunker-50 dark:focus:ring-offset-bunker-950 focus:ring-sky-500 w-full
          ${isActive
            ? 'bg-sky-600 text-white shadow-md'
            : 'text-bunker-700 dark:text-bunker-200 hover:bg-bunker-200 dark:hover:bg-bunker-800 hover:text-sky-600 dark:hover:text-sky-400'
          } ${className}`}
      >
        {children}
      </button>
    );
};

const SettingsMenuItem: React.FC<{ onClick: () => void, children: React.ReactNode }> = ({ onClick, children }) => (
    <button onClick={onClick} className="w-full text-left px-3 py-2 text-sm text-bunker-800 dark:text-bunker-200 hover:bg-bunker-200 dark:hover:bg-bunker-800 transition-colors rounded-md flex items-center gap-3">
        {children}
    </button>
);

const SettingsDropdown: React.FC<{
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentPosition: TabPosition;
  onSetPosition: (position: TabPosition) => void;
  onExportAllData: () => void;
  onImportAllDataClick: () => void;
  onOpenHelpModal: () => void;
}> = ({ theme, toggleTheme, currentPosition, onSetPosition, onExportAllData, onImportAllDataClick, onOpenHelpModal }) => {

    const positions: { id: TabPosition; label: string; icon: React.ReactNode }[] = [
        { id: 'top', label: 'Haut', icon: <ArrowUpCircleIcon className="w-6 h-6" /> },
        { id: 'bottom', label: 'Bas', icon: <ArrowDownCircleIcon className="w-6 h-6" /> },
        { id: 'left', label: 'Gauche', icon: <ArrowLeftCircleIcon className="w-6 h-6" /> },
        { id: 'right', label: 'Droite', icon: <ArrowRightCircleIcon className="w-6 h-6" /> },
    ];
    
    return (
        <div className="w-80 bg-bunker-100 dark:bg-bunker-900 rounded-lg shadow-2xl border border-bunker-200 dark:border-bunker-800 p-3" style={{ animation: 'fadeInUp 0.15s ease-out' }}>
            <div className="space-y-3">
                <div>
                    <h4 className="font-semibold text-bunker-500 dark:text-bunker-400 text-xs px-3 mb-1 uppercase tracking-wider">Thème</h4>
                    <SettingsMenuItem onClick={toggleTheme}>
                        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                        <span>Passer au thème {theme === 'light' ? 'sombre' : 'clair'}</span>
                    </SettingsMenuItem>
                </div>
                
                <div className="border-t border-bunker-200 dark:border-bunker-800 my-2"></div>

                <div>
                    <h4 className="font-semibold text-bunker-500 dark:text-bunker-400 text-xs px-3 mb-2 uppercase tracking-wider">Position des onglets</h4>
                    <div className="grid grid-cols-4 gap-2">
                        {positions.map(({ id, label, icon }) => (
                            <button
                                key={id}
                                onClick={() => onSetPosition(id)}
                                title={label}
                                className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bunker-100 dark:focus:ring-offset-bunker-900 focus:ring-sky-500
                                  ${currentPosition === id
                                    ? 'bg-sky-600 text-white shadow-sm'
                                    : 'bg-bunker-200 dark:bg-bunker-800 text-bunker-700 dark:text-bunker-200 hover:bg-bunker-300 dark:hover:bg-bunker-700'
                                  }`}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-t border-bunker-200 dark:border-bunker-800 my-2"></div>

                <div>
                    <h4 className="font-semibold text-bunker-500 dark:text-bunker-400 text-xs px-3 mb-1 uppercase tracking-wider">Sauvegarde & Restauration</h4>
                    <div className="space-y-1">
                        <SettingsMenuItem onClick={onImportAllDataClick}>
                            <ArrowDownOnSquareIcon className="w-5 h-5" />
                            <span>Importer une sauvegarde...</span>
                        </SettingsMenuItem>
                         <SettingsMenuItem onClick={onExportAllData}>
                            <ArrowUpOnSquareIcon className="w-5 h-5" />
                            <span>Exporter toutes les données...</span>
                        </SettingsMenuItem>
                    </div>
                </div>
                
                <div className="border-t border-bunker-200 dark:border-bunker-800 my-2"></div>

                <div>
                    <h4 className="font-semibold text-bunker-500 dark:text-bunker-400 text-xs px-3 mb-1 uppercase tracking-wider">Aide</h4>
                    <SettingsMenuItem onClick={onOpenHelpModal}>
                        <QuestionMarkCircleIcon className="w-5 h-5" />
                        <span>Ouvrir le centre d'aide</span>
                    </SettingsMenuItem>
                </div>
            </div>
        </div>
    );
};
  
const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, examplesLoadStatus, tabPosition, onSetTabPosition, onExportAllData, onImportAllDataClick, onOpenHelpModal }) => {
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const tabs = [
    { id: Tab.GENERATOR, label: 'GENERATEUR', icon: <SparklesIcon className="w-5 h-5 flex-shrink-0" /> },
    { id: Tab.EDITOR, label: 'EDITEUR', icon: <PencilIcon className="w-5 h-5 flex-shrink-0" /> },
    { id: Tab.PROMPT_BUILDER, label: 'CREATEUR', icon: <PhotoIcon className="w-5 h-5 flex-shrink-0" /> },
    { id: Tab.EXAMPLES, label: 'EXEMPLES', icon: <BeakerIcon className="w-5 h-5 flex-shrink-0" /> },
    { id: Tab.VIDEO, label: 'VIDEO', icon: <VideoCameraIcon className="w-5 h-5 flex-shrink-0" /> },
  ];

  const isVertical = tabPosition === 'left' || tabPosition === 'right';

  const headerClasses = {
    top: 'sticky top-0 z-20 w-full',
    bottom: 'sticky bottom-0 z-20 w-full border-t dark:border-bunker-800',
    left: 'h-screen flex flex-col w-[70px] sm:w-[240px] p-2 sm:p-4 border-r dark:border-bunker-800 z-10',
    right: 'h-screen flex flex-col w-[70px] sm:w-[240px] p-2 sm:p-4 border-l dark:border-bunker-800 order-first sm:order-last z-10',
  };

  const dropdownPositionClasses = {
    top: 'absolute right-0 top-full mt-2 z-30',
    bottom: 'absolute right-0 bottom-full mb-2 z-30',
    left: 'absolute left-full top-0 ml-2 z-30',
    right: 'absolute right-full top-0 mr-2 z-30'
  };

  return (
    <>
      <header className={`${headerClasses[tabPosition]} bg-bunker-100/80 dark:bg-bunker-900/80 backdrop-blur-sm shadow-md transition-colors duration-300`}>
        <div className={`flex h-full ${isVertical ? 'flex-col justify-between items-center sm:items-stretch' : 'items-center justify-between container mx-auto px-4 sm:px-6 lg:px-8 h-16'}`}>
          <div className={`${isVertical ? 'text-center' : ''}`}>
            <h1 className="text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-500 flex items-baseline flex-wrap justify-center">
              <span className="sm:hidden">{isVertical ? 'IA' : 'Studio Créatif IA'}</span>
              <span className="hidden sm:inline">Studio Créatif IA</span>
            </h1>
            <span className={`hidden ${isVertical ? 'sm:hidden' : 'sm:inline'} text-xs sm:text-sm font-normal text-bunker-500 dark:text-bunker-400 ml-2`}>
                (Offert par : www.dubois21.com)
            </span>
          </div>

          <nav className={`p-1 bg-bunker-200 dark:bg-bunker-800 rounded-lg ${isVertical ? 'flex flex-col space-y-1 w-full my-4' : 'flex items-center space-x-1'}`}>
            {tabs.map(tab => (
              <NavButton key={tab.id} label={tab.label} isActive={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`${isVertical ? 'py-3' : 'px-4 py-2 text-sm'}`}>
                  <span className={`flex items-center gap-2 ${isVertical ? 'justify-center sm:justify-start sm:px-2' : 'justify-center'}`}>
                      {tab.icon}
                      <span className={`${isVertical ? 'hidden sm:inline' : ''}`}>{tab.label}</span>
                      {tab.id === Tab.EXAMPLES && examplesLoadStatus === 'success' && <span className={`${isVertical ? 'hidden sm:inline' : ''} text-green-500 font-bold text-xs`}>OK</span>}
                      {tab.id === Tab.EXAMPLES && examplesLoadStatus === 'error' && <span className={`${isVertical ? 'hidden sm:inline' : ''} text-red-500 font-bold text-xs`} title="Erreur de chargement">Erreur</span>}
                  </span>
              </NavButton>
            ))}
          </nav>
          
          <div ref={dropdownRef} className={`relative flex ${isVertical ? 'flex-col' : ''}`}>
            <button
              onClick={() => setIsDropdownOpen(prev => !prev)}
              className="p-2 w-full rounded-full text-bunker-600 dark:text-bunker-300 hover:bg-bunker-200 dark:hover:bg-bunker-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bunker-50 dark:focus:ring-offset-bunker-950 focus:ring-sky-500"
              aria-label="Ouvrir les réglages"
              aria-haspopup="true"
              aria-expanded={isDropdownOpen}
            >
              <Cog6ToothIcon className="w-6 h-6 mx-auto" />
            </button>

            {isDropdownOpen && (
              <div className={dropdownPositionClasses[tabPosition]}>
                <SettingsDropdown
                    theme={theme}
                    toggleTheme={() => { toggleTheme(); setIsDropdownOpen(false); }}
                    currentPosition={tabPosition}
                    onSetPosition={(pos) => { onSetTabPosition(pos); setIsDropdownOpen(false); }}
                    onExportAllData={() => { onExportAllData(); setIsDropdownOpen(false); }}
                    onImportAllDataClick={() => { onImportAllDataClick(); setIsDropdownOpen(false); }}
                    onOpenHelpModal={() => { onOpenHelpModal(); setIsDropdownOpen(false); }}
                />
              </div>
            )}
          </div>
        </div>
      </header>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(-10px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </>
  );
};

export default Header;
