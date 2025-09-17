
import React, { useRef, useEffect, useMemo } from 'react';
import type { Teacher, Subject, Room, Class, EducationLevel, ArchivedSchedule, Day, TranslationKey } from '../../types';
import { DAYS_OF_WEEK } from '../../constants';
import { Tooltip } from '../common';

declare var Chart: any;

const ChartComponent: React.FC<{
    chartId: string;
    type: 'bar' | 'doughnut' | 'line';
    title: string;
    data: any;
    options: any;
}> = ({ chartId, type, title, data, options }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (chartRef.current) {
            if (chartInstance.current) chartInstance.current.destroy();
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new Chart(ctx, { type, data, options });
            }
        }
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
                chartInstance.current = null;
            }
        };
    }, [type, data, options]);

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{title}</h3>
            <div className="relative h-64 sm:h-80"><canvas id={chartId} ref={chartRef}></canvas></div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center space-x-4">
        <div className="bg-blue-100 dark:bg-blue-800/50 p-3 rounded-full flex items-center justify-center w-12 h-12">{icon}</div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

const ScheduleHeatmap: React.FC<{
    levels: EducationLevel[],
    classes: Class[],
    archives: ArchivedSchedule[],
    globalDaysOff: Day[],
    t: (key: TranslationKey, replacements?: Record<string, string>) => string,
    theme: 'light' | 'dark',
}> = ({ levels, classes, archives, globalDaysOff, t, theme }) => {
    const heatmapData = useMemo(() => {
        const latestSchedule = archives.find(a => a.scheduleType === 'Regular')?.schedule;
        if (!latestSchedule) return { days: [], slots: [], density: {}, maxDensity: 0 };

        const allSlots = new Set<string>();
        levels.forEach(l => l.timeSlots.regular.filter(s => s.type === 'period').forEach(s => allSlots.add(s.label)));
        const sortedSlots = Array.from(allSlots).sort((a, b) => a.localeCompare(b));
        
        const density: { [day: string]: { [slot: string]: number } } = {};
        const activeDays = new Set<Day>();
        let maxDensity = 0;

        for (const className in latestSchedule) {
            const classInfo = classes.find(c => c.name === className);
            const levelInfo = levels.find(l => l.id === classInfo?.levelId);
            const effectiveDaysOff = (levelInfo?.daysOff?.length ?? 0) > 0 ? levelInfo!.daysOff! : globalDaysOff;

            for (const day of DAYS_OF_WEEK) {
                if (!effectiveDaysOff.includes(day) && latestSchedule[className][day]) {
                    activeDays.add(day);
                    for (const slot of sortedSlots) {
                         if (latestSchedule[className][day]![slot]) {
                            if (!density[day]) density[day] = {};
                            if (!density[day][slot]) density[day][slot] = 0;
                            density[day][slot]++;
                            if(density[day][slot] > maxDensity) maxDensity = density[day][slot];
                        }
                    }
                }
            }
        }
        
        const sortedDays = DAYS_OF_WEEK.filter(d => activeDays.has(d));
        return { days: sortedDays, slots: sortedSlots, density, maxDensity };
    }, [archives, levels, classes, globalDaysOff]);

    const getColorForDensity = (value: number, max: number) => {
        if (!value) return theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50';
        const p = Math.min(value / (max > 0 ? max : 1), 1);
        if (p < 0.2) return 'bg-blue-200 dark:bg-blue-900';
        if (p < 0.4) return 'bg-blue-300 dark:bg-blue-800';
        if (p < 0.6) return 'bg-blue-400 dark:bg-blue-700';
        if (p < 0.8) return 'bg-blue-500 dark:bg-blue-600';
        return 'bg-blue-600 dark:bg-blue-500';
    };

    if (heatmapData.days.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('scheduleDensityHeatmap')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('noSchedule')}</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('scheduleDensityHeatmap')}</h3>
            <div className="overflow-x-auto">
                <table className="w-full min-w-max border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 border dark:border-gray-700 text-xs font-semibold">{t('time')}</th>
                            {heatmapData.days.map(day => <th key={day} className="p-2 border dark:border-gray-700 text-xs font-semibold">{t(day)}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {heatmapData.slots.map(slot => (
                            <tr key={slot}>
                                <td className="p-2 border dark:border-gray-700 text-xs font-mono text-center">{slot}</td>
                                {heatmapData.days.map(day => {
                                    const count = heatmapData.density[day]?.[slot] || 0;
                                    return (
                                        <td key={`${day}-${slot}`} className={`p-0 border dark:border-gray-700`}>
                                            <Tooltip text={`${count} ${t('concurrentClasses')}`}>
                                                <div className={`w-full h-full p-2 text-center text-xs font-bold ${getColorForDensity(count, heatmapData.maxDensity)} ${count > 0 ? 'text-white' : ''}`}>
                                                    {count > 0 ? count : '-'}
                                                </div>
                                            </Tooltip>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const Dashboard: React.FC<{
    teachers: Teacher[];
    subjects: Subject[];
    rooms: Room[];
    classes: Class[];
    levels: EducationLevel[];
    archives: ArchivedSchedule[];
    globalDaysOff: Day[];
    t: (key: TranslationKey, replacements?: Record<string, string>) => string;
    theme: 'light' | 'dark';
}> = ({ teachers, subjects, rooms, classes, levels, archives, globalDaysOff, t, theme }) => {
    
    const teacherWorkloadData = useMemo(() => {
        const workload: { [key: string]: number } = {};
        classes.forEach(cls => cls.subjects.forEach(sub => {
            const teacher = teachers.find(t => t.id === sub.teacherId);
            if (teacher) workload[teacher.name] = (workload[teacher.name] || 0) + sub.hoursPerWeek;
        }));
        const sorted = Object.entries(workload).sort(([, a], [, b]) => b - a).slice(0, 15);
        return {
            labels: sorted.map(e => e[0]),
            datasets: [{ label: t('hoursPerWeek'), data: sorted.map(e => e[1]), backgroundColor: 'rgba(59, 130, 246, 0.5)', borderColor: 'rgba(59, 130, 246, 1)', borderWidth: 1 }]
        };
    }, [teachers, classes, t]);

    const subjectsPerLevelData = useMemo(() => {
        const counts: { [key: string]: number } = {};
        subjects.forEach(sub => {
            const level = levels.find(l => l.id === sub.levelId);
            if (level) counts[level.name] = (counts[level.name] || 0) + 1;
        });
        return {
            labels: Object.keys(counts),
            datasets: [{ label: t('totalSubjects'), data: Object.values(counts), backgroundColor: ['rgba(236, 72, 153, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(16, 185, 129, 0.6)', 'rgba(139, 92, 246, 0.6)', 'rgba(249, 115, 22, 0.6)'], borderColor: ['#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#f97316'], borderWidth: 1 }]
        };
    }, [subjects, levels, t]);

    const roomUtilizationData = useMemo(() => {
        const utilization: { [roomName: string]: number } = {};
        const latestSchedule = archives.find(a => a.scheduleType === 'Regular')?.schedule;
        if (latestSchedule) {
            for (const c in latestSchedule) for (const d in latestSchedule[c]) for (const ts in latestSchedule[c][d as Day]) {
                const entry = latestSchedule[c][d as Day]![ts];
                if (entry.roomName !== t('noRoom')) utilization[entry.roomName] = (utilization[entry.roomName] || 0) + 1;
            }
        }
        const sorted = Object.entries(utilization).sort(([, a], [, b]) => b - a);
        return {
            labels: sorted.map(e => e[0]),
            datasets: [{ label: t('hoursUsedPerWeek'), data: sorted.map(e => e[1]), backgroundColor: 'rgba(236, 72, 153, 0.5)', borderColor: 'rgba(236, 72, 153, 1)', borderWidth: 1 }]
        };
    }, [archives, t]);

    const chartOptions = useMemo(() => {
        const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = theme === 'dark' ? '#E5E7EB' : '#374151';
        const barOpts = (indexAxis: 'x' | 'y' = 'x') => ({ indexAxis, responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } }, y: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: indexAxis === 'x', color: gridColor } } } });
        return { bar: barOpts('y'), doughnut: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const, labels: { color: textColor, font: { size: 10 } } } } }, verticalBar: barOpts('x') };
    }, [theme]);

    return (
    <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">{t('dashboard')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatCard title={t('totalLevels')} value={levels.length} icon={<i className="bi bi-mortarboard-fill text-blue-600 dark:text-blue-400 text-2xl"></i>} />
            <StatCard title={t('totalSubjects')} value={subjects.length} icon={<i className="bi bi-book-fill text-blue-600 dark:text-blue-400 text-2xl"></i>} />
            <StatCard title={t('totalRooms')} value={rooms.length} icon={<i className="bi bi-door-closed-fill text-blue-600 dark:text-blue-400 text-2xl"></i>} />
            <StatCard title={t('totalTeachers')} value={teachers.length} icon={<i className="bi bi-person-badge-fill text-blue-600 dark:text-blue-400 text-2xl"></i>} />
            <StatCard title={t('totalClasses')} value={classes.length} icon={<i className="bi bi-people-fill text-blue-600 dark:text-blue-400 text-2xl"></i>} />
        </div>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartComponent chartId="teacherWorkloadChart" type="bar" title={t('teacherWorkload')} data={teacherWorkloadData} options={chartOptions.bar} />
            <ChartComponent chartId="subjectsPerLevelChart" type="doughnut" title={t('subjectsPerLevel')} data={subjectsPerLevelData} options={chartOptions.doughnut} />
            <ChartComponent chartId="roomUtilizationChart" type="bar" title={t('roomUtilization')} data={roomUtilizationData} options={chartOptions.verticalBar} />
             <ScheduleHeatmap levels={levels} classes={classes} archives={archives} globalDaysOff={globalDaysOff} t={t} theme={theme} />
        </div>
    </div>
)};
