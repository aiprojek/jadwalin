import React, { useState, useEffect } from 'react';
import { DndContext, useSensor, PointerSensor, useSensors } from '@dnd-kit/core';
import type { ArchivedSchedule, Teacher, Room, EducationLevel, Class, Day, TranslationKey, SubstituteFinderContext } from '../../types';
import { Modal } from '../common';
import { ScheduleViewControls, ScheduleHeader, ScheduleTable, MasterScheduleTable, TeacherScheduleTable, RoomScheduleTable } from './index';
import { DAYS_OF_WEEK } from '../../constants';

export const ArchivedScheduleViewer: React.FC<{
    archive: ArchivedSchedule;
    onClose: () => void;
    onPrint: (archive: ArchivedSchedule, viewContext: 'class' | 'teacher' | 'room', viewContextSubject: string, classViewMode: 'individual' | 'master', isCompact: boolean) => void;
    onExportHTML: (archive: ArchivedSchedule, viewContext: 'class' | 'teacher' | 'room', viewContextSubject: string, classViewMode: 'individual' | 'master', isCompact: boolean) => void;
    onExportCSV: (archive: ArchivedSchedule) => void;
    teachers: Teacher[];
    rooms: Room[];
    levels: EducationLevel[];
    classes: Class[];
    globalDaysOff: Day[];
    t: (key: TranslationKey, replacements?: Record<string, string>) => string;
    onEntryClick: (context: SubstituteFinderContext) => void;
    droppableState: any;
}> = ({ archive, onClose, onPrint, onExportHTML, onExportCSV, teachers, rooms, levels, classes, globalDaysOff, t, onEntryClick, droppableState }) => {
    const [viewContext, setViewContext] = useState<'class' | 'teacher' | 'room'>('class');
    const [classViewMode, setClassViewMode] = useState<'individual' | 'master'>('individual');
    const [selectedTeacher, setSelectedTeacher] = useState<string>(() => teachers.length > 0 ? teachers[0].name : '');
    const [selectedRoom, setSelectedRoom] = useState<string>(() => rooms.length > 0 ? rooms[0].name : '');
    const [isCompact, setIsCompact] = useState(false);
    
    useEffect(() => {
        if (viewContext === 'teacher' && teachers.length > 0 && !selectedTeacher) setSelectedTeacher(teachers[0].name);
        if (viewContext === 'room' && rooms.length > 0 && !selectedRoom) setSelectedRoom(rooms[0].name);
    }, [viewContext, teachers, rooms, selectedTeacher, selectedRoom]);
    
    const displayDays = DAYS_OF_WEEK.filter(day => !globalDaysOff.includes(day));

    return (
        <Modal isOpen={!!archive} onClose={onClose} title={`${t('viewSchedule')}: ${archive.levelName} (${t(archive.scheduleType as TranslationKey)})`} size="xl" t={t}>
             <DndContext sensors={useSensors(useSensor(PointerSensor))} onDragStart={() => {}} onDragOver={() => {}} onDragEnd={() => {}}>
                <div className="space-y-4">
                    <div className="p-3 bg-gray-100 dark:bg-gray-900/50 rounded-lg flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <button onClick={() => onPrint(archive, viewContext, viewContext === 'teacher' ? selectedTeacher : selectedRoom, classViewMode, isCompact)} className="flex items-center gap-1.5 text-sm bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 py-1.5 px-3 rounded-md"><i className="bi bi-printer-fill"></i>{t('print')}</button>
                            <button onClick={() => onExportHTML(archive, viewContext, viewContext === 'teacher' ? selectedTeacher : selectedRoom, classViewMode, isCompact)} className="flex items-center gap-1.5 text-sm bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-300 py-1.5 px-3 rounded-md"><i className="bi bi-file-earmark-code-fill"></i>{t('exportHTML')}</button>
                            <button onClick={() => onExportCSV(archive)} className="flex items-center gap-1.5 text-sm bg-teal-100 dark:bg-teal-800/50 text-teal-700 dark:text-teal-300 py-1.5 px-3 rounded-md"><i className="bi bi-file-earmark-spreadsheet-fill"></i>{t('exportCSV')}</button>
                        </div>
                    </div>

                    <ScheduleViewControls viewContext={viewContext} setViewContext={setViewContext} classViewMode={classViewMode} setClassViewMode={setClassViewMode} teacher={selectedTeacher} setTeacher={setSelectedTeacher} room={selectedRoom} setRoom={setSelectedRoom} isCompact={isCompact} onToggleCompact={() => setIsCompact(prev => !prev)} teachers={teachers} rooms={rooms} t={t} />

                    <div className="border-t dark:border-gray-700 pt-4">
                        <ScheduleHeader institutionInfo={archive.institutionInfo} academicYear={archive.academicYear} scheduleType={archive.scheduleType} selectedLevelName={archive.levelName} viewContext={viewContext} viewSubjectName={viewContext === 'teacher' ? selectedTeacher : selectedRoom} />
                         {viewContext === 'class' ? (
                            classViewMode === 'individual' ? (
                                <ScheduleTable schedule={archive.schedule} filter={{ type: '', value: '' }} t={t} accentColor={archive.accentColor} globalDaysOff={globalDaysOff} levels={levels} classes={classes} timeSlotsForLevel={() => archive.timeSlots} onEntryClick={onEntryClick} droppableState={droppableState} isCompactView={isCompact} />
                            ) : (
                                <MasterScheduleTable schedule={archive.schedule} t={t} accentColor={archive.accentColor} globalDaysOff={globalDaysOff} levels={levels} classes={classes} timeSlots={archive.timeSlots} onEntryClick={onEntryClick} droppableState={droppableState} isCompactView={isCompact} />
                            )
                        ) : viewContext === 'teacher' ? (
                            <TeacherScheduleTable schedule={archive.schedule} teacherName={selectedTeacher} timeSlots={archive.timeSlots} displayDays={displayDays} t={t} accentColor={archive.accentColor} onEntryClick={onEntryClick} droppableState={droppableState} isCompactView={isCompact} />
                        ) : (
                            <RoomScheduleTable schedule={archive.schedule} roomName={selectedRoom} timeSlots={archive.timeSlots} displayDays={displayDays} t={t} accentColor={archive.accentColor} onEntryClick={onEntryClick} droppableState={droppableState} isCompactView={isCompact} />
                        )}
                    </div>
                </div>
             </DndContext>
        </Modal>
    );
};