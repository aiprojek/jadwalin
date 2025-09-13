import type { Teacher, Subject, Room, Class, Schedule, GeminiError, Day, TimeSlot, EducationLevel } from '../types';
import { DAYS_OF_WEEK } from '../constants';

// Helper function to shuffle an array for introducing randomness in placement
const shuffleArray = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

interface Lesson {
    classInfo: Class;
    subjectId: string;
    teacherId: string;
    requiresRoom: boolean;
    consecutiveHours: number;
}

interface ScheduleState {
    schedule: Schedule;
    busyTeachers: Set<string>; // "day-timeSlot-teacherId"
    busyRooms: Set<string>;    // "day-timeSlot-roomId"
    busyClasses: Set<string>;  // "day-timeSlot-classId"
    teacherHoursByDay: { [teacherDayKey: string]: number }; // "teacherId-day": hours
}

export const generateLocalSchedule = async (
    teachers: Teacher[],
    subjects: Subject[],
    rooms: Room[],
    classes: Class[], // This now can contain classes from multiple levels
    scheduleType: 'Regular' | 'Exam',
    t: (key: any) => string,
    levels: EducationLevel[],
    globalDaysOff: Day[]
): Promise<Schedule | GeminiError> => {
    
    // Check if there are any rooms available *at all* for lessons that require one.
    const anyLessonNeedsRoom = classes.some(c => c.subjects.some(s => s.requiresRoom !== false));
    if (anyLessonNeedsRoom && rooms.length === 0) {
        return { conflicts: ["Tidak ada ruangan yang tersedia untuk pelajaran yang membutuhkan. Harap tambahkan setidaknya satu ruangan."] };
    }

    // --- Create a Pool of All Required Lessons based on Class Definitions ---
    let lessonPool: Lesson[] = [];
    if (scheduleType === 'Regular') {
        classes.forEach(classInfo => {
            classInfo.subjects.forEach(classSub => {
                if (classSub.teacherId) { 
                    const consecutive = classSub.consecutiveHours || 1;
                    if (classSub.hoursPerWeek % consecutive !== 0) {
                         // This is a data validation error, but we'll handle it gracefully
                         // For now, we just log it and proceed, but ideally, this is validated in the UI.
                         console.warn(`Class ${classInfo.name}, Subject ${classSub.subjectId}: hoursPerWeek is not a multiple of consecutiveHours.`);
                    }
                    const numberOfBlocks = Math.floor(classSub.hoursPerWeek / consecutive);
                    for (let i = 0; i < numberOfBlocks; i++) {
                        lessonPool.push({
                            classInfo,
                            subjectId: classSub.subjectId,
                            teacherId: classSub.teacherId,
                            requiresRoom: classSub.requiresRoom ?? true,
                            consecutiveHours: consecutive,
                        });
                    }
                }
            });
        });
    } else { // Exam schedule (assigns one teacher for the subject exam)
        classes.forEach(classInfo => {
            const subjectsForClass = shuffleArray([...classInfo.subjects]);
            const level = levels.find(l => l.id === classInfo.levelId);
            const effectiveDaysOff = (level?.daysOff && level.daysOff.length > 0) ? level.daysOff : globalDaysOff;
            const workingDays = DAYS_OF_WEEK.filter(day => !effectiveDaysOff.includes(day));
            
            for (let i = 0; i < workingDays.length && i < subjectsForClass.length; i++) {
                const subjectAssignment = subjectsForClass[i];
                 if (subjectAssignment.teacherId) {
                    lessonPool.push({
                        classInfo,
                        subjectId: subjectAssignment.subjectId,
                        teacherId: subjectAssignment.teacherId,
                        requiresRoom: subjectAssignment.requiresRoom ?? true,
                        consecutiveHours: 1, // Exams are single blocks
                    });
                }
            }
        });
    }

    // --- Smart Sorting: Prioritize more constrained lessons ---
    // Heuristic: lessons requiring longer consecutive blocks are more constrained.
    lessonPool.sort((a, b) => b.consecutiveHours - a.consecutiveHours);

    // --- Initialize State for Backtracking ---
    const state: ScheduleState = {
        schedule: {},
        busyTeachers: new Set(),
        busyRooms: new Set(),
        busyClasses: new Set(),
        teacherHoursByDay: {},
    };
    classes.forEach(c => state.schedule[c.name] = {});

    // --- Start the Recursive Backtracking Solver ---
    const result = solve(lessonPool, 0, state, teachers, subjects, rooms, scheduleType, t, levels, globalDaysOff);
    
    if (result === true) {
        return Promise.resolve(state.schedule);
    } else {
        // The solver returned an array of conflict strings
        return { conflicts: result };
    }
};

const solve = (
    lessonPool: Lesson[],
    lessonIndex: number,
    state: ScheduleState,
    teachers: Teacher[],
    subjects: Subject[],
    rooms: Room[],
    scheduleType: 'Regular' | 'Exam',
    t: (key: any) => string,
    levels: EducationLevel[],
    globalDaysOff: Day[]
): true | string[] => {
    // --- Base Case: All lessons have been placed ---
    if (lessonIndex >= lessonPool.length) {
        return true; 
    }

    const lesson = lessonPool[lessonIndex];
    const { classInfo, subjectId, teacherId, requiresRoom, consecutiveHours } = lesson;
    
    const subjectInfo = subjects.find(s => s.id === subjectId);
    const teacherInfo = teachers.find(t => t.id === teacherId);

    if (!subjectInfo || !teacherInfo) {
        // Skip lesson if data is incomplete, but this shouldn't happen with proper validation
        return solve(lessonPool, lessonIndex + 1, state, teachers, subjects, rooms, scheduleType, t, levels, globalDaysOff);
    }
    
    const level = levels.find(l => l.id === classInfo.levelId);
    if (!level) {
        // Skip lesson if its level doesn't exist
        return solve(lessonPool, lessonIndex + 1, state, teachers, subjects, rooms, scheduleType, t, levels, globalDaysOff);
    }

    const timeSlots = scheduleType === 'Regular' ? level.timeSlots.regular : level.timeSlots.exam;
    const periodSlots = timeSlots.filter(ts => ts.type === 'period');
    const periodSlotLabels = periodSlots.map(ts => ts.label);

    const effectiveDaysOff = (level.daysOff && level.daysOff.length > 0) ? level.daysOff : globalDaysOff;
    const workingDays = DAYS_OF_WEEK.filter(day => !effectiveDaysOff.includes(day));

    // --- Conflict Tracking for this specific lesson ---
    const conflicts = {
        teacherUnavailableDays: new Set<Day>(),
        teacherMaxHoursDays: new Set<Day>(),
        teacherBusySlots: new Set<string>(),
        classBusySlots: new Set<string>(),
        roomSearchAttempted: false,
    };

    for (const day of shuffleArray([...workingDays])) {
        // 1. Check Teacher Day Availability
        if (!teacherInfo.availableDays.includes(day)) {
            conflicts.teacherUnavailableDays.add(day);
            continue;
        }

        // 2. Check Teacher Max Hours Per Day
        const teacherDayKey = `${teacherInfo.id}-${day}`;
        const currentTeacherHours = state.teacherHoursByDay[teacherDayKey] || 0;
        if (teacherInfo.maxHoursPerDay && (currentTeacherHours + consecutiveHours > teacherInfo.maxHoursPerDay)) {
            conflicts.teacherMaxHoursDays.add(day);
            continue;
        }

        // --- Iterate through possible starting slots for the block ---
        for (let i = 0; i <= periodSlotLabels.length - consecutiveHours; i++) {
            const blockSlots = periodSlotLabels.slice(i, i + consecutiveHours);
            
            // 3. Check if the entire block is free for teacher and class
            let isBlockAvailable = true;
            for (const slot of blockSlots) {
                if (state.busyClasses.has(`${day}-${slot}-${classInfo.id}`)) {
                    conflicts.classBusySlots.add(`${day} ${slot}`);
                    isBlockAvailable = false;
                }
                if (state.busyTeachers.has(`${day}-${slot}-${teacherInfo.id}`)) {
                    conflicts.teacherBusySlots.add(`${day} ${slot}`);
                    isBlockAvailable = false;
                }
            }
            if (!isBlockAvailable) continue;

            // --- PLACEMENT LOGIC ---
            if (!requiresRoom) {
                const keysToCommit = { class: new Set<string>(), teacher: new Set<string>() };
                for (const slot of blockSlots) {
                    keysToCommit.class.add(`${day}-${slot}-${classInfo.id}`);
                    keysToCommit.teacher.add(`${day}-${slot}-${teacherInfo.id}`);
                }

                keysToCommit.class.forEach(k => state.busyClasses.add(k));
                keysToCommit.teacher.forEach(k => state.busyTeachers.add(k));
                state.teacherHoursByDay[teacherDayKey] = (state.teacherHoursByDay[teacherDayKey] || 0) + consecutiveHours;
                
                if (!state.schedule[classInfo.name][day]) state.schedule[classInfo.name][day] = {};
                for (const slot of blockSlots) {
                    state.schedule[classInfo.name][day]![slot] = {
                        subjectName: subjectInfo.name,
                        teacherName: teacherInfo.name,
                        roomName: t('noRoom'),
                    };
                }

                const result = solve(lessonPool, lessonIndex + 1, state, teachers, subjects, rooms, scheduleType, t, levels, globalDaysOff);
                if (result === true) return true;

                // Backtrack
                for (const slot of blockSlots) {
                    delete state.schedule[classInfo.name][day]![slot];
                }
                keysToCommit.class.forEach(k => state.busyClasses.delete(k));
                keysToCommit.teacher.forEach(k => state.busyTeachers.delete(k));
                state.teacherHoursByDay[teacherDayKey] -= consecutiveHours;

            } else {
                conflicts.roomSearchAttempted = true;
                const availableRooms = rooms.filter(r => {
                    const hasClassRestriction = r.classIds && r.classIds.length > 0;
                    const hasLevelRestriction = r.levelIds && r.levelIds.length > 0;
                    if (hasClassRestriction) return r.classIds.includes(classInfo.id);
                    if (hasLevelRestriction) return r.levelIds.includes(classInfo.levelId);
                    return true;
                });
                
                for (const room of shuffleArray(availableRooms)) {
                    let isRoomBlockAvailable = true;
                    for (const slot of blockSlots) {
                        if (state.busyRooms.has(`${day}-${slot}-${room.id}`)) {
                            isRoomBlockAvailable = false;
                            break;
                        }
                    }
                    if (!isRoomBlockAvailable) continue;
                    
                    const keysToCommit = { class: new Set<string>(), teacher: new Set<string>(), room: new Set<string>() };
                     for (const slot of blockSlots) {
                        keysToCommit.class.add(`${day}-${slot}-${classInfo.id}`);
                        keysToCommit.teacher.add(`${day}-${slot}-${teacherInfo.id}`);
                        keysToCommit.room.add(`${day}-${slot}-${room.id}`);
                    }

                    keysToCommit.class.forEach(k => state.busyClasses.add(k));
                    keysToCommit.teacher.forEach(k => state.busyTeachers.add(k));
                    keysToCommit.room.forEach(k => state.busyRooms.add(k));
                    state.teacherHoursByDay[teacherDayKey] = (state.teacherHoursByDay[teacherDayKey] || 0) + consecutiveHours;
                    
                    if (!state.schedule[classInfo.name][day]) state.schedule[classInfo.name][day] = {};
                     for (const slot of blockSlots) {
                        state.schedule[classInfo.name][day]![slot] = {
                            subjectName: subjectInfo.name,
                            teacherName: teacherInfo.name,
                            roomName: room.name,
                        };
                    }
                    
                    const result = solve(lessonPool, lessonIndex + 1, state, teachers, subjects, rooms, scheduleType, t, levels, globalDaysOff);
                    if (result === true) return true;

                    // --- Backtrack ---
                    for (const slot of blockSlots) {
                         delete state.schedule[classInfo.name][day]![slot];
                    }
                    keysToCommit.class.forEach(k => state.busyClasses.delete(k));
                    keysToCommit.teacher.forEach(k => state.busyTeachers.delete(k));
                    keysToCommit.room.forEach(k => state.busyRooms.delete(k));
                    state.teacherHoursByDay[teacherDayKey] -= consecutiveHours;
                }
            }
        }
    }

    // --- Format Conflict Report ---
    // If all loops complete without returning true, this lesson couldn't be placed.
    const errorMessages: string[] = [];
    errorMessages.push(`Gagal menempatkan pelajaran "${subjectInfo.name}" untuk ${classInfo.name} (Guru: ${teacherInfo.name}).`);

    if (conflicts.teacherUnavailableDays.size > 0) {
        errorMessages.push(`- Guru tidak tersedia pada hari: ${[...conflicts.teacherUnavailableDays].map(d => t(d)).join(', ')}.`);
    }
    if (conflicts.teacherMaxHoursDays.size > 0) {
        errorMessages.push(`- Guru telah mencapai batas jam mengajar harian pada hari: ${[...conflicts.teacherMaxHoursDays].map(d => t(d)).join(', ')}.`);
    }
    if (conflicts.teacherBusySlots.size > 0 || conflicts.classBusySlots.size > 0) {
        errorMessages.push("- Terjadi tabrakan jadwal dengan pelajaran lain (baik untuk guru maupun kelas).");
    }
    
    const relevantRooms = rooms.filter(r => {
        const hasClassRestriction = r.classIds && r.classIds.length > 0;
        const hasLevelRestriction = r.levelIds && r.levelIds.length > 0;
        if (hasClassRestriction) return r.classIds.includes(classInfo.id);
        if (hasLevelRestriction) return r.levelIds.includes(classInfo.levelId);
        return true;
    });
    if (requiresRoom && relevantRooms.length === 0) {
        errorMessages.push(`- Tidak ada ruangan yang cocok yang terkonfigurasi untuk kelas ${classInfo.name}.`);
    } else if (conflicts.roomSearchAttempted) {
        errorMessages.push("- Semua ruangan yang cocok mungkin sudah terisi pada slot waktu yang tersedia.");
    }

    if (errorMessages.length === 1) { // Only the initial message was added
        errorMessages.push("- Tidak ditemukan slot yang valid karena kombinasi dari semua batasan. Coba periksa kembali data Anda.");
    }

    return errorMessages;
};
