
import React, { useState, useEffect, useRef } from 'react';
import type { TranslationKey } from '../../types';
import { Tooltip } from '../common';

const LanguageToggle: React.FC<{ language: 'id' | 'en', setLanguage: React.Dispatch<React.SetStateAction<'id' | 'en'>>, t: (key: TranslationKey) => string }> = ({ language, setLanguage, t }) => (
    <Tooltip text={t('toggleLanguage')}>
        <button onClick={() => setLanguage(language === 'id' ? 'en' : 'id')} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-bold text-sm w-9 h-9 flex items-center justify-center" aria-label="Toggle language">
            {language.toUpperCase()}
        </button>
    </Tooltip>
);

const ThemeToggle: React.FC<{t: (key: TranslationKey) => string; theme: 'light' | 'dark'; setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>}> = ({t, theme, setTheme}) => (
    <Tooltip text={t('toggleTheme')}>
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors w-9 h-9 flex items-center justify-center" aria-label="Toggle theme">
            {theme === 'dark' ? <i className="bi bi-sun-fill text-lg"></i> : <i className="bi bi-moon-stars-fill text-lg"></i>}
        </button>
    </Tooltip>
);

export const Header: React.FC<{ t: (key: TranslationKey) => string; language: 'id' | 'en'; setLanguage: React.Dispatch<React.SetStateAction<'id' | 'en'>>; onSettingsClick: () => void; onHelpClick: () => void; theme: 'light' | 'dark'; setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>; }> = ({ t, language, setLanguage, onSettingsClick, onHelpClick, theme, setTheme }) => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const ActionButtons = () => (
        <>
            <LanguageToggle language={language} setLanguage={setLanguage} t={t} />
            <ThemeToggle t={t} theme={theme} setTheme={setTheme} />
            <Tooltip text={t('settings')}>
                <button onClick={onSettingsClick} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors w-9 h-9 flex items-center justify-center" aria-label="Settings">
                    <i className="bi bi-gear-fill text-lg"></i>
                </button>
            </Tooltip>
            <Tooltip text={t('help')}>
                <button onClick={onHelpClick} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors w-9 h-9 flex items-center justify-center" aria-label="Help">
                    <i className="bi bi-question-circle-fill text-lg"></i>
                </button>
            </Tooltip>
        </>
    );
    
    return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{t('appName')}</h1>
        <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3"><ActionButtons /></div>
            <div className="md:hidden relative" ref={menuRef}>
                <Tooltip text={t('actions')}>
                    <button onClick={() => setMenuOpen(prev => !prev)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors w-9 h-9 flex items-center justify-center">
                        <i className="bi bi-three-dots-vertical text-lg"></i>
                    </button>
                </Tooltip>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-20 py-1 ring-1 ring-black ring-opacity-5">
                        <div className="px-4 py-2 flex justify-around"><ActionButtons /></div>
                    </div>
                )}
            </div>
        </div>
    </header>
)};
