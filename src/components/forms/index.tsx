import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { EducationLevel, Day, Room, Class, Subject, Teacher, ClassSubject, TranslationKey } from '../../types';
import { DAYS_OF_WEEK } from '../../constants';
import { Tooltip } from '../common';

export const LevelForm: React.FC<{ onSave: (data: Omit<EducationLevel, 'id' | 'timeSlots'> | EducationLevel) => void; onCancel: () => void; t: (key: TranslationKey) => string; initialData?: EducationLevel; globalDaysOff: Day[]; }> = ({ onSave, onCancel, t, initialData, globalDaysOff }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [daysOff, setDaysOff] = useState<Day[]>([]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setDaysOff(initialData.daysOff || []);
        } else {
            setName('');
            setDaysOff(globalDaysOff);
        }
    }, [initialData, globalDaysOff]);

    const handleDayToggle = (day: Day) => setDaysOff(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { alert(t('nameRequired')); return; }
        const payload = { name, daysOff };
        onSave(initialData?.id ? { ...initialData, ...payload } : payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('promptLevelName')}</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required autoFocus className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('levelSpecificHolidays')}</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('levelSpecificHolidaysDesc')}</p>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DAYS_OF_WEEK.map(day => (
                        <label key={day} className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={daysOff.includes(day)} onChange={() => handleDayToggle(day)} className="rounded text-blue-600 focus:ring-blue-500" />
                            <span>{t(day as TranslationKey)}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg flex items-center gap-2"><i className="bi bi-x-lg"></i>{t('cancel')}</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><i className="bi bi-check-lg"></i>{t('save')}</button>
            </div>
        </form>
    );
};

export const RoomForm: React.FC<{ levels: EducationLevel[]; classes: Class[]; onSave: (data: Omit<Room, 'id'> | Room) => void; onCancel: () => void; t: (key: TranslationKey) => string; initialData?: Room; }> = ({ levels, classes: allclasses, onSave, onCancel, t, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [levelIds, setLevelIds] = useState<string[]>(initialData?.levelIds || []);
    const [classIds, setClassIds] = useState<string[]>(initialData?.classIds || []);

    const handleLevelToggle = (levelId: string) => setLevelIds(prev => prev.includes(levelId) ? prev.filter(id => id !== levelId) : [...prev, levelId]);
    const handleClassToggle = (classId: string) => setClassIds(prev => prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { alert(t('nameRequired')); return; }
        const payload = { name, levelIds, classIds };
        onSave(initialData?.id ? { ...payload, id: initialData.id } : payload);
    };

    const classesByLevel = useMemo(() => {
        return levels.reduce((acc, level) => {
            const levelClasses = allclasses.filter(c => c.levelId === level.id);
            if (levelClasses.length > 0) acc[level.id] = levelClasses;
            return acc;
        }, {} as Record<string, Class[]>);
    }, [levels, allclasses]);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('promptRoomName')}</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('availableForLevels')}</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Biarkan kosong agar tersedia untuk semua jenjang.</p>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {levels.map(level => (
                        <label key={level.id} className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={levelIds.includes(level.id)} onChange={() => handleLevelToggle(level.id)} className="rounded text-blue-600 focus:ring-blue-500" />
                            <span>{level.name}</span>
                        </label>
                    ))}
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('availableForClasses')}</label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Pilihan ini akan menimpa pengaturan jenjang di atas.</p>
                <div className="mt-2 space-y-3 max-h-48 overflow-y-auto pr-2">
                    {Object.keys(classesByLevel).map(levelId => {
                        const level = levels.find(l => l.id === levelId);
                        return (
                            <div key={levelId}>
                                <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 border-b dark:border-gray-600 pb-1 mb-2">{level?.name}</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {classesByLevel[levelId].map(cls => (
                                        <label key={cls.id} className="flex items-center space-x-2 text-sm">
                                            <input type="checkbox" checked={classIds.includes(cls.id)} onChange={() => handleClassToggle(cls.id)} className="rounded text-blue-600 focus:ring-blue-500" />
                                            <span>{cls.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg flex items-center gap-2"><i className="bi bi-x-lg"></i>{t('cancel')}</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><i className="bi bi-check-lg"></i>{t('save')}</button>
            </div>
        </form>
    );
};


export const SubjectForm: React.FC<{ levels: EducationLevel[]; onSave: (data: Omit<Subject, 'id'> | Subject) => void; onCancel: () => void; t: (key: TranslationKey) => string; initialData?: Subject; }> = ({ levels, onSave, onCancel, t, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [levelId, setLevelId] = useState(initialData?.levelId || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { alert(t('nameRequired')); return; }
        if (!levelId) { alert(t('levelRequired')); return; }
        const payload = { name, levelId };
        onSave(initialData?.id ? { ...payload, id: initialData.id } : payload);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('promptSubjectName')}</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('level')}</label>
                <select value={levelId} onChange={e => setLevelId(e.target.value)} required className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2">
                    <option value="">{t('selectLevelPrompt')}</option>
                    {levels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
                </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg flex items-center gap-2"><i className="bi bi-x-lg"></i>{t('cancel')}</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><i className="bi bi-check-lg"></i>{t('save')}</button>
            </div>
        </form>
    );
};

export const TeacherForm: React.FC<{ subjects: Subject[]; levels: EducationLevel[]; onSave: (teacher: Omit<Teacher, 'id'> | Teacher) => void; onCancel: () => void; t: (key: TranslationKey) => string; initialData?: Teacher; }> = ({ subjects, levels, onSave, onCancel, t, initialData }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [availableDays, setAvailableDays] = useState<Day[]>(initialData?.availableDays || []);
    const [canTeachSubjects, setCanTeachSubjects] = useState<string[]>(initialData?.canTeachSubjects || []);
    const [canTeachInLevels, setCanTeachInLevels] = useState<string[]>(initialData?.canTeachInLevels || []);
    const [maxHoursPerDay, setMaxHoursPerDay] = useState<number>(initialData?.maxHoursPerDay || 0);

    const handleDayToggle = (day: Day) => setAvailableDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    const handleSubjectToggle = (subjectId: string) => setCanTeachSubjects(prev => prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]);
    const handleLevelToggle = (levelId: string) => {
        setCanTeachInLevels(prev => prev.includes(levelId) ? prev.filter(id => id !== levelId) : [...prev, levelId]);
        if (!canTeachInLevels.includes(levelId)) {
            const subjectsInDeselectedLevel = subjects.filter(s => s.levelId === levelId).map(s => s.id);
            setCanTeachSubjects(prev => prev.filter(subId => !subjectsInDeselectedLevel.includes(subId)));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { alert(t('nameRequired')); return; }
        const payload = { name, availableDays, canTeachSubjects, canTeachInLevels, maxHoursPerDay: maxHoursPerDay > 0 ? maxHoursPerDay : undefined };
        onSave(initialData?.id ? { ...payload, id: initialData.id } : payload);
    };
    
    const availableSubjects = useMemo(() => {
        if (canTeachInLevels.length === 0) return subjects;
        return subjects.filter(s => canTeachInLevels.includes(s.levelId));
    }, [subjects, canTeachInLevels]);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('teacherName')}</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('maxHoursPerDay')}</label>
                     <Tooltip text={t('maxHoursPerDayTooltip')}>
                        <input type="number" min="0" value={maxHoursPerDay} onChange={e => setMaxHoursPerDay(parseInt(e.target.value, 10) || 0)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2" />
                    </Tooltip>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('availableDays')}</label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DAYS_OF_WEEK.map(day => (
                        <label key={day} className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={availableDays.includes(day)} onChange={() => handleDayToggle(day)} className="rounded text-blue-600 focus:ring-blue-500" />
                            <span>{t(day as TranslationKey)}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('canTeachInLevels')}</label>
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {levels.map(level => (
                        <label key={level.id} className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={canTeachInLevels.includes(level.id)} onChange={() => handleLevelToggle(level.id)} className="rounded text-blue-600 focus:ring-blue-500" />
                            <span>{level.name}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('canTeachSubjects')}</label>
                 <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                    {availableSubjects.map(subject => (
                        <label key={subject.id} className="flex items-center space-x-2 text-sm">
                            <input type="checkbox" checked={canTeachSubjects.includes(subject.id)} onChange={() => handleSubjectToggle(subject.id)} className="rounded text-blue-600 focus:ring-blue-500" />
                            <span>{subject.name}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700 mt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg flex items-center gap-2"><i className="bi bi-x-lg"></i>{t('cancel')}</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><i className="bi bi-check-lg"></i>{t('save')}</button>
            </div>
        </form>
    );
};

export const ClassForm: React.FC<{
    subjects: Subject[];
    levels: EducationLevel[];
    teachers: Teacher[];
    allClasses: Class[];
    onSave: (newClass: Omit<Class, 'id'> | Class) => void;
    onCancel: () => void;
    t: (key: TranslationKey, replacements?: Record<string, string>) => string;
    initialData?: Class;
    workloadWarningThreshold: number;
}> = ({ subjects, levels, teachers, allClasses, onSave, onCancel, t, initialData, workloadWarningThreshold }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [levelId, setLevelId] = useState(initialData?.levelId || '');
    const [homeroomTeacherId, setHomeroomTeacherId] = useState(initialData?.homeroomTeacherId || '');
    const [classSubjects, setClassSubjects] = useState<ClassSubject[]>(initialData ? JSON.parse(JSON.stringify(initialData.subjects)) : []);

    const calculateTeacherWeeklyWorkload = useCallback((teacherId: string, currentClassSubjects: ClassSubject[]) => {
        if (!teacherId) return 0;
        let totalHours = 0;
        allClasses.forEach(c => {
            if (initialData && c.id === initialData.id) return;
            c.subjects.forEach(s => { if (s.teacherId === teacherId) totalHours += s.hoursPerWeek; });
        });
        currentClassSubjects.forEach(s => { if (s.teacherId === teacherId) totalHours += Number(s.hoursPerWeek) || 0; });
        return totalHours;
    }, [allClasses, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { alert(t('nameRequired')); return; }
        if (!levelId) { alert(t('levelRequired')); return; }
        const payload = {
            name,
            levelId,
            homeroomTeacherId: homeroomTeacherId || undefined,
            subjects: classSubjects.filter(cs => cs.subjectId && cs.teacherId && cs.hoursPerWeek > 0)
                .map(cs => ({...cs, hoursPerWeek: Number(cs.hoursPerWeek), consecutiveHours: cs.consecutiveHours && cs.consecutiveHours > 1 ? Number(cs.consecutiveHours) : undefined}))
        };
        onSave(initialData?.id ? { ...payload, id: initialData.id } : payload);
    };

    const addClassSubject = () => setClassSubjects([...classSubjects, { subjectId: '', hoursPerWeek: 1, teacherId: '', requiresRoom: true, consecutiveHours: 1 }]);
    const removeClassSubject = (index: number) => setClassSubjects(classSubjects.filter((_, i) => i !== index));
    const updateClassSubject = (index: number, field: keyof ClassSubject, value: string | number | boolean) => {
        const newSubjects = [...classSubjects];
        (newSubjects[index] as any)[field] = value;
        setClassSubjects(newSubjects);
    };

    const availableSubjects = useMemo(() => subjects.filter(s => s.levelId === levelId), [subjects, levelId]);
    const availableTeachersForLevel = useMemo(() => teachers.filter(t => t.canTeachInLevels.includes(levelId)), [teachers, levelId]);
    const getAvailableTeachersForSubject = (subjectId: string) => teachers.filter(t => t.canTeachInLevels.includes(levelId) && t.canTeachSubjects.includes(subjectId));

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('className')}</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('level')}</label>
                    <select value={levelId} onChange={e => setLevelId(e.target.value)} required className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2">
                        <option value="">{t('selectLevelPrompt')}</option>
                        {levels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('homeroomTeacher')}</label>
                     <select value={homeroomTeacherId} onChange={e => setHomeroomTeacherId(e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2">
                        <option value="">(Tidak Ada)</option>
                        {availableTeachersForLevel.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                    </select>
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('classSubjects')}</label>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border-t border-b dark:border-gray-700 py-3">
                    {classSubjects.map((cs, index) => {
                        const teacherWorkload = calculateTeacherWeeklyWorkload(cs.teacherId, classSubjects);
                        const teacherInfo = teachers.find(t => t.id === cs.teacherId);
                        const showWarning = workloadWarningThreshold > 0 && teacherWorkload > workloadWarningThreshold;

                        return (
                            <div key={index} className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start">
                                    <select value={cs.subjectId} onChange={(e) => updateClassSubject(index, 'subjectId', e.target.value)} className="md:col-span-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2">
                                        <option value="">{t('subject')}</option>
                                        {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <div className="md:col-span-2 grid grid-cols-5 gap-2 items-center">
                                        <select value={cs.teacherId} onChange={(e) => updateClassSubject(index, 'teacherId', e.target.value)} className="col-span-3 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2" disabled={!cs.subjectId}>
                                            <option value="">{t('selectTeacher')}</option>
                                            {getAvailableTeachersForSubject(cs.subjectId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                        <Tooltip text={t('hoursPerWeek')}><input type="number" min="1" value={cs.hoursPerWeek} onChange={(e) => updateClassSubject(index, 'hoursPerWeek', parseInt(e.target.value, 10))} className="col-span-1 w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2" placeholder="JP" /></Tooltip>
                                        <Tooltip text={t('consecutiveHoursTooltip')}><input type="number" min="1" value={cs.consecutiveHours || 1} onChange={(e) => updateClassSubject(index, 'consecutiveHours', parseInt(e.target.value, 10))} className="col-span-1 w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2" placeholder="Blok" /></Tooltip>
                                    </div>
                                </div>
                                {showWarning && teacherInfo && (
                                    <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-800/30 p-1.5 rounded-md flex items-center gap-2">
                                        <i className="bi bi-exclamation-triangle-fill"></i>
                                        <span>{t('teacherWorkloadWarning', { teacherName: teacherInfo.name, hours: String(teacherWorkload) })}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                                        <input type="checkbox" checked={cs.requiresRoom === false} onChange={(e) => updateClassSubject(index, 'requiresRoom', !e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500"/>
                                        <span>{t('noRoomRequired')}</span>
                                    </label>
                                    <button type="button" onClick={() => removeClassSubject(index)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"><i className="bi bi-trash3-fill"></i> Hapus</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
                <button type="button" onClick={addClassSubject} disabled={!levelId} className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:text-gray-400 disabled:no-underline flex items-center gap-1.5"><i className="bi bi-plus-circle-fill"></i>{t('addSubject')}</button>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700 mt-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg flex items-center gap-2"><i className="bi bi-x-lg"></i>{t('cancel')}</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><i className="bi bi-check-lg"></i>{t('save')}</button>
            </div>
        </form>
    );
};