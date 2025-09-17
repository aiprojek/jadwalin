import React, { useMemo } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { Schedule, Day, Class, EducationLevel, ArchivedSchedule, TimeSlot, TranslationKey, DragData, SubstituteFinderContext, Teacher, Room } from '../../types';
import { DAYS_OF_WEEK } from '../../constants';
import { getInitials } from '../../utils';
import { Tooltip } from '../common';

export const ScheduleHeader: React.FC<{
    institutionInfo: ArchivedSchedule['institutionInfo'];
    academicYear: { masehi: string; hijri: string; };
    scheduleType: 'Regular' | 'Exam';
    selectedLevelName: string;
    viewContext?: 'class' | 'teacher' | 'room';
    viewSubjectName?: string;
}> = ({ institutionInfo, academicYear, scheduleType, selectedLevelName, viewContext, viewSubjectName }) => {
    
    const renderHeaderContent = () => {
        if (Array.isArray(institutionInfo)) {
            const itemsToShow = institutionInfo.filter(item => item.showInHeader && item.value);
            if (itemsToShow.length === 0) return null;
            return itemsToShow.map((item, index) => {
                let styleClass = "text-sm text-gray-600 dark:text-gray-400";
                if (index === 0) styleClass = "text-2xl font-bold uppercase text-gray-900 dark:text-gray-100";
                else if (index === 1) styleClass = "text-lg font-bold uppercase text-gray-800 dark:text-gray-200";
                return <p key={item.id || index} className={styleClass}>{item.value}</p>;
            });
        }
        const oldInfo = institutionInfo as { foundation?: string; institution?: string; address?: string; };
        return (<>{oldInfo.foundation && <h2 className="text-lg font-bold uppercase text-gray-800 dark:text-gray-200">{oldInfo.foundation}</h2>}{oldInfo.institution && <h1 className="text-2xl font-bold uppercase text-gray-900 dark:text-gray-100">{oldInfo.institution}</h1>}{oldInfo.address && <p className="text-sm text-gray-600 dark:text-gray-400">{oldInfo.address}</p>}</>);
    };
    
    const titleContext = useMemo(() => {
        if (viewContext === 'teacher' || viewContext === 'room') return `${viewContext === 'teacher' ? 'GURU' : 'RUANGAN'}: ${viewSubjectName}`;
        return selectedLevelName.toUpperCase();
    }, [viewContext, viewSubjectName, selectedLevelName]);

    return (
        <div className="mb-6 text-center border-b-2 border-black dark:border-gray-400 pb-4">
            {renderHeaderContent()}
            <p className="text-md font-semibold mt-4 text-gray-800 dark:text-gray-200">JADWAL PELAJARAN {scheduleType === 'Regular' ? 'REGULER' : 'UJIAN'} - {titleContext}</p>
            {(academicYear.masehi || academicYear.hijri) && <p className="text-sm text-gray-600 dark:text-gray-400">Tahun Ajaran: {academicYear.masehi}{academicYear.masehi && academicYear.hijri ? ' - ' : ''}{academicYear.hijri}</p>}
        </div>
    );
};

const DraggableEntry: React.FC<{ id: string; data: DragData; children: React.ReactNode; }> = ({ id, data, children }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id, data });
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 100, cursor: 'grabbing' } : undefined;
    return <div ref={setNodeRef} style={style} {...listeners} {...attributes}>{children}</div>;
};

const DroppableCell: React.FC<{
    id: string;
    data: { className: string; day: Day; timeSlot: string; };
    children: React.ReactNode;
    isValidDrop: boolean;
    isInvalidDrop: boolean;
    conflictMessage?: string;
}> = ({ id, data, children, isValidDrop, isInvalidDrop, conflictMessage }) => {
    const { setNodeRef } = useDroppable({ id, data });
    const base = "p-2 border border-gray-200 dark:border-gray-700 transition-colors duration-200 h-full";
    const state = isValidDrop ? 'bg-green-200 dark:bg-green-800/50' : isInvalidDrop ? 'bg-red-200 dark:bg-red-800/50' : '';
    const cell = <div ref={setNodeRef} className={`${base} ${state}`}>{children}</div>;
    return isInvalidDrop && conflictMessage ? <Tooltip text={conflictMessage}>{cell}</Tooltip> : cell;
};

export const ScheduleTable: React.FC<{ schedule: Schedule; filter: { type: string; value: string }; t: (key: TranslationKey, rs?: Record<string, string>) => string; accentColor?: string; globalDaysOff: Day[]; levels: EducationLevel[]; classes: Class[]; timeSlotsForLevel?: (levelId: string) => TimeSlot[]; onEntryClick: (ctx: SubstituteFinderContext) => void; droppableState: any; isCompactView: boolean; }> = ({ schedule, filter, t, accentColor = '#3b82f6', globalDaysOff, levels, classes, timeSlotsForLevel, onEntryClick, droppableState, isCompactView }) => {
    const getClassLevel = (className: string) => classes.find(c => c.name === className)?.levelId ? levels.find(l => l.id === classes.find(c => c.name === className)!.levelId) : null;
    const getEffectiveDaysOff = (className: string) => (getClassLevel(className)?.daysOff?.length ?? 0) > 0 ? getClassLevel(className)!.daysOff! : globalDaysOff;
    
    const filteredSchedule = useMemo(() => {
        if (!filter.value) return schedule;
        const newSchedule: Schedule = {};
        if (filter.type === 'class') {
            if (schedule[filter.value]) newSchedule[filter.value] = schedule[filter.value];
            return newSchedule;
        }
        for (const className in schedule) {
            newSchedule[className] = {};
            for (const day of DAYS_OF_WEEK) {
                newSchedule[className][day] = {};
                if (schedule[className][day]) for (const timeSlot in schedule[className][day]) {
                    const entry = schedule[className][day]![timeSlot];
                    if ((filter.type === 'teacher' && entry.teacherName === filter.value) || (filter.type === 'room' && entry.roomName === filter.value)) {
                        newSchedule[className][day]![timeSlot] = entry;
                    }
                }
            }
        }
        return newSchedule;
    }, [schedule, filter]);

    const classNames = Object.keys(filteredSchedule).sort((a, b) => (getClassLevel(a)?.name || '').localeCompare(getClassLevel(b)?.name || '') || a.localeCompare(b));

    if (classNames.length === 0) return <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow text-gray-500 dark:text-gray-400">{t('noSchedule')}</div>;

    return (
        <div className="space-y-8" style={{ '--accent-color': accentColor } as React.CSSProperties}>
            {classNames.map(className => {
                const classLevel = getClassLevel(className);
                const timeSlots = timeSlotsForLevel && classLevel ? timeSlotsForLevel(classLevel.id) : [];
                const displayDays = DAYS_OF_WEEK.filter(day => !getEffectiveDaysOff(className).includes(day));
                if (timeSlots.length === 0) return null;

                return (
                    <div key={className} id={`schedule-${className.replace(/\s+/g, '-')}`} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow print:shadow-none print:p-2">
                        <h3 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-300">{className} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({classLevel?.name})</span></h3>
                        <div className="overflow-x-auto"><table className={`w-full min-w-[600px] border-collapse text-center schedule-table-focusable ${isCompactView ? 'compact-view' : ''}`}>
                            <thead><tr><th className="p-2 border-b-2 text-white dark:text-gray-900 border-gray-200 dark:border-gray-600 text-sm font-semibold" style={{ backgroundColor: 'var(--accent-color)' }}>{t('time')}</th>{displayDays.map(day => <th key={day} className="p-2 border-b-2 text-white dark:text-gray-900 border-gray-200 dark:border-gray-600 text-sm font-semibold" style={{ backgroundColor: 'var(--accent-color)' }}>{t(day as TranslationKey)}</th>)}</tr></thead>
                            <tbody>
                                {timeSlots.map(slot => slot.type === 'break' ? (<tr key={slot.id} className="bg-gray-100 dark:bg-gray-700/50"><td className="p-2 border-b border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400">{slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}`: ''}</td><td colSpan={displayDays.length} className="p-2 border border-gray-200 dark:border-gray-700 text-center font-semibold text-sm text-gray-700 dark:text-gray-300">{slot.label}</td></tr>) : (
                                    <tr key={slot.id} className="odd:bg-gray-50 dark:odd:bg-gray-800/50">
                                        <td className="p-2 border-b border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400">{slot.label}</td>
                                        {displayDays.map(day => {
                                            const entry = filteredSchedule[className]?.[day]?.[slot.label];
                                            const droppableId = `${className}-${day}-${slot.label}`;
                                            return (<td key={day} className="p-0"><DroppableCell id={droppableId} data={{ className, day, timeSlot: slot.label }} isValidDrop={droppableState.overId === droppableId && droppableState.isValid} isInvalidDrop={droppableState.overId === droppableId && !droppableState.isValid} conflictMessage={droppableState.overId === droppableId ? droppableState.conflictMessage : undefined}>{entry ? <DraggableEntry id={droppableId} data={{ from: { className, day, timeSlot: slot.label }, entry }}><div className="schedule-entry-item text-xs sm:text-sm p-1 rounded-md cursor-pointer" onClick={() => onEntryClick({ day, timeSlot: slot.label, className, entry })} role="button" tabIndex={0}>{isCompactView ? <><p className="font-bold text-gray-800 dark:text-gray-100">{entry.subjectName}</p><p className="text-gray-600 dark:text-gray-300">{getInitials(entry.teacherName)}</p></> : <><p className="font-bold text-gray-800 dark:text-gray-100">{entry.subjectName}</p><p className="text-gray-600 dark:text-gray-300">{entry.teacherName}</p><p className="text-blue-500 dark:text-blue-400 text-xs">@{entry.roomName}</p></>}</div></DraggableEntry> : <div className="min-h-[60px] flex items-center justify-center"><span className="text-gray-300 dark:text-gray-600">-</span></div>}</DroppableCell></td>);
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table></div>
                    </div>
                )
            })}
        </div>
    );
};


export const MasterScheduleTable: React.FC<{ schedule: Schedule; t: (key: TranslationKey, rs?: Record<string, string>) => string; accentColor?: string; globalDaysOff: Day[]; levels: EducationLevel[]; classes: Class[]; timeSlots: TimeSlot[]; onEntryClick: (ctx: SubstituteFinderContext) => void; droppableState: any; isCompactView: boolean; }> = ({ schedule, t, accentColor = '#3b82f6', globalDaysOff, levels, classes, timeSlots, onEntryClick, droppableState, isCompactView }) => {
    const getClassLevel = (cn: string) => levels.find(l => l.id === classes.find(c => c.name === cn)?.levelId);
    const getEffectiveDaysOffForAll = () => { const levelIds = new Set(Object.keys(schedule).map(cn => getClassLevel(cn)?.id).filter(Boolean)); if (levelIds.size === 1) { const level = levels.find(l => l.id === Array.from(levelIds)[0]); if (level?.daysOff?.length) return level.daysOff; } return globalDaysOff; };
    const classNames = Object.keys(schedule).sort((a, b) => (getClassLevel(a)?.name || '').localeCompare(getClassLevel(b)?.name || '') || a.localeCompare(b));
    if (classNames.length === 0) return <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow text-gray-500 dark:text-gray-400">{t('noSchedule')}</div>;
    const displayDays = DAYS_OF_WEEK.filter(day => !getEffectiveDaysOffForAll().includes(day));

    return (
        <div id="master-schedule-view" className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow print:shadow-none print:p-2 overflow-x-auto" style={{ '--accent-color': accentColor } as React.CSSProperties}>
            <table className={`w-full min-w-max border-collapse text-center schedule-table-focusable ${isCompactView ? 'compact-view' : ''}`}>
                <thead><tr><th className="p-2 border-b-2 text-white dark:text-gray-900 border-gray-200 dark:border-gray-600 text-sm font-semibold sticky left-0 z-10 bg-inherit" style={{ backgroundColor: 'var(--accent-color)' }}>{t('time')}</th>{classNames.map(cn => <th key={cn} className="p-2 border-b-2 text-white dark:text-gray-900 border-gray-200 dark:border-gray-600 text-sm font-semibold" style={{ backgroundColor: 'var(--accent-color)' }}>{cn}<div className="font-normal text-xs opacity-80">({getClassLevel(cn)?.name})</div></th>)}</tr></thead>
                <tbody>
                    {displayDays.map(day => (<React.Fragment key={day}><tr><td colSpan={classNames.length + 1} className="p-1.5 font-bold text-base bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 sticky left-0 z-10">{t(day as TranslationKey)}</td></tr>
                        {timeSlots.map(slot => slot.type === 'break' ? <tr key={`${day}-${slot.id}`} className="bg-gray-100 dark:bg-gray-700/50"><td className="p-2 border-b border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400 sticky left-0 z-10 bg-gray-100 dark:bg-gray-700/50">{slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}`: ''}</td><td colSpan={classNames.length} className="p-2 border border-gray-200 dark:border-gray-700 text-center font-semibold text-sm text-gray-700 dark:text-gray-300">{slot.label}</td></tr> : (
                            <tr key={`${day}-${slot.id}`} className="odd:bg-gray-50 dark:odd:bg-gray-800/50">
                                <td className="p-2 border-b border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400 sticky left-0 z-10 bg-white dark:bg-gray-800 odd:bg-gray-50 dark:odd:bg-gray-800/50">{slot.label}</td>
                                {classNames.map(cn => {
                                    const entry = schedule[cn]?.[day]?.[slot.label];
                                    const droppableId = `${cn}-${day}-${slot.label}`;
                                    return <td key={`${day}-${slot.id}-${cn}`} className="p-0"><DroppableCell id={droppableId} data={{ className: cn, day, timeSlot: slot.label }} isValidDrop={droppableState.overId === droppableId && droppableState.isValid} isInvalidDrop={droppableState.overId === droppableId && !droppableState.isValid} conflictMessage={droppableState.overId === droppableId ? droppableState.conflictMessage : undefined}>{entry ? <DraggableEntry id={droppableId} data={{ from: { className: cn, day, timeSlot: slot.label }, entry }}><div className="schedule-entry-item text-xs sm:text-sm p-1 rounded-md cursor-pointer" onClick={() => onEntryClick({ day, timeSlot: slot.label, className: cn, entry })} role="button" tabIndex={0}>{isCompactView ? <><p className="font-bold text-gray-800 dark:text-gray-100">{entry.subjectName}</p><p className="text-gray-600 dark:text-gray-300 text-xs">{getInitials(entry.teacherName)}</p></> : <><p className="font-bold text-gray-800 dark:text-gray-100">{entry.subjectName}</p><p className="text-gray-600 dark:text-gray-300 text-xs">{entry.teacherName}</p></>}</div></DraggableEntry> : <div className="min-h-[52px] flex items-center justify-center"><span className="text-gray-300 dark:text-gray-600">-</span></div>}</DroppableCell></td>;
                                })}
                            </tr>
                        ))}
                    </React.Fragment>))}
                </tbody>
            </table>
        </div>
    );
};

export const TeacherScheduleTable: React.FC<{ schedule: Schedule; teacherName: string; timeSlots: TimeSlot[]; displayDays: Day[]; t: (key: TranslationKey) => string; accentColor?: string; onEntryClick: (ctx: SubstituteFinderContext) => void; droppableState: any; isCompactView: boolean; }> = ({ schedule, teacherName, timeSlots, displayDays, t, accentColor = '#3b82f6', onEntryClick, droppableState, isCompactView }) => {
    const teacherSchedule = useMemo(() => { const p: { [key: string]: { [key: string]: any } } = {}; for (const cn in schedule) for (const day in schedule[cn]) { const d = day as Day; for (const ts in schedule[cn][d]) { const e = schedule[cn][d]![ts]; if (e.teacherName === teacherName) { if (!p[d]) p[d] = {}; p[d]![ts] = { ...e, className: cn }; }}} return p; }, [schedule, teacherName]);
    if (!teacherName) return <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow text-gray-500 dark:text-gray-400">{t('selectTeacher')}</div>;
    return (
        <div id="teacher-schedule-view" className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow print:shadow-none print:p-2" style={{ '--accent-color': accentColor } as React.CSSProperties}>
            <h3 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-300">{t('teacher')}: {teacherName}</h3>
            <div className="overflow-x-auto"><table className={`w-full min-w-[600px] border-collapse text-center schedule-table-focusable ${isCompactView ? 'compact-view' : ''}`}>
                <thead><tr><th className="p-2 border-b-2 text-white dark:text-gray-900 border-gray-200 dark:border-gray-600 text-sm font-semibold" style={{ backgroundColor: 'var(--accent-color)' }}>{t('time')}</th>{displayDays.map(day => <th key={day} className="p-2 border-b-2 text-white dark:text-gray-900 border-gray-200 dark:border-gray-600 text-sm font-semibold" style={{ backgroundColor: 'var(--accent-color)' }}>{t(day as TranslationKey)}</th>)}</tr></thead>
                <tbody>
                    {timeSlots.map(slot => slot.type === 'break' ? <tr key={slot.id} className="bg-gray-100 dark:bg-gray-700/50"><td className="p-2 border-b border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400">{slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}`: ''}</td><td colSpan={displayDays.length} className="p-2 border border-gray-200 dark:border-gray-700 text-center font-semibold text-sm text-gray-700 dark:text-gray-300">{slot.label}</td></tr> : (
                        <tr key={slot.id} className="odd:bg-gray-50 dark:odd:bg-gray-800/50">
                            <td className="p-2 border-b border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400">{slot.label}</td>
                            {displayDays.map(day => { const entry = teacherSchedule[day]?.[slot.label]; return (<td key={day} className="p-2 border border-gray-200 dark:border-gray-700">{entry ? <div className="schedule-entry-item text-xs sm:text-sm p-1 rounded-md cursor-pointer" onClick={() => onEntryClick({ day, timeSlot: slot.label, className: entry.className, entry: { ...entry, teacherName } })} role="button" tabIndex={0}><p className="font-bold text-gray-800 dark:text-gray-100">{entry.subjectName}</p><p className="text-gray-600 dark:text-gray-300">{entry.className}</p>{!isCompactView && <p className="text-blue-500 dark:text-blue-400 text-xs">@{entry.roomName}</p>}</div> : <span className="text-gray-300 dark:text-gray-600">-</span>}</td>)})}
                        </tr>
                    ))}
                </tbody>
            </table></div>
        </div>
    );
};

export const RoomScheduleTable: React.FC<{ schedule: Schedule; roomName: string; timeSlots: TimeSlot[]; displayDays: Day[]; t: (key: TranslationKey) => string; accentColor?: string; onEntryClick: (ctx: SubstituteFinderContext) => void; droppableState: any; isCompactView: boolean; }> = ({ schedule, roomName, timeSlots, displayDays, t, accentColor = '#3b82f6', onEntryClick, droppableState, isCompactView }) => {
    const roomSchedule = useMemo(() => { const p: { [key: string]: { [key: string]: any } } = {}; for (const cn in schedule) for (const day in schedule[cn]) { const d = day as Day; for (const ts in schedule[cn][d]) { const e = schedule[cn][d]![ts]; if (e.roomName === roomName) { if (!p[d]) p[d] = {}; p[d]![ts] = { ...e, className: cn }; }}} return p; }, [schedule, roomName]);
    if (!roomName) return <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow text-gray-500 dark:text-gray-400">{t('selectRoom')}</div>;
    return (
        <div id="room-schedule-view" className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow print:shadow-none print:p-2" style={{ '--accent-color': accentColor } as React.CSSProperties}>
            <h3 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-300">{t('room')}: {roomName}</h3>
            <div className="overflow-x-auto"><table className={`w-full min-w-[600px] border-collapse text-center schedule-table-focusable ${isCompactView ? 'compact-view' : ''}`}>
                <thead><tr><th className="p-2 border-b-2 text-white dark:text-gray-900 border-gray-200 dark:border-gray-600 text-sm font-semibold" style={{ backgroundColor: 'var(--accent-color)' }}>{t('time')}</th>{displayDays.map(day => <th key={day} className="p-2 border-b-2 text-white dark:text-gray-900 border-gray-200 dark:border-gray-600 text-sm font-semibold" style={{ backgroundColor: 'var(--accent-color)' }}>{t(day as TranslationKey)}</th>)}</tr></thead>
                <tbody>
                    {timeSlots.map(slot => slot.type === 'break' ? <tr key={slot.id} className="bg-gray-100 dark:bg-gray-700/50"><td className="p-2 border-b border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400">{slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}`: ''}</td><td colSpan={displayDays.length} className="p-2 border border-gray-200 dark:border-gray-700 text-center font-semibold text-sm text-gray-700 dark:text-gray-300">{slot.label}</td></tr> : (
                        <tr key={slot.id} className="odd:bg-gray-50 dark:odd:bg-gray-800/50">
                            <td className="p-2 border-b border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400">{slot.label}</td>
                            {displayDays.map(day => { const entry = roomSchedule[day]?.[slot.label]; return (<td key={day} className="p-2 border border-gray-200 dark:border-gray-700">{entry ? <div className="schedule-entry-item text-xs sm:text-sm p-1 rounded-md cursor-pointer" onClick={() => onEntryClick({ day, timeSlot: slot.label, className: entry.className, entry: { ...entry, roomName } })} role="button" tabIndex={0}><p className="font-bold text-gray-800 dark:text-gray-100">{entry.subjectName}</p><p className="text-gray-600 dark:text-gray-300">{entry.className}</p><p className="text-green-500 dark:text-green-400 text-xs">{isCompactView ? getInitials(entry.teacherName) : entry.teacherName}</p></div> : <span className="text-gray-300 dark:text-gray-600">-</span>}</td>)})}
                        </tr>
                    ))}
                </tbody>
            </table></div>
        </div>
    );
};

export const ScheduleViewControls: React.FC<{
    viewContext: 'class' | 'teacher' | 'room', setViewContext: (v: 'class' | 'teacher' | 'room') => void,
    classViewMode: 'individual' | 'master', setClassViewMode: (v: 'individual' | 'master') => void,
    teacher: string, setTeacher: (v: string) => void,
    room: string, setRoom: (v: string) => void,
    isCompact: boolean, onToggleCompact: () => void,
    teachers: Teacher[],
    rooms: Room[],
    t: (key: TranslationKey, replacements?: Record<string, string>) => string;
}> = ({ viewContext, setViewContext, classViewMode, setClassViewMode, teacher, setTeacher, room, setRoom, isCompact, onToggleCompact, teachers, rooms, t }) => (
    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 mb-4">
        <div className="flex rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
            {(['class', 'teacher', 'room'] as const).map(vc => (
                <button key={vc} onClick={() => setViewContext(vc)} className={`px-3 py-1 text-sm rounded-md transition-all flex items-center gap-1.5 ${viewContext === vc ? 'bg-white dark:bg-gray-800 shadow font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>
                    {vc === 'class' && <i className="bi bi-grid-3x3-gap-fill"></i>}{vc === 'teacher' && <i className="bi bi-person-fill"></i>}{vc === 'room' && <i className="bi bi-door-closed-fill"></i>}
                    {t(`${vc}View` as TranslationKey)}
                </button>
            ))}
        </div>
        {viewContext === 'class' && (
            <div className="flex rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
                <button onClick={() => setClassViewMode('individual')} className={`px-3 py-1 text-sm rounded-md transition-all ${classViewMode === 'individual' ? 'bg-white dark:bg-gray-800 shadow font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>{t('viewByClass')}</button>
                <button onClick={() => setClassViewMode('master')} className={`px-3 py-1 text-sm rounded-md transition-all ${classViewMode === 'master' ? 'bg-white dark:bg-gray-800 shadow font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>{t('masterTableView')}</button>
            </div>
        )}
        {viewContext === 'teacher' && <select value={teacher} onChange={e => setTeacher(e.target.value)} className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-sm px-3 py-2"><option value="">{t('selectTeacher')}</option>{teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select>}
        {viewContext === 'room' && <select value={room} onChange={e => setRoom(e.target.value)} className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-sm px-3 py-2"><option value="">{t('selectRoom')}</option>{rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}</select>}
        <Tooltip text={t('compactViewTooltip')}>
            <button onClick={onToggleCompact} className={`px-3 py-1 text-sm rounded-md transition-all flex items-center gap-1.5 ${isCompact ? 'bg-white dark:bg-gray-800 shadow font-semibold text-blue-600 dark:text-blue-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                <i className={`bi ${isCompact ? 'bi-arrows-angle-expand' : 'bi-arrows-angle-contract'}`}></i>{t('compactView')}
            </button>
        </Tooltip>
    </div>
);