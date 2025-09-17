
import React, { useEffect } from 'react';
import type { ToastType, TranslationKey } from '../../types';
import { ACCENT_COLORS } from '../../constants';

export const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
    return (
        <div className="relative group/tooltip flex items-center">
            {children}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max px-2 py-1 bg-gray-800 dark:bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none z-50 whitespace-nowrap">
                {text}
            </div>
        </div>
    );
};

export const ToastNotification: React.FC<{
    message: string;
    type: ToastType;
    isVisible: boolean;
    onClose: () => void;
}> = ({ message, type, isVisible, onClose }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => onClose(), 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    const baseClasses = "fixed bottom-5 right-5 flex items-center w-full max-w-xs p-4 space-x-4 rtl:space-x-reverse divide-x rtl:divide-x-reverse rounded-lg shadow-lg space-x text-white";
    const typeClasses = {
        success: 'bg-green-500 dark:bg-green-600 divide-green-400 dark:divide-green-500',
        error: 'bg-red-500 dark:bg-red-600 divide-red-400 dark:divide-red-500',
        info: 'bg-blue-500 dark:bg-blue-600 divide-blue-400 dark:divide-blue-500',
    };
    const iconClasses = {
        success: 'bi-check-circle-fill',
        error: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill',
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
            <i className={`bi ${iconClasses[type]} text-xl`}></i>
            <div className="ps-4 text-sm font-normal">{message}</div>
        </div>
    );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode, size?: 'md' | 'lg' | 'xl', t: (key: TranslationKey) => string; }> = ({ isOpen, onClose, title, children, size = 'md', t }) => {
    if (!isOpen) return null;
    const sizeClasses = { md: 'max-w-md', lg: 'max-w-3xl', xl: 'max-w-5xl' };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10" aria-modal="true" role="dialog">
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full m-4 ${sizeClasses[size]}`}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
                    <button onClick={onClose} aria-label={t('cancel')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className="p-4 max-h-[80vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

export const DataCard: React.FC<{ title: string; onAdd?: () => void; children: React.ReactNode; addTooltipText?: string; }> = ({ title, onAdd, children, addTooltipText }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
            {onAdd && addTooltipText && (
                <Tooltip text={addTooltipText}>
                    <button onClick={onAdd} aria-label={addTooltipText} className="p-1.5 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center h-8 w-8">
                        <i className="bi bi-plus-lg text-xl"></i>
                    </button>
                </Tooltip>
            )}
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">{children}</div>
    </div>
);

export const DataItem: React.FC<{ children: React.ReactNode; onDelete: () => void; onEdit?: () => void; onEditTimeSlots?: () => void; t: (key: TranslationKey) => string; }> = ({ children, onDelete, onEdit, onEditTimeSlots, t }) => (
    <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded group">
        <span className="text-sm text-gray-700 dark:text-gray-300">{children}</span>
        <div className="flex items-center gap-1">
            {onEditTimeSlots && (
                 <Tooltip text={t('setTimeSlotsLabel')}>
                    <button onClick={onEditTimeSlots} className="text-sm bg-blue-100 dark:bg-blue-800/50 hover:bg-blue-200 dark:hover:bg-blue-700/70 text-blue-700 dark:text-blue-200 font-semibold py-1 px-2 rounded-md flex items-center gap-1.5">
                        <i className="bi bi-clock-fill"></i>
                        <span className="hidden sm:inline">{t('timeSlot')}</span>
                    </button>
                 </Tooltip>
            )}
            {onEdit && (
                <Tooltip text={t('edit')}>
                    <button onClick={onEdit} className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 p-1.5 rounded-full transition-colors" aria-label={t('edit')}>
                        <i className="bi bi-pencil-fill"></i>
                    </button>
                </Tooltip>
            )}
            <Tooltip text={t('delete')}>
                <button onClick={onDelete} className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 p-1.5 rounded-full transition-colors" aria-label={t('delete')}>
                    <i className="bi bi-trash3-fill"></i>
                </button>
            </Tooltip>
        </div>
    </div>
);

export const ColorPicker: React.FC<{selectedColor: string; onSelectColor: (color: string) => void; t: (key: TranslationKey) => string}> = ({ selectedColor, onSelectColor, t }) => (
    <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{t('accentColor')}:</label>
        <div className="flex items-center gap-2">
            {ACCENT_COLORS.map(color => (
                <button
                    key={color}
                    type="button"
                    onClick={() => onSelectColor(color)}
                    className={`w-6 h-6 rounded-full transition-transform transform hover:scale-110 ${selectedColor === color ? 'ring-2 ring-offset-2 dark:ring-offset-gray-800 ring-blue-500' : ''}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                />
            ))}
        </div>
    </div>
);
