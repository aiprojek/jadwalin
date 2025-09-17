import React, { useState, useEffect } from 'react';
import type { EducationLevel, TimeSlot, TranslationKey, Teacher, SubstituteFinderContext } from '../../types';
import { Modal, Tooltip } from '../common';

export const TimeSlotEditorModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (newSlots: { regular: TimeSlot[], exam: TimeSlot[] }) => void;
    level: EducationLevel;
    t: (key: TranslationKey) => string;
}> = ({ isOpen, onClose, onSave, level, t }) => {
    const [activeTab, setActiveTab] = useState<'regular' | 'exam'>('regular');
    const [regularSlots, setRegularSlots] = useState<TimeSlot[]>([]);
    const [examSlots, setExamSlots] = useState<TimeSlot[]>([]);

    useEffect(() => {
        if (level) {
            setRegularSlots(JSON.parse(JSON.stringify(level.timeSlots.regular || [])));
            setExamSlots(JSON.parse(JSON.stringify(level.timeSlots.exam || [])));
        }
    }, [level]);

    const handleSlotChange = (type: 'regular' | 'exam', index: number, field: keyof TimeSlot, value: string) => {
        const setter = type === 'regular' ? setRegularSlots : setExamSlots;
        setter(prev => {
            const newSlots = [...prev];
            const updatedSlot = { ...newSlots[index], [field]: value };
            if (field === 'startTime' || field === 'endTime') {
                 updatedSlot.label = `${updatedSlot.startTime || ''} - ${updatedSlot.endTime || ''}`;
            }
            newSlots[index] = updatedSlot;
            return newSlots;
        });
    };

    const addSlot = (type: 'regular' | 'exam', slotType: 'period' | 'break') => {
        const setter = type === 'regular' ? setRegularSlots : setExamSlots;
        const newSlot: TimeSlot = slotType === 'period'
            ? { id: `ts-new-${Date.now()}`, type: 'period', startTime: '00:00', endTime: '00:00', label: '00:00 - 00:00' }
            : { id: `ts-new-${Date.now()}`, type: 'break', label: 'Istirahat' };
        setter(prev => [...prev, newSlot]);
    };

    const removeSlot = (type: 'regular' | 'exam', index: number) => {
        const setter = type === 'regular' ? setRegularSlots : setExamSlots;
        setter(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        onSave({ regular: regularSlots, exam: examSlots });
        onClose();
    };

    const renderSlotList = (type: 'regular' | 'exam') => {
        const slots = type === 'regular' ? regularSlots : examSlots;
        return (
            <div className="space-y-3">
                <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                    {slots.map((slot, index) => (
                        <div key={slot.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <div className="sm:col-span-3">
                                {slot.type === 'period' ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs text-gray-500 dark:text-gray-400">{t('startTime')}</label>
                                            <input type="time" value={slot.startTime} onChange={e => handleSlotChange(type, index, 'startTime', e.target.value)} className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 dark:text-gray-400">{t('endTime')}</label>
                                            <input type="time" value={slot.endTime} onChange={e => handleSlotChange(type, index, 'endTime', e.target.value)} className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="text-xs text-gray-500 dark:text-gray-400">{t('breakLabel')}</label>
                                        <input type="text" value={slot.label} onChange={e => handleSlotChange(type, index, 'label', e.target.value)} className="w-full text-sm rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center justify-end h-full">
                                <Tooltip text={t('delete')}>
                                    <button onClick={() => removeSlot(type, index)} aria-label={t('delete')} className="text-red-500 hover:text-red-700 p-2 rounded-full">
                                        <i className="bi bi-trash3-fill"></i>
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="flex gap-2 pt-2 border-t dark:border-gray-600">
                    <button onClick={() => addSlot(type, 'period')} className="text-sm bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 py-1 px-3 rounded-md flex items-center gap-1.5"><i className="bi bi-plus-circle"></i>{t('addPeriod')}</button>
                    <button onClick={() => addSlot(type, 'break')} className="text-sm bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 py-1 px-3 rounded-md flex items-center gap-1.5"><i className="bi bi-plus-circle"></i>{t('addBreak')}</button>
                </div>
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t('editTimeSlots')} - ${level?.name}`} size="lg" t={t}>
            <div>
                <div className="flex border-b border-gray-300 dark:border-gray-700 mb-4">
                    <button onClick={() => setActiveTab('regular')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'regular' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t('lessonTime')}</button>
                    <button onClick={() => setActiveTab('exam')} className={`px-4 py-2 text-sm font-medium border-b-2 ${activeTab === 'exam' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{t('examTime')}</button>
                </div>
                {activeTab === 'regular' ? renderSlotList('regular') : renderSlotList('exam')}
                <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700 mt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg flex items-center gap-2"><i className="bi bi-x-lg"></i>{t('cancel')}</button>
                    <button type="button" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><i className="bi bi-check-lg"></i>{t('save')}</button>
                </div>
            </div>
        </Modal>
    );
};


export const SubstituteFinderModal: React.FC<{
    context: SubstituteFinderContext | null;
    candidates: (Teacher & { dailyHours: number })[];
    onSelect: (teacherName: string) => void;
    onClose: () => void;
    t: (key: TranslationKey) => string;
}> = ({ context, candidates, onSelect, onClose, t }) => {
    if (!context) return null;
    const { entry, day, timeSlot, className } = context;
    
    return (
        <Modal isOpen={!!context} onClose={onClose} title={t('findSubstitute')} t={t} size="lg">
            <div className="space-y-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('findSubstituteFor')}</p>
                    <p className="font-semibold">{entry.subjectName} ({entry.teacherName})</p>
                    <p className="text-xs">{t(day)} - {timeSlot} - {className}</p>
                </div>
                <h4 className="font-semibold">{t('substituteCandidates')}</h4>
                {candidates.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {candidates.map(teacher => (
                            <div key={teacher.id} className="grid grid-cols-4 items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                <span className="col-span-2 font-medium">{teacher.name}</span>
                                <span className="col-span-1 text-sm text-gray-500 dark:text-gray-400 text-center">{teacher.dailyHours} Jam Hari Ini</span>
                                <div className="col-span-1 flex justify-end">
                                    <button onClick={() => onSelect(teacher.name)} className="bg-blue-600 text-white px-3 py-1 text-sm rounded-md">{t('select')}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('noSubstitutesFound')}</p>
                )}
            </div>
        </Modal>
    );
};