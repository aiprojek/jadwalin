import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';

import type { Teacher, Subject, Room, Class, Schedule, Day, GeminiError, EducationLevel, ArchivedSchedule, TimeSlot, PrintSettings, InstitutionInfoItem, ToastType, SubstituteFinderContext, DragData } from './types';
import { translations, TranslationKey } from './i18n';
import { getDefaultPrintSettings, getDefaultInstitutionInfo, getDefaultAcademicYear, getDefaultGlobalDaysOff, getDefaultWorkloadWarningThreshold, ACCENT_COLORS, DAYS_OF_WEEK } from './constants';
import { generateLocalSchedule } from './services/localScheduler';
import { getExportStyles } from './services/exportStyles';

import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard';
import { HelpAndAboutPage } from './components/HelpAndAboutPage';
import { ToastNotification, Modal, DataCard, DataItem, ColorPicker, Tooltip } from './components/common';
import { LevelForm, SubjectForm, RoomForm, TeacherForm, ClassForm } from './components/forms';
import { TimeSlotEditorModal, SubstituteFinderModal } from './components/modals';
import { ArchivedScheduleViewer } from './components/schedule/ArchivedScheduleViewer';
import { ScheduleTable, MasterScheduleTable, TeacherScheduleTable, RoomScheduleTable, ScheduleViewControls, ScheduleHeader } from './components/schedule';

const isConflictError = (res: Schedule | GeminiError): res is GeminiError => {
    return !!res && typeof res === 'object' && 'conflicts' in res && Array.isArray((res as GeminiError).conflicts);
};

// --- MAIN APP COMPONENT ---
export default function App() {
    // I18n state
    const [language, setLanguage] = useState<'id' | 'en'>(() => (localStorage.getItem('language') as 'id' | 'en') || 'id');
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const storedTheme = localStorage.getItem('theme');
        return storedTheme === 'dark' ? 'dark' : 'light';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    const t = useCallback((key: TranslationKey, replacements?: Record<string, string>) => {
        let text = translations[language][key] || key;
        if (replacements) {
            Object.entries(replacements).forEach(([rKey, value]) => {
                text = text.replace(`{{${rKey}}}`, value);
            });
        }
        return text;
    }, [language]);

    // Data state
    const [levels, setLevels] = useState<EducationLevel[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    
    // Settings state
    const [institutionInfo, setInstitutionInfo] = useState<InstitutionInfoItem[]>(() => {
        const saved = localStorage.getItem('jadwalin_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            const savedInst = settings.institutionInfo;
             if (Array.isArray(savedInst) && savedInst.length > 0 && 'showInHeader' in savedInst[0]) {
                return savedInst;
            } else if (typeof savedInst === 'object' && !Array.isArray(savedInst) && savedInst !== null) { // Migrate from old object format
                const migratedInfo: InstitutionInfoItem[] = [];
                if (savedInst.institution) migratedInfo.push({ id: `mig-${Date.now()}-1`, label: 'Nama Lembaga Pendidikan', value: savedInst.institution, showInHeader: true });
                if (savedInst.foundation) migratedInfo.push({ id: `mig-${Date.now()}-2`, label: 'Nama Yayasan', value: savedInst.foundation, showInHeader: true });
                if (savedInst.address) migratedInfo.push({ id: `mig-${Date.now()}-3`, label: 'Info Tambahan (Alamat, dll)', value: savedInst.address, showInHeader: true });
                return migratedInfo.length > 0 ? migratedInfo : getDefaultInstitutionInfo();
            }
        }
        return getDefaultInstitutionInfo();
    });
    
    const [academicYear, setAcademicYear] = useState(() => {
        const saved = localStorage.getItem('jadwalin_settings');
        return saved ? (JSON.parse(saved).academicYear || getDefaultAcademicYear()) : getDefaultAcademicYear();
    });

    const [printSettings, setPrintSettings] = useState<PrintSettings>(() => {
        const saved = localStorage.getItem('jadwalin_settings');
        const defaults = getDefaultPrintSettings();
        if(saved){
            const savedPrint = JSON.parse(saved).printSettings;
            return {
                ...defaults,
                ...(savedPrint || {}),
                margin: { ...defaults.margin, ...(savedPrint?.margin || {}) }
            };
        }
        return defaults;
    });

    const [globalDaysOff, setGlobalDaysOff] = useState<Day[]>(() => {
        const saved = localStorage.getItem('jadwalin_settings');
        return saved ? (JSON.parse(saved).globalDaysOff || getDefaultGlobalDaysOff()) : getDefaultGlobalDaysOff();
    });

    const [workloadWarningThreshold, setWorkloadWarningThreshold] = useState<number>(() => {
        const saved = localStorage.getItem('jadwalin_settings');
        const savedThreshold = saved ? JSON.parse(saved).workloadWarningThreshold : undefined;
        return typeof savedThreshold === 'number' ? savedThreshold : getDefaultWorkloadWarningThreshold();
    });

    // Schedule state
    const [scheduleType, setScheduleType] = useState<'Regular' | 'Exam'>('Regular');
    const [selectedLevel, setSelectedLevel] = useState<string>('');
    const [generatedVariants, setGeneratedVariants] = useState<Schedule[]>([]);
    const [activeVariantIndex, setActiveVariantIndex] = useState(0);
    const [isAllLevelsSchedule, setIsAllLevelsSchedule] = useState(false);
    
    // View state for schedule display
    const [scheduleViewContext, setScheduleViewContext] = useState<'class' | 'teacher' | 'room'>('class');
    const [classScheduleViewMode, setClassScheduleViewMode] = useState<'individual' | 'master'>('individual');
    const [selectedTeacherForView, setSelectedTeacherForView] = useState<string>('');
    const [selectedRoomForView, setSelectedRoomForView] = useState<string>('');
    const [isCompactView, setIsCompactView] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState<'dashboard' | 'data' | 'schedule' | 'archive' | 'settings' | 'help'>('dashboard');
    const [activeDataTab, setActiveDataTab] = useState('levels');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string[] | null>(null);
    const [filter, setFilter] = useState({ type: 'class', value: '' });
    const [modalContent, setModalContent] = useState<'teacher' | 'class' | 'subject' | 'room' | 'level' | null>(null);
    const [editingData, setEditingData] = useState<any | null>(null);
    const [editingLevel, setEditingLevel] = useState<EducationLevel | null>(null);
    const restoreInputRef = useRef<HTMLInputElement>(null);
    const [toast, setToast] = useState({ message: '', type: 'success' as ToastType, isVisible: false });

    // Archive & Theme State
    const [archives, setArchives] = useState<ArchivedSchedule[]>([]);
    const [viewingArchive, setViewingArchive] = useState<ArchivedSchedule | null>(null);
    const [selectedAccentColor, setSelectedAccentColor] = useState<string>(ACCENT_COLORS[0]);
    
    // Substitute Teacher State
    const [substituteFinderContext, setSubstituteFinderContext] = useState<SubstituteFinderContext | null>(null);
    const [availableSubstitutes, setAvailableSubstitutes] = useState<(Teacher & { dailyHours: number })[]>([]);

    // Drag and Drop State
    const sensors = useSensors(useSensor(PointerSensor));
    const [activeDragData, setActiveDragData] = useState<DragData | null>(null);
    const [droppableState, setDroppableState] = useState<{ overId: string | null; isValid: boolean; conflictMessage: string }>({ overId: null, isValid: false, conflictMessage: '' });

    // PWA Service Worker Registration
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => console.log('Jadwalin PWA ServiceWorker registration successful with scope: ', registration.scope))
                    .catch(error => console.log('Jadwalin PWA ServiceWorker registration failed: ', error));
            });
        }
    }, []);

    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ message, type, isVisible: true });
    };

    // Load data from localStorage
    useEffect(() => {
        const defaultRegularTimeSlots: TimeSlot[] = [
            { id: 'ts-reg-1', type: 'period', startTime: '07:30', endTime: '08:15', label: '07:30 - 08:15' },
            { id: 'ts-reg-2', type: 'period', startTime: '08:15', endTime: '09:00', label: '08:15 - 09:00' },
            { id: 'ts-reg-3', type: 'break', label: 'Istirahat Pagi', startTime: '09:00', endTime: '09:15' },
            { id: 'ts-reg-4', type: 'period', startTime: '09:15', endTime: '10:00', label: '09:15 - 10:00' },
            { id: 'ts-reg-5', type: 'period', startTime: '10:00', endTime: '10:45', label: '10:00 - 10:45' },
            { id: 'ts-reg-6', type: 'break', label: 'Istirahat Siang', startTime: '12:15', endTime: '13:00' },
            { id: 'ts-reg-7', type: 'period', startTime: '13:00', endTime: '13:45', label: '13:00 - 13:45' },
            { id: 'ts-reg-8', type: 'period', startTime: '13:45', endTime: '14:30', label: '13:45 - 14:30' },
        ];
        const defaultExamTimeSlots: TimeSlot[] = [
            { id: 'ts-exam-1', type: 'period', startTime: '08:00', endTime: '10:00', label: '08:00 - 10:00' },
            { id: 'ts-exam-2', type: 'break', label: 'Istirahat', startTime: '10:00', endTime: '10:30' },
            { id: 'ts-exam-3', type: 'period', startTime: '10:30', endTime: '12:30', label: '10:30 - 12:30' },
        ];
        const defaultTimeSlots = { regular: defaultRegularTimeSlots, exam: defaultExamTimeSlots };
        
        const savedData = localStorage.getItem('jadwalin_data');
        if (savedData) {
            const data = JSON.parse(savedData);
            const migratedLevels = (data.levels || []).map((level: any) => ({
                ...level,
                timeSlots: {
                    regular: level.timeSlots?.regular || defaultRegularTimeSlots,
                    exam: level.timeSlots?.exam || defaultExamTimeSlots
                }
            }));
            setLevels(migratedLevels);
            setSubjects(data.subjects || []);
            setTeachers(data.teachers || []);
            setRooms(data.rooms || []);
            setClasses(data.classes || []);
            if (migratedLevels.length > 0) setSelectedLevel(migratedLevels[0].id);
        } else {
            const initialLevels: EducationLevel[] = [{ id: 'level-1', name: 'SMP', timeSlots: defaultTimeSlots, daysOff: ['Saturday', 'Sunday'] }, { id: 'level-2', name: 'SMA', timeSlots: defaultTimeSlots, daysOff: ['Saturday', 'Sunday'] }];
            const initialSubjects: Subject[] = [{ id: 'subj-1', name: 'Matematika', levelId: 'level-1' }, { id: 'subj-2', name: 'IPA', levelId: 'level-1' }, { id: 'subj-3', name: 'Fisika', levelId: 'level-2' }, { id: 'subj-4', name: 'Kimia', levelId: 'level-2' }];
            const initialTeachers: Teacher[] = [{ id: 'teach-1', name: 'Budi', availableDays: ['Monday', 'Wednesday', 'Friday'], canTeachSubjects: ['subj-1', 'subj-2'], canTeachInLevels: ['level-1'] }, { id: 'teach-2', name: 'Ani', availableDays: ['Tuesday', 'Thursday'], canTeachSubjects: ['subj-3', 'subj-4'], canTeachInLevels: ['level-2'] }, { id: 'teach-3', name: 'Candra', availableDays: ['Monday', 'Tuesday', 'Wednesday'], canTeachSubjects: ['subj-1', 'subj-3'], canTeachInLevels: ['level-1', 'level-2'] }];
            const initialRooms: Room[] = [{ id: 'room-1', name: 'Ruang 101', levelIds: ['level-1', 'level-2'] }, { id: 'room-2', name: 'Lab IPA', levelIds: ['level-1'] }, { id: 'room-3', name: 'Lab Fisika', levelIds: ['level-2'] }];
            const initialClasses: Class[] = [{ id: 'class-1', name: 'Kelas 7A', levelId: 'level-1', subjects: [{ subjectId: 'subj-1', hoursPerWeek: 3, teacherId: 'teach-1', requiresRoom: true }, { subjectId: 'subj-2', hoursPerWeek: 2, teacherId: 'teach-1', requiresRoom: true }] }, { id: 'class-2', name: 'Kelas 10A', levelId: 'level-2', subjects: [{ subjectId: 'subj-3', hoursPerWeek: 3, teacherId: 'teach-2' }, { subjectId: 'subj-4', hoursPerWeek: 2, teacherId: 'teach-2' }] }];
            setLevels(initialLevels); setSubjects(initialSubjects); setTeachers(initialTeachers); setRooms(initialRooms); setClasses(initialClasses);
            if (initialLevels.length > 0) setSelectedLevel(initialLevels[0].id);
        }
        
        const savedArchives = localStorage.getItem('jadwalin_archives');
        if (savedArchives) setArchives(JSON.parse(savedArchives));
    }, []);
    
    // Save data to localStorage
    useEffect(() => {
        localStorage.setItem('jadwalin_data', JSON.stringify({ levels, subjects, teachers, rooms, classes }));
    }, [levels, subjects, teachers, rooms, classes]);
    useEffect(() => {
        localStorage.setItem('jadwalin_archives', JSON.stringify(archives));
    }, [archives]);
    
    useEffect(() => {
        if (scheduleViewContext === 'teacher' && teachers.length > 0 && !selectedTeacherForView) setSelectedTeacherForView(teachers[0].name);
        if (scheduleViewContext === 'room' && rooms.length > 0 && !selectedRoomForView) setSelectedRoomForView(rooms[0].name);
    }, [scheduleViewContext, teachers, rooms, selectedTeacherForView, selectedRoomForView]);

    const handleGenerateSchedule = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setIsAllLevelsSchedule(false);
        setScheduleViewContext('class');
        setClassScheduleViewMode('individual');
        setSelectedTeacherForView('');
        setSelectedRoomForView('');
        
        const currentLevel = levels.find(l => l.id === selectedLevel);
        if (!currentLevel) {
            setError(['Selected education level not found.']);
            setIsLoading(false);
            return;
        }
        
        const filteredClasses = classes.filter(c => c.levelId === selectedLevel);
        if (teachers.length === 0 || subjects.length === 0 || rooms.length === 0 || filteredClasses.length === 0) {
            setError([t('addError')]);
            setIsLoading(false);
            return;
        }
        
        const result = await generateLocalSchedule(teachers, subjects, rooms, filteredClasses, scheduleType, t, levels, globalDaysOff);
        
        if (isConflictError(result)) {
            setError(result.conflicts);
        } else {
            setGeneratedVariants(prev => [...prev, result]);
            setActiveVariantIndex(generatedVariants.length);
        }
        setIsLoading(false);
    }, [teachers, subjects, rooms, classes, scheduleType, selectedLevel, t, levels, generatedVariants.length, globalDaysOff]);

    const handleGenerateAllLevelsSchedule = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setIsAllLevelsSchedule(true);
        setScheduleViewContext('class');
        setClassScheduleViewMode('individual');
        setSelectedTeacherForView('');
        setSelectedRoomForView('');

        if (teachers.length === 0 || subjects.length === 0 || rooms.length === 0 || classes.length === 0) {
            setError([t('addErrorAllLevels')]);
            setIsLoading(false);
            return;
        }

        const result = await generateLocalSchedule(teachers, subjects, rooms, classes, scheduleType, t, levels, globalDaysOff);
        
        if (isConflictError(result)) {
            setError(result.conflicts);
        } else {
            setGeneratedVariants(prev => [...prev, result]);
            setActiveVariantIndex(generatedVariants.length);
        }
        setIsLoading(false);
    }, [teachers, subjects, rooms, classes, scheduleType, t, levels, generatedVariants.length, globalDaysOff]);

    const handleSaveToArchive = () => {
        if (generatedVariants.length === 0) return;
        const scheduleToArchive = generatedVariants[activeVariantIndex];
        const currentLevel = levels.find(l => l.id === selectedLevel);
        
        const getTimeSlotsForArchive = () => {
            if (isAllLevelsSchedule) {
                const levelIdsInSchedule = new Set(Object.keys(scheduleToArchive).map(cn => classes.find(c => c.name === cn)?.levelId).filter(Boolean));
                const unionSlots: TimeSlot[] = [];
                levels.forEach(level => {
                    if (levelIdsInSchedule.has(level.id)) {
                        const slots = scheduleType === 'Regular' ? level.timeSlots.regular : level.timeSlots.exam;
                        slots.forEach(slot => {
                            if (!unionSlots.some(s => s.label === slot.label && s.type === slot.type)) unionSlots.push(slot);
                        });
                    }
                });
                return unionSlots.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
            }
            return scheduleType === 'Regular' ? currentLevel?.timeSlots.regular : currentLevel?.timeSlots.exam;
        };

        const newArchive: ArchivedSchedule = {
            id: Date.now(),
            date: new Date().toISOString(),
            scheduleType,
            levelName: isAllLevelsSchedule ? t('allLevels') : (currentLevel?.name || 'Unknown Level'),
            schedule: scheduleToArchive,
            institutionInfo,
            academicYear,
            accentColor: selectedAccentColor,
            timeSlots: getTimeSlotsForArchive() || [],
            printSettings: printSettings,
        };
        setArchives(prev => [newArchive, ...prev]);
        setGeneratedVariants([]);
        setActiveVariantIndex(0);
        showToast(t('archiveSuccess'), 'success');
    };
    
    const removeDataItem = <T extends {id: string}>(setter: React.Dispatch<React.SetStateAction<T[]>>, id: string) => {
        setter(prev => prev.filter(item => item.id !== id));
    };

    const closeAllModals = () => {
        setModalContent(null);
        setEditingData(null);
        setEditingLevel(null);
        setViewingArchive(null);
        setSubstituteFinderContext(null);
    };

    const handleSaveLevel = (data: Omit<EducationLevel, 'id' | 'timeSlots'> | EducationLevel) => {
        if ('id' in data) {
            setLevels(prev => prev.map(l => l.id === data.id ? data as EducationLevel : l));
        } else {
            const defaultTimeSlots = { regular: [{ id: 'ts-reg-1', type: 'period' as const, startTime: '07:30', endTime: '08:15', label: '07:30 - 08:15' }], exam: [{ id: 'ts-exam-1', type: 'period' as const, startTime: '08:00', endTime: '10:00', label: '08:00 - 10:00' }] };
            const newLevel: EducationLevel = { id: `level-${Date.now()}`, name: data.name, daysOff: data.daysOff, timeSlots: defaultTimeSlots };
            setLevels(prev => [...prev, newLevel]);
        }
        closeAllModals();
    };

    const handleSaveSubject = (data: Omit<Subject, 'id'> | Subject) => {
        if ('id' in data) {
            setSubjects(prev => prev.map(s => s.id === data.id ? data as Subject : s));
        } else {
            setSubjects(prev => [...prev, { id: `subj-${Date.now()}`, ...data }]);
        }
        closeAllModals();
    };
    
    const handleSaveRoom = (data: Omit<Room, 'id'> | Room) => {
        if ('id' in data) {
            setRooms(prev => prev.map(r => r.id === data.id ? data as Room : r));
        } else {
            setRooms(prev => [...prev, { id: `room-${Date.now()}`, ...data }]);
        }
        closeAllModals();
    };
    
    const handleSaveTeacher = (data: Omit<Teacher, 'id'> | Teacher) => {
        if ('id' in data) {
            setTeachers(prev => prev.map(t => t.id === data.id ? data as Teacher : t));
        } else {
            setTeachers(prev => [...prev, { id: `teach-${Date.now()}`, ...data }]);
        }
        closeAllModals();
    };
    
    const handleSaveClass = (data: Omit<Class, 'id'> | Class) => {
        if ('id' in data) {
            setClasses(prev => prev.map(c => c.id === data.id ? data as Class : c));
        } else {
            setClasses(prev => [...prev, { id: `class-${Date.now()}`, ...data }]);
        }
        closeAllModals();
    };

    const handleUpdateTimeSlotsForLevel = (newTimeSlots: {regular: TimeSlot[], exam: TimeSlot[]}) => {
        if (!editingLevel) return;
        setLevels(prevLevels => prevLevels.map(level => 
            level.id === editingLevel.id ? { ...level, timeSlots: newTimeSlots } : level
        ));
    };

    const getScheduleContentAsHTML = useCallback(async (archiveItem: ArchivedSchedule, forceLightTheme: boolean, viewContext: 'class' | 'teacher' | 'room', viewContextSubject: string, classViewMode: 'individual' | 'master', isCompact: boolean) => {
        const tempDiv = document.createElement('div');
        const root = ReactDOM.createRoot(tempDiv);
        const showHeader = archiveItem.printSettings?.showHeader ?? true;
        const displayDays = DAYS_OF_WEEK.filter(day => !globalDaysOff.includes(day));
        
        let scheduleComponent;
        const onEntryClickStub = () => {};

        if (viewContext === 'teacher') {
            scheduleComponent = <TeacherScheduleTable schedule={archiveItem.schedule} teacherName={viewContextSubject} t={t} accentColor={archiveItem.accentColor} timeSlots={archiveItem.timeSlots} displayDays={displayDays} onEntryClick={onEntryClickStub} droppableState={{}} isCompactView={isCompact} />;
        } else if (viewContext === 'room') {
            scheduleComponent = <RoomScheduleTable schedule={archiveItem.schedule} roomName={viewContextSubject} t={t} accentColor={archiveItem.accentColor} timeSlots={archiveItem.timeSlots} displayDays={displayDays} onEntryClick={onEntryClickStub} droppableState={{}} isCompactView={isCompact} />;
        } else if (classViewMode === 'master') {
             scheduleComponent = <MasterScheduleTable schedule={archiveItem.schedule} t={t} accentColor={archiveItem.accentColor} globalDaysOff={globalDaysOff} levels={levels} classes={classes} timeSlots={archiveItem.timeSlots} onEntryClick={onEntryClickStub} droppableState={{}} isCompactView={isCompact} />;
        } else {
            scheduleComponent = <ScheduleTable schedule={archiveItem.schedule} filter={{ type: '', value: '' }} t={t} accentColor={archiveItem.accentColor} globalDaysOff={globalDaysOff} levels={levels} classes={classes} timeSlotsForLevel={() => archiveItem.timeSlots} onEntryClick={onEntryClickStub} droppableState={{}} isCompactView={isCompact} />;
        }
        
        const finalComponent = (
             <React.StrictMode>
                <div style={{'--accent-color': archiveItem.accentColor} as React.CSSProperties}>
                    {showHeader && <ScheduleHeader {...archiveItem} selectedLevelName={archiveItem.levelName} viewContext={viewContext} viewSubjectName={viewContextSubject} />}
                    {scheduleComponent}
                </div>
            </React.StrictMode>
        );

        root.render(forceLightTheme ? <div className="light">{finalComponent}</div> : finalComponent);
        return new Promise<string>(resolve => setTimeout(() => resolve(tempDiv.innerHTML), 100));
    }, [t, globalDaysOff, levels, classes]);

    const generateDetailedFilename = (archiveItem: ArchivedSchedule) => {
        const sanitizedYear = (archiveItem.academicYear.masehi || '').replace(/[\\/]/g, '-') || 'TA-Tidak-Diatur';
        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        return `Jadwalin_${archiveItem.levelName.replace(/\s+/g, '-')}_${archiveItem.scheduleType}_${sanitizedYear}_${timestamp}`;
    };

    const handleExportHTML = async (archiveItem: ArchivedSchedule, viewContext: 'class' | 'teacher' | 'room', viewContextSubject: string, classViewMode: 'individual' | 'master', isCompact: boolean) => {
        const scheduleHTML = await getScheduleContentAsHTML(archiveItem, true, viewContext, viewContextSubject, classViewMode, isCompact);
        const styles = getExportStyles(archiveItem.printSettings || printSettings);
        const fullHTML = `<!DOCTYPE html><html lang="${language}"><head><meta charset="UTF-8"><title>${t('exportedScheduleTitle')}</title><style>${styles}</style></head><body class="bg-white p-8"><main>${scheduleHTML}</main></body></html>`;
        const blob = new Blob([fullHTML], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${generateDetailedFilename(archiveItem)}.html`;
        link.click();
        URL.revokeObjectURL(link.href);
    };
    
    const handleExportCSV = (archiveItem: ArchivedSchedule) => {
        let csvContent = "data:text/csv;charset=utf-8,Kelas,Hari,Waktu,Mata Pelajaran,Guru,Ruangan\n";
        for (const className in archiveItem.schedule) {
            for (const day in archiveItem.schedule[className]) {
                for (const timeSlot in archiveItem.schedule[className][day as Day]) {
                    const entry = archiveItem.schedule[className][day as Day]![timeSlot];
                    csvContent += `"${className}","${t(day as TranslationKey)}","${timeSlot}","${entry.subjectName}","${entry.teacherName}","${entry.roomName}"\n`;
                }
            }
        }
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${generateDetailedFilename(archiveItem)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = async (archiveItem: ArchivedSchedule, viewContext: 'class' | 'teacher' | 'room', viewContextSubject: string, classViewMode: 'individual' | 'master', isCompact: boolean) => {
        const scheduleHTML = await getScheduleContentAsHTML(archiveItem, false, viewContext, viewContextSubject, classViewMode, isCompact);
        const styles = getExportStyles(archiveItem.printSettings || printSettings);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<!DOCTYPE html><html lang="${language}" class="${localStorage.getItem('theme') || 'light'}"><head><title>${t('print')} - ${archiveItem.levelName}</title><style>${styles}</style></head><body>${scheduleHTML}</body></html>`);
            printWindow.document.close();
            setTimeout(() => printWindow.print(), 250);
        }
    };

    const handleSaveSettings = () => {
        localStorage.setItem('jadwalin_settings', JSON.stringify({ institutionInfo, academicYear, printSettings, globalDaysOff, workloadWarningThreshold }));
        showToast(t('settingsSaved'), 'success');
    };
    
    const handleBackup = () => {
        const dataToBackup = { version: "2.2", settings: { institutionInfo, academicYear, printSettings, globalDaysOff, workloadWarningThreshold }, data: { levels, subjects, teachers, rooms, classes }, archives };
        const dataStr = JSON.stringify(dataToBackup, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
        link.download = `Jadwalin_Backup_${timestamp}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        showToast(t('backupSuccess'), 'info');
    };

    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !window.confirm(t('restoreConfirm'))) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const restored = JSON.parse(e.target?.result as string);
                if (restored.version && restored.data && restored.data.levels) {
                    const s = restored.settings || {};
                    if (s.institutionInfo && Array.isArray(s.institutionInfo)) setInstitutionInfo(s.institutionInfo);
                    setAcademicYear(s.academicYear || getDefaultAcademicYear());
                    setPrintSettings(s.printSettings || getDefaultPrintSettings());
                    setGlobalDaysOff(s.globalDaysOff || getDefaultGlobalDaysOff());
                    setWorkloadWarningThreshold(typeof s.workloadWarningThreshold === 'number' ? s.workloadWarningThreshold : getDefaultWorkloadWarningThreshold());
                    setLevels(restored.data.levels || []);
                    setSubjects(restored.data.subjects || []);
                    setTeachers(restored.data.teachers || []);
                    setRooms(restored.data.rooms || []);
                    setClasses(restored.data.classes || []);
                    setArchives(restored.archives || []);
                    showToast(t('restoreSuccess'), 'success');
                    setActiveTab('dashboard');
                } else throw new Error("Invalid file structure");
            } catch (error) {
                showToast(t('restoreError'), 'error');
            } finally {
                if(restoreInputRef.current) restoreInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };

    const calculateDailyHours = useCallback((teacherId: string, day: Day, schedule: Schedule) => {
        let hours = 0;
        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher) return 0;
        for (const className in schedule) {
            const daySchedule = schedule[className]?.[day];
            if (daySchedule) {
                for (const slot in daySchedule) {
                    if (daySchedule[slot].teacherName === teacher.name) {
                        hours++;
                    }
                }
            }
        }
        return hours;
    }, [teachers]);

    const handleOpenSubstituteFinder = (context: SubstituteFinderContext) => {
        const { day, timeSlot, entry } = context;
        const currentSchedule = viewingArchive ? viewingArchive.schedule : generatedVariants[activeVariantIndex];
        if (!currentSchedule) return;

        const subject = subjects.find(s => s.name === entry.subjectName);
        const originalTeacher = teachers.find(t => t.name === entry.teacherName);
        if (!subject || !originalTeacher) return;

        const busyTeacherNames = new Set<string>();
        for (const className in currentSchedule) {
            const scheduleEntry = currentSchedule[className]?.[day]?.[timeSlot];
            if (scheduleEntry) busyTeacherNames.add(scheduleEntry.teacherName);
        }

        const candidates = teachers
            .filter(t => t.id !== originalTeacher.id && t.canTeachSubjects.includes(subject.id) && t.availableDays.includes(day) && !busyTeacherNames.has(t.name))
            .map(teacher => ({ ...teacher, dailyHours: calculateDailyHours(teacher.id, day, currentSchedule) }));
            
        setAvailableSubstitutes(candidates);
        setSubstituteFinderContext(context);
    };
    
    const handleSelectSubstitute = (newTeacherName: string) => {
        if (!substituteFinderContext) return;
        const { className, day, timeSlot } = substituteFinderContext;
        const updateScheduleState = (schedule: Schedule): Schedule => {
            const newSchedule = JSON.parse(JSON.stringify(schedule)); // Deep copy
            if (newSchedule[className]?.[day]?.[timeSlot]) {
                newSchedule[className][day][timeSlot].teacherName = newTeacherName;
            }
            return newSchedule;
        };
        if (viewingArchive) {
            setViewingArchive(prev => prev ? { ...prev, schedule: updateScheduleState(prev.schedule) } : null);
        } else {
            setGeneratedVariants(prev => {
                const newVariants = [...prev];
                newVariants[activeVariantIndex] = updateScheduleState(newVariants[activeVariantIndex]);
                return newVariants;
            });
        }
        showToast(t('substituteSetSuccess'), 'success');
        closeAllModals();
    };

    // --- DRAG & DROP LOGIC ---
    const checkDropValidity = useCallback((
        dragData: DragData,
        target: { className: string; day: Day; timeSlot: string },
        currentSchedule: Schedule
    ): { isValid: boolean; conflictMessage: string } => {
        if (currentSchedule[target.className]?.[target.day]?.[target.timeSlot]) {
            return { isValid: false, conflictMessage: "Slot ini sudah terisi." };
        }

        const teacher = teachers.find(t => t.name === dragData.entry.teacherName);
        if (!teacher) return { isValid: false, conflictMessage: "Data guru tidak ditemukan." };

        if (!teacher.availableDays.includes(target.day)) {
            return { isValid: false, conflictMessage: t('dragConflictTeacherUnavailable', { teacherName: teacher.name, day: t(target.day) }) };
        }

        for (const cn in currentSchedule) {
            if (currentSchedule[cn]?.[target.day]?.[target.timeSlot]?.teacherName === teacher.name) {
                return { isValid: false, conflictMessage: t('dragConflictTeacherBusy', { teacherName: teacher.name }) };
            }
        }

        const roomName = dragData.entry.roomName;
        if (roomName !== t('noRoom')) {
            for (const cn in currentSchedule) {
                if (currentSchedule[cn]?.[target.day]?.[target.timeSlot]?.roomName === roomName) {
                    return { isValid: false, conflictMessage: t('dragConflictRoomBusy', { roomName }) };
                }
            }
        }

        if (teacher.maxHoursPerDay) {
            if (dragData.from.day !== target.day) {
                const hoursOnTargetDay = calculateDailyHours(teacher.id, target.day, currentSchedule);
                if (hoursOnTargetDay + 1 > teacher.maxHoursPerDay) {
                    return { isValid: false, conflictMessage: t('dragConflictTeacherMaxHours', { teacherName: teacher.name }) };
                }
            }
        }
        
        return { isValid: true, conflictMessage: '' };
    }, [teachers, t, calculateDailyHours]);


    const handleDragStart = useCallback((event: DragStartEvent) => { setActiveDragData(event.active.data.current as DragData); }, []);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { active, over } = event;
        if (!over || !active.data.current || active.id === over.id || !over.data.current) {
            setDroppableState({ overId: null, isValid: false, conflictMessage: '' });
            return;
        }

        const draggedData = active.data.current as DragData;
        const targetData = over.data.current as { className: string; day: Day; timeSlot: string };
        const currentSchedule = viewingArchive ? viewingArchive.schedule : generatedVariants[activeVariantIndex];

        const { isValid, conflictMessage } = checkDropValidity(draggedData, targetData, currentSchedule);
        
        setDroppableState({ overId: String(over.id), isValid, conflictMessage });
    }, [activeVariantIndex, generatedVariants, viewingArchive, checkDropValidity]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragData(null);
        setDroppableState({ overId: null, isValid: false, conflictMessage: '' });

        if (over && active.id !== over.id && over.data.current) {
            const draggedData = active.data.current as DragData;
            const targetData = over.data.current as { className: string; day: Day; timeSlot: string };
            const currentSchedule = viewingArchive ? viewingArchive.schedule : generatedVariants[activeVariantIndex];
            
            const { isValid } = checkDropValidity(draggedData, targetData, currentSchedule);
            
            if (isValid) {
                const { from } = draggedData;
                const { className: toClassName, day: toDay, timeSlot: toTimeSlot } = targetData;

                const updateFn = (prevSchedule: Schedule) => {
                    const newSchedule = JSON.parse(JSON.stringify(prevSchedule));
                    const entryToMove = newSchedule[from.className]?.[from.day]?.[from.timeSlot];
                    if (entryToMove) {
                        delete newSchedule[from.className][from.day][from.timeSlot];
                        if (Object.keys(newSchedule[from.className][from.day]).length === 0) delete newSchedule[from.className][from.day];
                        
                        if (!newSchedule[toClassName]) newSchedule[toClassName] = {};
                        if (!newSchedule[toClassName][toDay]) newSchedule[toClassName][toDay] = {};
                        newSchedule[toClassName][toDay]![toTimeSlot] = entryToMove;
                    }
                    return newSchedule;
                };

                if (viewingArchive) {
                    setViewingArchive(prev => prev ? { ...prev, schedule: updateFn(prev.schedule) } : null);
                } else {
                    setGeneratedVariants(prev => {
                        const newVariants = [...prev];
                        newVariants[activeVariantIndex] = updateFn(newVariants[activeVariantIndex]);
                        return newVariants;
                    });
                }
            }
        }
    }, [activeVariantIndex, generatedVariants, viewingArchive, checkDropValidity]);

    const addInstInfoItem = () => setInstitutionInfo(prev => [...prev, { id: `inst-${Date.now()}`, label: '', value: '', showInHeader: true }]);
    const removeInstInfoItem = (index: number) => setInstitutionInfo(prev => prev.filter((_, i) => i !== index));
    const handleInstInfoChange = (index: number, field: keyof InstitutionInfoItem, value: string | boolean) => {
        setInstitutionInfo(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };

    const timeSlotsForCurrentSchedule = useMemo(() => {
        if (generatedVariants.length === 0 || !generatedVariants[activeVariantIndex]) return [];
        if (isAllLevelsSchedule) {
            const schedule = generatedVariants[activeVariantIndex];
            const levelIdsInSchedule = new Set(Object.keys(schedule).map(cn => classes.find(c => c.name === cn)?.levelId).filter(Boolean));
            const unionSlots: TimeSlot[] = [];
            levels.forEach(level => {
                if (levelIdsInSchedule.has(level.id)) {
                    const slots = scheduleType === 'Regular' ? level.timeSlots.regular : level.timeSlots.exam;
                    slots.forEach(slot => {
                        if (!unionSlots.some(s => s.label === slot.label && s.type === slot.type)) unionSlots.push(slot);
                    });
                }
            });
            return unionSlots.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
        }
        const level = levels.find(l => l.id === selectedLevel);
        return scheduleType === 'Regular' ? level?.timeSlots.regular || [] : level?.timeSlots.exam || [];
    }, [generatedVariants, activeVariantIndex, isAllLevelsSchedule, classes, levels, selectedLevel, scheduleType]);
    
    const mainTabs = useMemo(() => ({
        dashboard: { label: t('dashboard'), icon: 'bi-grid-1x2-fill' },
        data: { label: t('dataManagement'), icon: 'bi-database-fill' },
        schedule: { label: t('scheduleGenerator'), icon: 'bi-calendar-plus-fill' },
        archive: { label: t('scheduleArchive'), icon: 'bi-archive-fill' }
    }), [t]);

    const dataSubTabs = useMemo(() => ({
        levels: { label: t('levels'), icon: 'bi-mortarboard-fill' },
        subjects: { label: t('subjects'), icon: 'bi-book-fill' },
        rooms: { label: t('rooms'), icon: 'bi-door-closed-fill' },
        teachers: { label: t('teachers'), icon: 'bi-person-badge-fill' },
        classes: { label: t('classes'), icon: 'bi-people-fill' }
    }), [t]);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="sticky top-0 z-30 bg-gray-100 dark:bg-gray-900 shadow-sm">
                <Header t={t} language={language} setLanguage={setLanguage} onSettingsClick={() => setActiveTab('settings')} onHelpClick={() => setActiveTab('help')} theme={theme} setTheme={setTheme} />
                <div className="px-4 sm:px-6">
                    <div className="flex flex-nowrap overflow-x-auto no-scrollbar border-b border-gray-300 dark:border-gray-700">
                        {Object.entries(mainTabs).map(([key, { label, icon }]) => (
                            <button key={key} onClick={() => setActiveTab(key as any)} className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === key ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                               <i className={`bi ${icon}`} aria-hidden="true"></i><span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                {activeTab === 'data' && (
                     <div className="px-4 sm:px-6 bg-gray-100 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700">
                        <div className="flex flex-nowrap overflow-x-auto no-scrollbar">
                             {Object.entries(dataSubTabs).map(([key, { label, icon }]) => (
                                <button key={key} onClick={() => setActiveDataTab(key)} className={`px-4 py-2 text-sm font-medium flex items-center gap-2 whitespace-nowrap ${activeDataTab === key ? 'bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-t-lg' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                                    <i className={`bi ${icon}`} aria-hidden="true"></i><span>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <main className="p-4 sm:p-6">
                {activeTab === 'dashboard' && <Dashboard teachers={teachers} subjects={subjects} rooms={rooms} classes={classes} levels={levels} archives={archives} globalDaysOff={globalDaysOff} t={t} theme={theme} />}
                
                {activeTab === 'data' && (
                    <div className="space-y-6">
                        {activeDataTab === 'levels' && <DataCard title={t('levels')} onAdd={() => { setEditingData(null); setModalContent('level'); }} addTooltipText={t('addLevelTitle')}>{levels.map(level => <DataItem key={level.id} onDelete={() => removeDataItem(setLevels, level.id)} onEdit={() => { setEditingData(level); setModalContent('level');}} onEditTimeSlots={() => setEditingLevel(level)} t={t}>{level.name}</DataItem>)}</DataCard>}
                        {activeDataTab === 'subjects' && <DataCard title={t('subjects')} onAdd={() => { setEditingData(null); setModalContent('subject'); }} addTooltipText={t('addSubjectTitle')}>{subjects.map(subject => <DataItem key={subject.id} onDelete={() => removeDataItem(setSubjects, subject.id)} onEdit={() => { setEditingData(subject); setModalContent('subject');}} t={t}>{subject.name} <span className="text-xs text-gray-500">({levels.find(l => l.id === subject.levelId)?.name})</span></DataItem>)}</DataCard>}
                        {activeDataTab === 'rooms' && <DataCard title={t('rooms')} onAdd={() => { setEditingData(null); setModalContent('room'); }} addTooltipText={t('addRoomTitle')}>{rooms.map(room => <DataItem key={room.id} onDelete={() => removeDataItem(setRooms, room.id)} onEdit={() => { setEditingData(room); setModalContent('room');}} t={t}>{room.name}</DataItem>)}</DataCard>}
                        {activeDataTab === 'teachers' && <DataCard title={t('teachers')} onAdd={() => { setEditingData(null); setModalContent('teacher'); }} addTooltipText={t('addTeacher')}>{teachers.map(teacher => <DataItem key={teacher.id} onDelete={() => removeDataItem(setTeachers, teacher.id)} onEdit={() => { setEditingData(teacher); setModalContent('teacher');}} t={t}>{teacher.name}</DataItem>)}</DataCard>}
                        {activeDataTab === 'classes' && <DataCard title={t('classes')} onAdd={() => { setEditingData(null); setModalContent('class'); }} addTooltipText={t('addClass')}>{classes.map(cls => <DataItem key={cls.id} onDelete={() => removeDataItem(setClasses, cls.id)} onEdit={() => { setEditingData(cls); setModalContent('class');}} t={t}>{cls.name} <span className="text-xs text-gray-500">({levels.find(l => l.id === cls.levelId)?.name})</span></DataItem>)}</DataCard>}
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <div className="space-y-6">
                         <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('schedule')}</label>
                                    <select value={scheduleType} onChange={(e) => setScheduleType(e.target.value as any)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2.5">
                                        <option value="Regular">{t('regular')}</option>
                                        <option value="Exam">{t('exam')}</option>
                                    </select>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('levels')}</label>
                                    <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2.5">
                                        <option value="">{t('selectLevelPrompt')}</option>
                                        {levels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2 flex flex-col sm:flex-row gap-2 justify-end w-full">
                                    <button onClick={handleGenerateSchedule} disabled={isLoading || !selectedLevel} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">{isLoading ? t('generating') : <><i className="bi bi-magic"></i>{t('generateButton', {scheduleType: ''})}</>}</button>
                                    <button onClick={handleGenerateAllLevelsSchedule} disabled={isLoading || classes.length === 0} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">{isLoading ? t('generating') : <><i className="bi bi-diagram-3-fill"></i>{t('generateAllLevels')}</>}</button>
                                </div>
                            </div>
                        </div>
                        {error && <div className="bg-red-100 dark:bg-red-800/50 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded-lg" role="alert"><p className="font-bold">{t('generationErrorTitle')}</p><ul className="mt-2 list-disc list-inside text-sm">{error.map((e, i) => <li key={i}>{e}</li>)}</ul></div>}
                        {generatedVariants.length > 0 && (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <h3 className="text-xl font-bold">{t('scheduleVariants')}</h3>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setGeneratedVariants([])} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg flex items-center gap-2"><i className="bi bi-trash3"></i>{t('discardDrafts')}</button>
                                            <button onClick={handleSaveToArchive} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><i className="bi bi-archive-fill"></i>{t('saveToArchive')}</button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 border-b dark:border-gray-700 pb-4">
                                        {generatedVariants.map((_, index) => (
                                            <button key={index} onClick={() => setActiveVariantIndex(index)} className={`px-3 py-1 text-sm rounded-full ${activeVariantIndex === index ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>{t('variant')} {index + 1}</button>
                                        ))}
                                        <button onClick={isAllLevelsSchedule ? handleGenerateAllLevelsSchedule : handleGenerateSchedule} disabled={isLoading} className="px-3 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50 disabled:opacity-50 flex items-center gap-1.5"><i className="bi bi-arrow-repeat"></i> {t('generateNewVariant')}</button>
                                    </div>
                                    <ScheduleViewControls viewContext={scheduleViewContext} setViewContext={setScheduleViewContext} classViewMode={classScheduleViewMode} setClassViewMode={setClassScheduleViewMode} teacher={selectedTeacherForView} setTeacher={setSelectedTeacherForView} room={selectedRoomForView} setRoom={setSelectedRoomForView} isCompact={isCompactView} onToggleCompact={() => setIsCompactView(prev => !prev)} teachers={teachers} rooms={rooms} t={t}/>
                                    <div className={`flex flex-wrap items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg transition-opacity ${scheduleViewContext !== 'class' || classScheduleViewMode !== 'individual' ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('filterBy')}</h4>
                                        <select onChange={e => setFilter({ type: e.target.value, value: '' })} value={filter.type} className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-sm px-3 py-2.5"><option value="class">{t('class')}</option><option value="teacher">{t('teacher')}</option><option value="room">{t('room')}</option></select>
                                        {filter.type === 'class' && (<select onChange={e => setFilter({ ...filter, value: e.target.value })} value={filter.value} className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-sm px-3 py-2.5"><option value="">{t('all')}</option>{Object.keys(generatedVariants[activeVariantIndex]).sort().map(name => <option key={name} value={name}>{name}</option>)}</select>)}
                                        {filter.type === 'teacher' && (<select onChange={e => setFilter({ ...filter, value: e.target.value })} value={filter.value} className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-sm px-3 py-2.5"><option value="">{t('all')}</option>{teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select>)}
                                        {filter.type === 'room' && (<select onChange={e => setFilter({ ...filter, value: e.target.value })} value={filter.value} className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-sm px-3 py-2.5"><option value="">{t('all')}</option>{rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}</select>)}
                                    </div>
                                    <div className="mt-4">
                                        {scheduleViewContext === 'class' ? (classScheduleViewMode === 'individual' ? (<ScheduleTable schedule={generatedVariants[activeVariantIndex]} filter={filter} t={t} accentColor={selectedAccentColor} globalDaysOff={globalDaysOff} levels={levels} classes={classes} onEntryClick={handleOpenSubstituteFinder} droppableState={droppableState} isCompactView={isCompactView} timeSlotsForLevel={isAllLevelsSchedule ? (levelId) => { const level = levels.find(l => l.id === levelId); return scheduleType === 'Regular' ? level?.timeSlots.regular || [] : level?.timeSlots.exam || [] } : () => timeSlotsForCurrentSchedule} />) : (<MasterScheduleTable schedule={generatedVariants[activeVariantIndex]} t={t} accentColor={selectedAccentColor} globalDaysOff={globalDaysOff} levels={levels} classes={classes} timeSlots={timeSlotsForCurrentSchedule} onEntryClick={handleOpenSubstituteFinder} droppableState={droppableState} isCompactView={isCompactView} />)) : scheduleViewContext === 'teacher' ? (<TeacherScheduleTable schedule={generatedVariants[activeVariantIndex]} teacherName={selectedTeacherForView} timeSlots={timeSlotsForCurrentSchedule} displayDays={DAYS_OF_WEEK.filter(day => !globalDaysOff.includes(day))} t={t} accentColor={selectedAccentColor} onEntryClick={handleOpenSubstituteFinder} droppableState={droppableState} isCompactView={isCompactView} />) : (<RoomScheduleTable schedule={generatedVariants[activeVariantIndex]} roomName={selectedRoomForView} timeSlots={timeSlotsForCurrentSchedule} displayDays={DAYS_OF_WEEK.filter(day => !globalDaysOff.includes(day))} t={t} accentColor={selectedAccentColor} onEntryClick={handleOpenSubstituteFinder} droppableState={droppableState} isCompactView={isCompactView} />)}
                                    </div>
                                </div>
                            </DndContext>
                        )}
                    </div>
                )}
                
                {activeTab === 'archive' && (
                     <div className="space-y-4">
                        {archives.length === 0 ? (
                            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow"><i className="bi bi-archive text-5xl text-gray-300 dark:text-gray-600"></i><h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-200">{t('archiveEmpty')}</h3><p className="mt-1 text-gray-500 dark:text-gray-400">{t('archiveEmptyDesc')}</p></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {archives.map(archive => (
                                    <div key={archive.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex flex-col justify-between" style={{ borderLeft: `5px solid ${archive.accentColor}` }}>
                                        <div><p className="font-bold text-lg text-gray-800 dark:text-gray-200">{archive.levelName}</p><p className="text-sm text-gray-600 dark:text-gray-400">{t(archive.scheduleType as 'regular' | 'exam')}</p><p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('archivedOn')}: {new Date(archive.date).toLocaleString(language)}</p></div>
                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t dark:border-gray-700"><button onClick={() => setViewingArchive(archive)} className="text-sm bg-blue-100 dark:bg-blue-800/50 hover:bg-blue-200 dark:hover:bg-blue-700/70 text-blue-700 dark:text-blue-200 font-semibold py-1 px-2 rounded-md flex-grow flex items-center justify-center gap-1.5"><i className="bi bi-eye-fill"></i> {t('viewSchedule')}</button><button onClick={() => { if(window.confirm(t('deleteConfirm'))) setArchives(prev => prev.filter(a => a.id !== archive.id)) }} className="text-sm bg-red-100 dark:bg-red-800/50 hover:bg-red-200 dark:hover:bg-red-700/70 text-red-700 dark:text-red-200 font-semibold py-1 px-2 rounded-md flex items-center justify-center gap-1.5"><i className="bi bi-trash3-fill"></i></button></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><h3 className="text-lg font-semibold mb-4">{t('institutionInfo')}</h3><div className="space-y-3">{institutionInfo.map((item, index) => (<div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-2 rounded-md"><input type="text" placeholder={t('infoLabel')} value={item.label} onChange={e => handleInstInfoChange(index, 'label', e.target.value)} className="w-full md:col-span-4 rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm" /><input type="text" placeholder={t('infoValue')} value={item.value} onChange={e => handleInstInfoChange(index, 'value', e.target.value)} className="w-full md:col-span-6 rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm" /><div className="md:col-span-2 flex items-center justify-end md:justify-between gap-2"><Tooltip text={t('showInHeader')}><label className="flex items-center space-x-2 text-xs cursor-pointer p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"><input type="checkbox" checked={item.showInHeader} onChange={e => handleInstInfoChange(index, 'showInHeader', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500"/><i className="bi bi-printer-fill text-gray-500 dark:text-gray-400"></i></label></Tooltip><Tooltip text={t('delete')}><button onClick={() => removeInstInfoItem(index)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40"><i className="bi bi-trash3-fill"></i></button></Tooltip></div></div>))}</div><button onClick={addInstInfoItem} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"><i className="bi bi-plus-circle-fill"></i> {t('addInfo')}</button></div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><h3 className="text-lg font-semibold mb-4">{t('academicYear')}</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="text" placeholder={t('academicYearMasehi')} value={academicYear.masehi} onChange={e => setAcademicYear({...academicYear, masehi: e.target.value})} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2" /><input type="text" placeholder={t('academicYearHijri')} value={academicYear.hijri} onChange={e => setAcademicYear({...academicYear, hijri: e.target.value})} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2" /></div></div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><h3 className="text-lg font-semibold mb-4">Pengaturan Logika & Validasi</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('workloadWarningThreshold')}</label><Tooltip text={t('workloadWarningThresholdTooltip')}><input type="number" min="0" value={workloadWarningThreshold} onChange={e => setWorkloadWarningThreshold(parseInt(e.target.value, 10) || 0)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2" /></Tooltip></div></div></div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><h3 className="text-lg font-semibold mb-4">{t('holidaySettings')}</h3><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('globalHolidays')}</label><p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('globalHolidaysDesc')}</p><div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">{DAYS_OF_WEEK.map(day => (<label key={day} className="flex items-center space-x-2 text-sm"><input type="checkbox" checked={globalDaysOff.includes(day)} onChange={() => setGlobalDaysOff(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])} className="rounded text-blue-600 focus:ring-blue-500" /><span>{t(day as TranslationKey)}</span></label>))}</div></div></div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><h3 className="text-lg font-semibold mb-4">{t('printExportSettings')}</h3><div className="space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">{t('paperSize')}</label><select value={printSettings.paperSize} onChange={e => setPrintSettings(p => ({...p, paperSize: e.target.value as any}))} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2"><option value="A4">A4</option><option value="F4">F4</option><option value="Letter">Letter</option><option value="Legal">Legal</option></select></div><div><label className="block text-sm font-medium mb-1">{t('orientation')}</label><select value={printSettings.orientation} onChange={e => setPrintSettings(p => ({...p, orientation: e.target.value as any}))} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2"><option value="portrait">{t('portrait')}</option><option value="landscape">{t('landscape')}</option></select></div></div><div><label className="block text-sm font-medium mb-1">{t('margins')}</label><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{([ 'top', 'bottom', 'left', 'right' ] as const).map(m => (<input key={m} type="number" placeholder={t(m)} value={printSettings.margin[m]} onChange={e => setPrintSettings(p => ({...p, margin: {...p.margin, [m]: Number(e.target.value)}}))} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2" />))}</div></div><label className="flex items-center space-x-2"><input type="checkbox" checked={printSettings.showHeader} onChange={e => setPrintSettings(p => ({...p, showHeader: e.target.checked}))} className="rounded text-blue-600 focus:ring-blue-500" /><span>{t('includeHeader')}</span></label></div></div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"><h3 className="text-lg font-semibold mb-4">{t('dataBackupRestore')}</h3><div className="flex gap-4"><button onClick={handleBackup} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"><i className="bi bi-download"></i>{t('backupData')}</button><button onClick={() => restoreInputRef.current?.click()} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"><i className="bi bi-upload"></i>{t('restoreData')}</button><input type="file" ref={restoreInputRef} onChange={handleRestore} accept=".json" className="hidden" /></div></div>
                        <div className="flex justify-end pt-4 border-t dark:border-gray-700"><button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><i className="bi bi-check-lg"></i>{t('saveSettings')}</button></div>
                    </div>
                )}
                
                {activeTab === 'help' && <HelpAndAboutPage t={t} />}
            </main>

            {modalContent === 'level' && <Modal isOpen={true} onClose={closeAllModals} title={editingData ? t('editLevelTitle') : t('addLevelTitle')} t={t}><LevelForm onSave={handleSaveLevel} onCancel={closeAllModals} t={t} initialData={editingData} globalDaysOff={globalDaysOff} /></Modal>}
            {modalContent === 'subject' && <Modal isOpen={true} onClose={closeAllModals} title={editingData ? t('editSubjectTitle') : t('addSubjectTitle')} t={t}><SubjectForm levels={levels} onSave={handleSaveSubject} onCancel={closeAllModals} t={t} initialData={editingData} /></Modal>}
            {modalContent === 'room' && <Modal isOpen={true} onClose={closeAllModals} title={editingData ? t('editRoomTitle') : t('addRoomTitle')} t={t}><RoomForm levels={levels} classes={classes} onSave={handleSaveRoom} onCancel={closeAllModals} t={t} initialData={editingData} /></Modal>}
            {modalContent === 'teacher' && <Modal isOpen={true} onClose={closeAllModals} title={editingData ? t('editTeacher') : t('addTeacher')} size="lg" t={t}><TeacherForm subjects={subjects} levels={levels} onSave={handleSaveTeacher} onCancel={closeAllModals} t={t} initialData={editingData} /></Modal>}
            {modalContent === 'class' && <Modal isOpen={true} onClose={closeAllModals} title={editingData ? t('editClass') : t('addClass')} size="lg" t={t}><ClassForm subjects={subjects} levels={levels} teachers={teachers} allClasses={classes} onSave={handleSaveClass} onCancel={closeAllModals} t={t} initialData={editingData} workloadWarningThreshold={workloadWarningThreshold} /></Modal>}
            {editingLevel && <TimeSlotEditorModal isOpen={true} onClose={() => setEditingLevel(null)} onSave={handleUpdateTimeSlotsForLevel} level={editingLevel} t={t} />}
            {viewingArchive && <ArchivedScheduleViewer archive={viewingArchive} onClose={closeAllModals} onPrint={handlePrint} onExportHTML={handleExportHTML} onExportCSV={handleExportCSV} teachers={teachers} rooms={rooms} levels={levels} classes={classes} globalDaysOff={globalDaysOff} t={t} onEntryClick={handleOpenSubstituteFinder} droppableState={droppableState} />}
            {substituteFinderContext && <SubstituteFinderModal context={substituteFinderContext} candidates={availableSubstitutes} onSelect={handleSelectSubstitute} onClose={closeAllModals} t={t} />}
            
            <ToastNotification message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} />
        </div>
    );
}