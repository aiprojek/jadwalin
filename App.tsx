
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import type { Teacher, Subject, Room, Class, Schedule, Day, ClassSubject, GeminiError, EducationLevel, ArchivedSchedule, TimeSlot, PrintSettings, InstitutionInfoItem, ToastType, ScheduleEntry } from './types';
import { DAYS_OF_WEEK } from './constants';
import { generateLocalSchedule } from './services/localScheduler';
import { getExportStyles } from './services/exportStyles';


// --- I18n Translations ---
const translations = {
    id: {
        appName: 'Jadwalin',
        dashboard: 'Dasbor',
        totalSubjects: 'Total Mata Pelajaran',
        totalRooms: 'Total Ruangan',
        totalTeachers: 'Total Guru',
        totalClasses: 'Total Kelas',
        totalLevels: 'Total Jenjang',
        subjects: 'Mata Pelajaran',
        rooms: 'Ruangan',
        teachers: 'Guru',
        classes: 'Kelas',
        levels: 'Jenjang Pendidikan',
        promptSubjectName: 'Nama Mata Pelajaran',
        promptRoomName: 'Nama Ruangan',
        promptLevelName: 'Nama Jenjang',
        schedule: 'Jadwal',
        regular: 'Reguler',
        exam: 'Ujian',
        generateButton: 'Buat Jadwal {{scheduleType}}',
        generating: 'Membuat...',
        generationErrorTitle: 'Tidak dapat membuat jadwal:',
        filterBy: 'Saring berdasarkan:',
        class: 'Kelas',
        teacher: 'Guru',
        room: 'Ruangan',
        all: 'Semua',
        print: 'Cetak',
        exportHTML: 'Ekspor HTML',
        time: 'Waktu',
        noSchedule: 'Tidak ada jadwal untuk ditampilkan. Buat jadwal atau sesuaikan filter.',
        addError: 'Harap tambahkan setidaknya satu guru, mata pelajaran, ruangan, dan kelas untuk jenjang yang dipilih sebelum membuat jadwal.',
        addErrorAllLevels: 'Harap tambahkan setidaknya satu guru, mata pelajaran, ruangan, dan kelas di seluruh jenjang sebelum membuat jadwal gabungan.',
        selectLevelPrompt: 'Pilih Jenjang',
        Monday: 'Senin',
        Tuesday: 'Selasa',
        Wednesday: 'Rabu',
        Thursday: 'Kamis',
        Friday: 'Jumat',
        Saturday: 'Sabtu',
        Sunday: 'Minggu',
        exportedScheduleTitle: 'Jadwalin - Jadwal yang Diekspor',
        exportedScheduleHeader: 'Jadwalin - Jadwal {{scheduleType}}',
        generatorEngine: 'Mesin Generator',
        gemini: 'Gemini AI (Online)',
        local: 'Lokal (Offline)',
        dataManagement: 'Manajemen Data',
        scheduleGenerator: 'Generator Jadwal',
        // Modal & Form translations
        addTeacher: 'Tambah Guru Baru',
        editTeacher: 'Ubah Data Guru',
        addClass: 'Tambah Kelas Baru',
        editClass: 'Ubah Data Kelas',
        addSubjectTitle: 'Tambah Mata Pelajaran Baru',
        editSubjectTitle: 'Ubah Data Mata Pelajaran',
        addRoomTitle: 'Tambah Ruangan Baru',
        editRoomTitle: 'Ubah Data Ruangan',
        addLevelTitle: 'Tambah Jenjang Baru',
        editLevelTitle: 'Ubah Data Jenjang',
        teacherName: 'Nama Guru',
        availableDays: 'Hari Tersedia',
        canTeachSubjects: 'Dapat Mengajar Mata Pelajaran',
        canTeachInLevels: 'Dapat Mengajar di Jenjang',
        className: 'Nama Kelas',
        classSubjects: 'Mata Pelajaran & Guru Pengajar',
        subject: 'Mata Pelajaran',
        level: 'Jenjang',
        hoursPerWeek: 'Jam per Minggu',
        addSubject: 'Tambah Mata Pelajaran',
        save: 'Simpan',
        cancel: 'Batal',
        edit: 'Ubah',
        nameRequired: 'Nama tidak boleh kosong',
        levelRequired: 'Jenjang harus dipilih',
        homeroomTeacher: 'Wali Kelas',
        selectTeacher: 'Pilih Guru',
        selectRoom: 'Pilih Ruangan',
        // New Settings Translations
        settings: 'Pengaturan',
        institutionInfo: 'Informasi Lembaga',
        foundationName: 'Nama Yayasan',
        institutionName: 'Nama Lembaga Pendidikan',
        additionalInfo: 'Info Tambahan (Alamat, Kontak, dll.)',
        academicYear: 'Tahun Ajaran',
        academicYearMasehi: 'Tahun Ajaran (Masehi)',
        academicYearHijri: 'Tahun Ajaran (Hijriah)',
        dataBackupRestore: 'Backup & Restore Data',
        backupData: 'Backup Data',
        restoreData: 'Restore Data',
        backupSuccess: 'Data berhasil di-backup!',
        restoreConfirm: 'Apakah Anda yakin ingin memulihkan data? Semua data saat ini akan ditimpa.',
        restoreSuccess: 'Data berhasil dipulihkan!',
        restoreError: 'Gagal memulihkan data. Pastikan file backup valid.',
        settingsSaved: 'Pengaturan berhasil disimpan!',
        saveSettings: 'Simpan Pengaturan',
        // New Archive & Theme Translations
        scheduleArchive: 'Arsip Jadwal',
        archiveEmpty: 'Arsip jadwal Anda kosong.',
        archiveEmptyDesc: 'Buat jadwal baru di tab Generator Jadwal untuk menyimpannya di sini.',
        viewSchedule: 'Lihat Jadwal',
        exportCSV: 'Ekspor CSV',
        accentColor: 'Warna Aksen',
        actions: 'Tindakan',
        archivedOn: 'Diarsipkan pada',
        deleteArchive: 'Hapus Arsip',
        deleteConfirm: 'Apakah Anda yakin ingin menghapus arsip ini? Tindakan ini tidak dapat diurungkan.',
        // Time Slot Settings
        timeSettings: 'Pengaturan Waktu',
        editTimeSlots: 'Atur Slot Waktu',
        addPeriod: 'Tambah Jam Pelajaran',
        addBreak: 'Tambah Istirahat',
        startTime: 'Waktu Mulai',
        endTime: 'Waktu Selesai',
        breakLabel: 'Label Istirahat',
        timeSlot: 'Slot Waktu',
        period: 'Pelajaran',
        break: 'Istirahat',
        lessonTime: 'Jam Pelajaran (Reguler)',
        examTime: 'Jam Ujian',
        // Room Management
        availableForLevels: 'Tersedia untuk Jenjang',
        availableForClasses: 'Atau, batasi untuk kelas tertentu:',
        noRoomRequired: 'Tanpa Ruangan',
        noRoom: 'Tanpa Ruangan',
        // Print Settings
        printExportSettings: 'Pengaturan Cetak & Ekspor',
        paperSize: 'Ukuran Kertas',
        orientation: 'Orientasi',
        portrait: 'Potret (Tegak)',
        landscape: 'Lanskap (Mendatar)',
        margins: 'Margin (mm)',
        top: 'Atas',
        bottom: 'Bawah',
        left: 'Kiri',
        right: 'Kanan',
        includeHeader: 'Sertakan Kop Surat',
        // Help & Tooltips
        help: 'Bantuan',
        helpCenter: 'Bantuan & Tentang',
        toggleTheme: 'Ganti Tema',
        toggleLanguage: 'Ganti Bahasa',
        delete: 'Hapus',
        setTimeSlotsLabel: 'Atur Slot Waktu',
        appDescription: 'Generator jadwal sekolah yang dirancang untuk mengotomatiskan pembuatan jadwal pelajaran dan ujian berdasarkan batasan yang fleksibel.',
        developer: 'AI Projek',
        license: 'Lisensi',
        userGuide: 'Panduan Pengguna',
        guideIntro: 'Selamat datang di Jadwalin! Aplikasi ini dirancang untuk menyederhanakan proses kompleks pembuatan jadwal sekolah. Panduan ini akan membantu Anda menggunakan semua fitur secara efektif.',
        guideData: '1. Manajemen Data',
        guideDataDetail1: 'Ini adalah fondasi dari jadwal Anda. Kualitas jadwal sangat bergantung pada keakuratan data yang Anda masukkan.',
        guideDataDetail2: 'Urutan Penting: Mulailah dari Jenjang, lalu Mata Pelajaran, Ruangan, Guru, dan terakhir Kelas.',
        guideDataDetail3: 'Tips: Saat mengisi data Guru, pastikan untuk memilih hari dan mata pelajaran yang bisa diajar. Ini sangat penting untuk keberhasilan generator.',
        guideDataDetail4: 'Pengaturan Waktu: Setiap Jenjang memiliki pengaturan \'Slot Waktu\' sendiri. Di sini Anda bisa mengatur jam masuk, jam istirahat, dan jam pulang untuk jadwal reguler maupun ujian.',
        guideGenerator: '2. Generator Jadwal',
        guideGeneratorDetail1: 'Setelah data lengkap, di sinilah keajaiban terjadi.',
        guideGeneratorDetail2: 'Langkah 1: Pilih jenis jadwal (Reguler/Ujian) dan Jenjang yang diinginkan.',
        guideGeneratorDetail3: 'Langkah 2: Klik "Buat Jadwal". Jika data Anda kompleks, proses ini mungkin butuh beberapa detik.',
        guideGeneratorDetail4: 'Varian: Anda bisa membuat beberapa \'Varian\' atau versi jadwal yang berbeda untuk dibandingkan sebelum memilih yang terbaik.',
        guideInteraction: '3. Interaksi dengan Jadwal',
        guideInteractionDetail1: 'Jadwal yang dibuat tidak kaku. Anda bisa menyesuaikannya.',
        guideInteractionDetail2: 'Seret & Lepas (Drag & Drop): Pindahkan sesi pelajaran ke slot kosong. Jika ada konflik (misalnya, guru sudah ada jadwal lain), sistem akan memberi tahu Anda.',
        guideInteractionDetail3: 'Cari Pengganti: Butuh guru pengganti? Cukup klik sesi pelajaran, dan aplikasi akan menampilkan daftar guru yang bisa menggantikan.',
        guideArchive: '4. Arsip Jadwal',
        guideArchiveDetail1: 'Sudah menemukan jadwal yang sempurna? Jangan sampai hilang!',
        guideArchiveDetail2: 'Simpan ke Arsip: Setiap jadwal yang Anda simpan akan masuk ke sini. Jadwal di arsip aman dan bisa diakses kapan saja.',
        guideArchiveDetail3: 'Ekspor & Cetak: Dari arsip, Anda bisa mencetak jadwal atau menyimpannya dalam format HTML dan CSV untuk dibagikan.',
        guideSettings: '5. Pengaturan',
        guideSettingsDetail1: 'Personalisasi aplikasi sesuai kebutuhan sekolah Anda.',
        guideSettingsDetail2: 'Info Lembaga: Atur nama sekolah, yayasan, dan alamat untuk ditampilkan di kop surat saat mencetak.',
        guideSettingsDetail3: 'Backup & Restore: Aplikasi ini menyimpan semua data Anda (guru, kelas, jadwal, dll.) langsung di dalam browser di perangkat Anda. Ini bagus untuk privasi dan kecepatan, tetapi artinya data bisa hilang jika Anda membersihkan cache browser atau pindah ke perangkat lain. Fitur Backup & Restore sangat penting! Gunakan untuk membuat \'salinan\' aman dari semua data Anda. Simpan file backup ini di tempat yang aman. Jika terjadi sesuatu, Anda bisa menggunakan file ini untuk mengembalikan semua data Anda seperti semula.',
        donation: 'Donasi',
        sourceCode: 'Kode Sumber (GitHub)',
        joinDiscussion: 'Gabung Diskusi (Telegram)',
        // New Generator Flow
        generateNewVariant: 'Buat Varian Baru',
        scheduleVariants: 'Varian Jadwal',
        variant: 'Varian',
        saveToArchive: 'Simpan Varian ini ke Arsip',
        discardDrafts: 'Buang Draf',
        archiveSuccess: 'Jadwal berhasil diarsipkan!',
        // Holiday Settings
        holidaySettings: 'Pengaturan Hari Libur',
        globalHolidays: 'Hari Libur Global',
        globalHolidaysDesc: 'Pilih hari libur yang berlaku untuk semua jenjang pendidikan.',
        levelSpecificHolidays: 'Hari Libur Spesifik Jenjang',
        levelSpecificHolidaysDesc: 'Timpa pengaturan global. Biarkan kosong untuk mengikuti pengaturan global.',
        // All Levels Generation
        generateAllLevels: 'Buat Jadwal Semua Jenjang',
        allLevels: 'Semua Jenjang',
        // Compact View
        viewByClass: 'Tampilan per Kelas',
        masterTableView: 'Tabel Induk',
        scheduleView: 'Tampilan Jadwal',
        classView: 'Kelas',
        teacherView: 'Guru',
        roomView: 'Ruangan',
        // Logic Enhancements
        maxHoursPerDay: 'Jam Maks per Hari',
        maxHoursPerDayTooltip: 'Biarkan 0 atau kosong untuk tanpa batas.',
        consecutiveHours: 'Jam Berurutan',
        consecutiveHoursTooltip: 'Tentukan blok jam. Misal: 2 untuk 2 jam berurutan. Pastikan "Jam per Minggu" adalah kelipatan dari angka ini.',
        workloadWarningThreshold: 'Batas Peringatan Beban Kerja Mingguan',
        workloadWarningThresholdTooltip: 'Tampilkan peringatan jika total jam mengajar mingguan guru melebihi angka ini. Setel ke 0 untuk menonaktifkan.',
        teacherWorkloadWarning: 'Perhatian: Total beban mengajar {{teacherName}} sekarang adalah {{hours}} jam/minggu.',
        features: 'Fitur Utama',

        // Flexible Institution Info
        infoLabel: 'Label Info',
        infoValue: 'Isi Info',
        addInfo: 'Tambah Info',
        showInHeader: 'Tampilkan di Kop',
        // Dashboard Charts
        teacherWorkload: 'Beban Mengajar Guru',
        subjectsPerLevel: 'Distribusi Mata Pelajaran per Jenjang',
        roomUtilization: 'Utilisasi Ruangan',
        scheduleDensityHeatmap: 'Peta Panas Kepadatan Jadwal',
        hoursUsedPerWeek: 'Jam Terpakai per Minggu',
        concurrentClasses: 'Kelas Bersamaan',
        
        // Substitute Teacher
        findSubstitute: 'Cari Pengganti',
        findSubstituteFor: 'Cari Pengganti untuk:',
        substituteCandidates: 'Kandidat Guru Pengganti',
        noSubstitutesFound: 'Tidak ada guru pengganti yang cocok ditemukan.',
        select: 'Pilih',
        totalHoursToday: 'Total Jam Hari Ini',
        substituteSetSuccess: 'Guru pengganti berhasil ditetapkan untuk sesi ini.',
        // Drag & Drop
        dragConflictTeacherBusy: 'Konflik: {{teacherName}} sudah mengajar di kelas lain.',
        dragConflictRoomBusy: 'Konflik: Ruangan {{roomName}} sudah digunakan.',
        dragConflictTeacherUnavailable: 'Konflik: {{teacherName}} tidak tersedia pada hari {{day}}.',
        dragConflictTeacherMaxHours: 'Konflik: {{teacherName}} akan melebihi batas jam harian.',
        // Compact View & Focus Mode
        compactView: 'Tampilan Kompak',
        compactViewTooltip: 'Sembunyikan detail untuk tampilan ringkas',
    },
    en: {
        appName: 'Jadwalin',
        dashboard: 'Dashboard',
        totalSubjects: 'Total Subjects',
        totalRooms: 'Total Rooms',
        totalTeachers: 'Total Teachers',
        totalClasses: 'Total Classes',
        totalLevels: 'Total Levels',
        subjects: 'Subjects',
        rooms: 'Rooms',
        teachers: 'Teachers',
        classes: 'Classes',
        levels: 'Education Levels',
        promptSubjectName: 'Subject Name',
        promptRoomName: 'Room Name',
        promptLevelName: 'Level Name',
        schedule: 'Schedule',
        regular: 'Regular',
        exam: 'Exam',
        generateButton: 'Generate {{scheduleType}} Schedule',
        generating: 'Generating...',
        generationErrorTitle: 'Could not generate schedule:',
        filterBy: 'Filter by:',
        class: 'Class',
        teacher: 'Teacher',
        room: 'Room',
        all: 'All',
        print: 'Print',
        exportHTML: 'Export HTML',
        time: 'Time',
        noSchedule: 'No schedule to display. Generate a schedule or adjust filters.',
        addError: 'Please add at least one teacher, subject, room, and class for the selected level before generating a schedule.',
        addErrorAllLevels: 'Please add at least one teacher, subject, room, and class across all levels before generating a combined schedule.',
        selectLevelPrompt: 'Select Level',
        Monday: 'Monday',
        Tuesday: 'Tuesday',
        Wednesday: 'Wednesday',
        Thursday: 'Thursday',
        Friday: 'Friday',
        Saturday: 'Saturday',
        Sunday: 'Sunday',
        exportedScheduleTitle: 'Jadwalin - Exported Schedule',
        exportedScheduleHeader: 'Jadwalin - {{scheduleType}} Schedule',
        generatorEngine: 'Generator Engine',
        gemini: 'Gemini AI (Online)',
        local: 'Local (Offline)',
        dataManagement: 'Data Management',
        scheduleGenerator: 'Schedule Generator',
        // Modal & Form translations
        addTeacher: 'Add New Teacher',
        editTeacher: 'Edit Teacher',
        addClass: 'Add New Class',
        editClass: 'Edit Class',
        addSubjectTitle: 'Add New Subject',
        editSubjectTitle: 'Edit Subject',
        addRoomTitle: 'Add New Room',
        editRoomTitle: 'Edit Room',
        addLevelTitle: 'Add New Level',
        editLevelTitle: 'Edit Level Data',
        teacherName: 'Teacher Name',
        availableDays: 'Available Days',
        canTeachSubjects: 'Can Teach Subjects',
        canTeachInLevels: 'Can Teach In Levels',
        className: 'Class Name',
        classSubjects: 'Class Subjects & Teachers',
        subject: 'Subject',
        level: 'Level',
        hoursPerWeek: 'Hours per Week',
        addSubject: 'Add Subject',
        save: 'Save',
        cancel: 'Cancel',
        edit: 'Edit',
        nameRequired: 'Name is required',
        levelRequired: 'Level is required',
        homeroomTeacher: 'Homeroom Teacher',
        selectTeacher: 'Select Teacher',
        selectRoom: 'Select Room',
        // New Settings Translations
        settings: 'Settings',
        institutionInfo: 'Institution Information',
        foundationName: 'Foundation Name',
        institutionName: 'Educational Institution Name',
        additionalInfo: 'Additional Info (Address, Contact, etc.)',
        academicYear: 'Academic Year',
        academicYearMasehi: 'Academic Year (Masehi)',
        academicYearHijri: 'Academic Year (Hijri)',
        dataBackupRestore: 'Data Backup & Restore',
        backupData: 'Backup Data',
        restoreData: 'Restore Data',
        backupSuccess: 'Data backed up successfully!',
        restoreConfirm: 'Are you sure you want to restore data? All current data will be overwritten.',
        restoreSuccess: 'Data restored successfully!',
        restoreError: 'Failed to restore data. Please ensure the backup file is valid.',
        settingsSaved: 'Settings saved successfully!',
        saveSettings: 'Save Settings',
        // New Archive & Theme Translations
        scheduleArchive: 'Schedule Archive',
        archiveEmpty: 'Your schedule archive is empty.',
        archiveEmptyDesc: 'Generate a new schedule in the Schedule Generator tab to save it here.',
        viewSchedule: 'View Schedule',
        exportCSV: 'Export CSV',
        accentColor: 'Accent Color',
        actions: 'Actions',
        archivedOn: 'Archived on',
        deleteArchive: 'Delete Archive',
        deleteConfirm: 'Are you sure you want to delete this archive? This action cannot be undone.',
        // Time Slot Settings
        timeSettings: 'Time Settings',
        editTimeSlots: 'Set Time Slots',
        addPeriod: 'Add Period',
        addBreak: 'Add Break',
        startTime: 'Start Time',
        endTime: 'End Time',
        breakLabel: 'Break Label',
        timeSlot: 'Time Slot',
        period: 'Period',
        break: 'Break',
        lessonTime: 'Lesson Time (Regular)',
        examTime: 'Exam Time',
        // Room Management
        availableForLevels: 'Available for Levels',
        availableForClasses: 'Or, restrict to specific classes:',
        noRoomRequired: 'No Room Required',
        noRoom: 'No Room',
        // Print Settings
        printExportSettings: 'Print & Export Settings',
        paperSize: 'Paper Size',
        orientation: 'Orientation',
        portrait: 'Portrait',
        landscape: 'Landscape',
        margins: 'Margins (mm)',
        top: 'Top',
        bottom: 'Bottom',
        left: 'Left',
        right: 'Right',
        includeHeader: 'Include Letterhead',
        // Help & Tooltips
        help: 'Help',
        helpCenter: 'Help Center & About',
        toggleTheme: 'Toggle Theme',
        toggleLanguage: 'Toggle Language',
        delete: 'Delete',
        setTimeSlotsLabel: 'Set Time Slots',
        appDescription: 'A school schedule generator designed to automate the creation of class and exam schedules based on flexible constraints.',
        developer: 'AI Projek',
        license: 'License',
        userGuide: 'User Guide',
        guideIntro: 'Welcome to Jadwalin! This app is designed to simplify the complex process of school scheduling. This guide will help you use all features effectively.',
        guideData: '1. Data Management',
        guideDataDetail1: 'This is the foundation of your schedule. The quality of the schedule heavily depends on the accuracy of the data you input.',
        guideDataDetail2: 'Important Order: Start with Levels, then Subjects, Rooms, Teachers, and finally Classes.',
        guideDataDetail3: 'Tip: When entering Teacher data, be sure to select the days and subjects they can teach. This is crucial for the generator\'s success.',
        guideDataDetail4: 'Time Settings: Each Level has its own \'Time Slots\' setting. Here you can define start times, break times, and end times for both regular and exam schedules.',
        guideGenerator: '2. Schedule Generator',
        guideGeneratorDetail1: 'Once the data is complete, this is where the magic happens.',
        guideGeneratorDetail2: 'Step 1: Select the schedule type (Regular/Exam) and the desired Level.',
        guideGeneratorDetail3: 'Step 2: Click "Generate Schedule". If your data is complex, this might take a few seconds.',
        guideGeneratorDetail4: 'Variants: You can generate multiple \'Variants\' or different versions of the schedule to compare before choosing the best one.',
        guideInteraction: '3. Schedule Interaction',
        guideInteractionDetail1: 'Generated schedules aren\'t rigid. You can adjust them.',
        guideInteractionDetail2: 'Drag & Drop: Move a lesson session to an empty slot. The system will notify you if there\'s a conflict (e.g., the teacher already has another class).',
        guideInteractionDetail3: 'Find Substitute: Need a substitute teacher? Just click a lesson session, and the app will show a list of qualified replacements.',
        guideArchive: '4. Schedule Archive',
        guideArchiveDetail1: 'Found the perfect schedule? Don\'t lose it!',
        guideArchiveDetail2: 'Save to Archive: Every schedule you save goes here. Archived schedules are safe and can be accessed anytime.',
        guideArchiveDetail3: 'Export & Print: From the archive, you can print schedules or save them in HTML and CSV formats to share.',
        guideSettings: '5. Settings',
        guideSettingsDetail1: 'Personalize the application to your school\'s needs.',
        guideSettingsDetail2: 'Institution Info: Set your school\'s name, foundation, and address to be displayed on the letterhead when printing.',
        guideSettingsDetail3: 'Backup & Restore: This application saves all your data (teachers, classes, schedules, etc.) directly in the browser on your device. This is great for privacy and speed, but it means data can be lost if you clear your browser cache or move to another device. The Backup & Restore feature is very important! Use it to create a safe \'copy\' of all your data. Save this backup file somewhere safe. If anything happens, you can use this file to restore all your data exactly as it was.',
        donation: 'Donation',
        sourceCode: 'Source Code (GitHub)',
        joinDiscussion: 'Join Discussion (Telegram)',
        // New Generator Flow
        generateNewVariant: 'Generate New Variant',
        scheduleVariants: 'Schedule Variants',
        variant: 'Variant',
        saveToArchive: 'Save this Variant to Archive',
        discardDrafts: 'Discard Drafts',
        archiveSuccess: 'Schedule archived successfully!',
        // Holiday Settings
        holidaySettings: 'Holiday Settings',
        globalHolidays: 'Global Holidays',
        globalHolidaysDesc: 'Select the days off that apply to all education levels.',
        levelSpecificHolidays: 'Level-Specific Holidays',
        levelSpecificHolidaysDesc: 'Override global settings. Leave empty to use global settings.',
        // All Levels Generation
        generateAllLevels: 'Generate All Levels Schedule',
        allLevels: 'All Levels',
        // Compact View
        viewByClass: 'View by Class',
        masterTableView: 'Master Table',
        scheduleView: 'Schedule View',
        classView: 'Class',
        teacherView: 'Teacher',
        roomView: 'Room',
        // Logic Enhancements
        maxHoursPerDay: 'Max Hours per Day',
        maxHoursPerDayTooltip: 'Leave 0 or empty for no limit.',
        consecutiveHours: 'Consecutive Hours',
        consecutiveHoursTooltip: 'Define a block of hours. E.g., 2 for a double period. Ensure "Hours per Week" is a multiple of this number.',
        workloadWarningThreshold: 'Weekly Workload Warning Threshold',
        workloadWarningThresholdTooltip: 'Display a warning if a teacher\'s total weekly hours exceed this number. Set to 0 to disable.',
        teacherWorkloadWarning: 'Attention: {{teacherName}}\'s total workload is now {{hours}} hours/week.',
        features: 'Key Features',
         // Flexible Institution Info
        infoLabel: 'Info Label',
        infoValue: 'Info Value',
        addInfo: 'Add Info',
        showInHeader: 'Show in Header',
        // Dashboard Charts
        teacherWorkload: 'Teacher Workload',
        subjectsPerLevel: 'Subjects Distribution by Level',
        roomUtilization: 'Room Utilization',
        scheduleDensityHeatmap: 'Schedule Density Heatmap',
        hoursUsedPerWeek: 'Hours Used per Week',
        concurrentClasses: 'Concurrent Classes',
        
        // Substitute Teacher
        findSubstitute: 'Find Substitute',
        findSubstituteFor: 'Find Substitute for:',
        substituteCandidates: 'Substitute Teacher Candidates',
        noSubstitutesFound: 'No suitable substitute teachers were found.',
        select: 'Select',
        totalHoursToday: 'Total Hours Today',
        substituteSetSuccess: 'Substitute teacher assigned for this session.',
         // Drag & Drop
        dragConflictTeacherBusy: 'Conflict: {{teacherName}} is already teaching another class.',
        dragConflictRoomBusy: 'Conflict: Room {{roomName}} is already in use.',
        dragConflictTeacherUnavailable: 'Conflict: {{teacherName}} is not available on {{day}}.',
        dragConflictTeacherMaxHours: 'Conflict: {{teacherName}} would exceed their daily hour limit.',
        // Compact View & Focus Mode
        compactView: 'Compact View',
        compactViewTooltip: 'Hide details for a summarized view',
    }
};

type TranslationKey = keyof typeof translations.id;

// --- TypeScript declaration for Chart.js from CDN ---
declare var Chart: any;

interface SubstituteFinderContext {
    day: Day;
    timeSlot: string;
    className: string;
    entry: ScheduleEntry;
}

// Type for data being dragged
interface DragData {
    from: {
        className: string;
        day: Day;
        timeSlot: string;
    };
    entry: ScheduleEntry;
}

// --- DEFAULT SETTINGS FUNCTIONS (Guarantees fresh copies) ---
const getDefaultPrintSettings = (): PrintSettings => ({
    paperSize: 'A4',
    orientation: 'landscape',
    margin: { top: 15, right: 10, bottom: 15, left: 10 },
    showHeader: true,
});

const getDefaultInstitutionInfo = (): InstitutionInfoItem[] => ([
    { id: 'inst-default-1', label: 'Nama Lembaga Pendidikan', value: '', showInHeader: true },
    { id: 'inst-default-2', label: 'Nama Yayasan', value: '', showInHeader: true },
    { id: 'inst-default-3', label: 'Alamat & Kontak', value: '', showInHeader: true },
]);

const getDefaultAcademicYear = () => ({ masehi: '', hijri: '' });

const getDefaultGlobalDaysOff = (): Day[] => ['Saturday', 'Sunday'];

const getDefaultWorkloadWarningThreshold = (): number => 40;


// --- UTILITY & HELPER COMPONENTS ---

const getInitials = (name: string): string => {
    if (!name) return '';
    return name
        .split(' ')
        .map(word => word[0])
        .filter(char => char && char.match(/[a-zA-Z]/))
        .join('')
        .toUpperCase();
};

const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
    return (
        <div className="relative group/tooltip flex items-center">
            {children}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max px-2 py-1 bg-gray-800 dark:bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 pointer-events-none z-50 whitespace-nowrap">
                {text}
            </div>
        </div>
    );
};

const ToastNotification: React.FC<{
    message: string;
    type: ToastType;
    isVisible: boolean;
    onClose: () => void;
}> = ({ message, type, isVisible, onClose }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
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


// --- MODAL & FORM COMPONENTS ---
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode, size?: 'md' | 'lg' | 'xl', t: (key: TranslationKey) => string; }> = ({ isOpen, onClose, title, children, size = 'md', t }) => {
    if (!isOpen) return null;
    const sizeClasses = {
        md: 'max-w-md',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl'
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-10" aria-modal="true" role="dialog">
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full m-4 ${sizeClasses[size]}`}>
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
                    <button onClick={onClose} aria-label={t('cancel')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <i className="bi bi-x-lg"></i>
                    </button>
                </div>
                <div className="p-4 max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

const LevelForm: React.FC<{ onSave: (data: Omit<EducationLevel, 'id' | 'timeSlots'> | EducationLevel) => void; onCancel: () => void; t: (key: TranslationKey) => string; initialData?: EducationLevel; globalDaysOff: Day[]; }> = ({ onSave, onCancel, t, initialData, globalDaysOff }) => {
    const [name, setName] = useState('');
    const [daysOff, setDaysOff] = useState<Day[]>([]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setDaysOff(initialData.daysOff || []);
        } else {
            setName('');
            setDaysOff(globalDaysOff); // Pre-populate with global settings for new levels
        }
    }, [initialData, globalDaysOff]);

    const handleDayToggle = (day: Day) => {
        setDaysOff(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert(t('nameRequired'));
            return;
        }
        const payload = { name, daysOff };
        if (initialData?.id) {
            onSave({ ...initialData, ...payload });
        } else {
            onSave(payload);
        }
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

const RoomForm: React.FC<{ levels: EducationLevel[]; classes: Class[]; onSave: (data: Omit<Room, 'id'> | Room) => void; onCancel: () => void; t: (key: TranslationKey) => string; initialData?: Room; }> = ({ levels, classes: allclasses, onSave, onCancel, t, initialData }) => {
    const [name, setName] = useState('');
    const [levelIds, setLevelIds] = useState<string[]>([]);
    const [classIds, setClassIds] = useState<string[]>([]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setLevelIds(initialData.levelIds || []);
            setClassIds(initialData.classIds || []);
        } else {
            setName('');
            setLevelIds([]);
            setClassIds([]);
        }
    }, [initialData]);

    const handleLevelToggle = (levelId: string) => {
        setLevelIds(prev => prev.includes(levelId) ? prev.filter(id => id !== levelId) : [...prev, levelId]);
    };

    const handleClassToggle = (classId: string) => {
        setClassIds(prev => prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]);
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert(t('nameRequired'));
            return;
        }
        const payload = { name, levelIds, classIds };
        if (initialData?.id) {
            onSave({ ...payload, id: initialData.id });
        } else {
            onSave(payload);
        }
    };

    const classesByLevel = useMemo(() => {
        return levels.reduce((acc, level) => {
            const levelClasses = allclasses.filter(c => c.levelId === level.id);
            if (levelClasses.length > 0) {
                acc[level.id] = levelClasses;
            }
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


const SubjectForm: React.FC<{ levels: EducationLevel[]; onSave: (data: Omit<Subject, 'id'> | Subject) => void; onCancel: () => void; t: (key: TranslationKey) => string; initialData?: Subject; }> = ({ levels, onSave, onCancel, t, initialData }) => {
    const [name, setName] = useState('');
    const [levelId, setLevelId] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setLevelId(initialData.levelId);
        } else {
            setName('');
            setLevelId('');
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert(t('nameRequired'));
            return;
        }
        if (!levelId) {
            alert(t('levelRequired'));
            return;
        }
        const payload = { name, levelId };
        if (initialData?.id) {
            onSave({ ...payload, id: initialData.id });
        } else {
            onSave(payload);
        }
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

const TeacherForm: React.FC<{ subjects: Subject[]; levels: EducationLevel[]; onSave: (teacher: Omit<Teacher, 'id'> | Teacher) => void; onCancel: () => void; t: (key: TranslationKey) => string; initialData?: Teacher; }> = ({ subjects, levels, onSave, onCancel, t, initialData }) => {
    const [name, setName] = useState('');
    const [availableDays, setAvailableDays] = useState<Day[]>([]);
    const [canTeachSubjects, setCanTeachSubjects] = useState<string[]>([]);
    const [canTeachInLevels, setCanTeachInLevels] = useState<string[]>([]);
    const [maxHoursPerDay, setMaxHoursPerDay] = useState<number>(0);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setAvailableDays(initialData.availableDays);
            setCanTeachSubjects(initialData.canTeachSubjects);
            setCanTeachInLevels(initialData.canTeachInLevels);
            setMaxHoursPerDay(initialData.maxHoursPerDay || 0);
        } else {
            setName('');
            setAvailableDays([]);
            setCanTeachSubjects([]);
            setCanTeachInLevels([]);
            setMaxHoursPerDay(0);
        }
    }, [initialData]);

    const handleDayToggle = (day: Day) => {
        setAvailableDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };
    const handleSubjectToggle = (subjectId: string) => {
        setCanTeachSubjects(prev => prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]);
    };
    const handleLevelToggle = (levelId: string) => {
        setCanTeachInLevels(prev => prev.includes(levelId) ? prev.filter(id => id !== levelId) : [...prev, levelId]);
        // When a level is deselected, also deselect subjects from that level
        if (!canTeachInLevels.includes(levelId)) {
            const subjectsInDeselectedLevel = subjects.filter(s => s.levelId === levelId).map(s => s.id);
            setCanTeachSubjects(prev => prev.filter(subId => !subjectsInDeselectedLevel.includes(subId)));
        }
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert(t('nameRequired'));
            return;
        }
        const payload = { name, availableDays, canTeachSubjects, canTeachInLevels, maxHoursPerDay: maxHoursPerDay > 0 ? maxHoursPerDay : undefined };
        if (initialData?.id) {
            onSave({ ...payload, id: initialData.id });
        } else {
            onSave(payload);
        }
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

const ClassForm: React.FC<{
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
    const [name, setName] = useState('');
    const [levelId, setLevelId] = useState('');
    const [homeroomTeacherId, setHomeroomTeacherId] = useState('');
    const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setLevelId(initialData.levelId);
            setHomeroomTeacherId(initialData.homeroomTeacherId || '');
            setClassSubjects(initialData.subjects ? JSON.parse(JSON.stringify(initialData.subjects)) : []);
        } else {
            setName('');
            setLevelId('');
            setHomeroomTeacherId('');
            setClassSubjects([]);
        }
    }, [initialData]);

    const calculateTeacherWeeklyWorkload = useCallback((teacherId: string, currentClassSubjects: ClassSubject[]) => {
        if (!teacherId) return 0;
        let totalHours = 0;
        
        // Sum hours from all other classes
        allClasses.forEach(c => {
            // If we are editing, exclude the current class from the global data
            if (initialData && c.id === initialData.id) return;
            c.subjects.forEach(s => {
                if (s.teacherId === teacherId) {
                    totalHours += s.hoursPerWeek;
                }
            });
        });
        
        // Sum hours from the current form state
        currentClassSubjects.forEach(s => {
            if (s.teacherId === teacherId) {
                totalHours += Number(s.hoursPerWeek) || 0;
            }
        });

        return totalHours;
    }, [allClasses, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert(t('nameRequired'));
            return;
        }
        if (!levelId) {
            alert(t('levelRequired'));
            return;
        }
        const payload = {
            name,
            levelId,
            homeroomTeacherId: homeroomTeacherId || undefined,
            subjects: classSubjects.filter(cs => cs.subjectId && cs.teacherId && cs.hoursPerWeek > 0)
                .map(cs => ({...cs, hoursPerWeek: Number(cs.hoursPerWeek), consecutiveHours: cs.consecutiveHours && cs.consecutiveHours > 1 ? Number(cs.consecutiveHours) : undefined}))
        };

        if (initialData?.id) {
            onSave({ ...payload, id: initialData.id });
        } else {
            onSave(payload);
        }
    };

    const addClassSubject = () => setClassSubjects([...classSubjects, { subjectId: '', hoursPerWeek: 1, teacherId: '', requiresRoom: true, consecutiveHours: 1 }]);
    const removeClassSubject = (index: number) => setClassSubjects(classSubjects.filter((_, i) => i !== index));
    const updateClassSubject = (index: number, field: keyof ClassSubject, value: string | number | boolean) => {
        const newSubjects = [...classSubjects];
        (newSubjects[index] as any)[field] = value;
        setClassSubjects(newSubjects);
    };

    const availableSubjects = useMemo(() => {
        if (!levelId) return [];
        return subjects.filter(s => s.levelId === levelId);
    }, [subjects, levelId]);

    const availableTeachersForLevel = useMemo(() => {
        if (!levelId) return [];
        return teachers.filter(t => t.canTeachInLevels.includes(levelId));
    }, [teachers, levelId]);
    
    const getAvailableTeachersForSubject = (subjectId: string) => {
        if(!levelId || !subjectId) return [];
        return teachers.filter(t => t.canTeachInLevels.includes(levelId) && t.canTeachSubjects.includes(subjectId));
    };

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
                                        <Tooltip text={t('hoursPerWeek')}>
                                            <input type="number" min="1" value={cs.hoursPerWeek} onChange={(e) => updateClassSubject(index, 'hoursPerWeek', parseInt(e.target.value, 10))} className="col-span-1 w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2" placeholder="JP" />
                                        </Tooltip>
                                        <Tooltip text={t('consecutiveHoursTooltip')}>
                                            <input type="number" min="1" value={cs.consecutiveHours || 1} onChange={(e) => updateClassSubject(index, 'consecutiveHours', parseInt(e.target.value, 10))} className="col-span-1 w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-3 py-2" placeholder="Blok" />
                                        </Tooltip>
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
                                        <input
                                            type="checkbox"
                                            checked={cs.requiresRoom === false}
                                            onChange={(e) => updateClassSubject(index, 'requiresRoom', !e.target.checked)}
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>{t('noRoomRequired')}</span>
                                    </label>
                                    <button type="button" onClick={() => removeClassSubject(index)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
                                        <i className="bi bi-trash3-fill"></i> Hapus
                                    </button>
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

const TimeSlotEditorModal: React.FC<{
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


// --- THEME & LANGUAGE TOGGLES ---
const ThemeToggle: React.FC<{t: (key: TranslationKey) => string; theme: 'light' | 'dark'; setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>}> = ({t, theme, setTheme}) => {
    const toggleTheme = () => setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');

    return (
        <Tooltip text={t('toggleTheme')}>
            <button onClick={toggleTheme} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors w-9 h-9 flex items-center justify-center" aria-label="Toggle theme">
                {theme === 'dark' ? <i className="bi bi-sun-fill text-lg"></i> : <i className="bi bi-moon-stars-fill text-lg"></i>}
            </button>
        </Tooltip>
    );
};

const LanguageToggle: React.FC<{ language: 'id' | 'en', setLanguage: React.Dispatch<React.SetStateAction<'id' | 'en'>>, t: (key: TranslationKey) => string }> = ({ language, setLanguage, t }) => {
    const toggleLanguage = () => {
        const newLang = language === 'id' ? 'en' : 'id';
        setLanguage(newLang);
    };

    return (
        <Tooltip text={t('toggleLanguage')}>
            <button onClick={toggleLanguage} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-bold text-sm w-9 h-9 flex items-center justify-center" aria-label="Toggle language">
                {language.toUpperCase()}
            </button>
        </Tooltip>
    );
};

// --- HEADER ---
const Header: React.FC<{ t: (key: TranslationKey) => string; language: 'id' | 'en'; setLanguage: React.Dispatch<React.SetStateAction<'id' | 'en'>>; onSettingsClick: () => void; onHelpClick: () => void; theme: 'light' | 'dark'; setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>; }> = ({ t, language, setLanguage, onSettingsClick, onHelpClick, theme, setTheme }) => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
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
             {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-3">
                <ActionButtons />
            </div>
             {/* Mobile Menu */}
            <div className="md:hidden relative" ref={menuRef}>
                <Tooltip text={t('actions')}>
                    <button onClick={() => setMenuOpen(prev => !prev)} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors w-9 h-9 flex items-center justify-center">
                        <i className="bi bi-three-dots-vertical text-lg"></i>
                    </button>
                </Tooltip>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg z-20 py-1 ring-1 ring-black ring-opacity-5">
                        <div className="px-4 py-2 flex justify-around">
                             <ActionButtons />
                        </div>
                    </div>
                )}
            </div>
        </div>
    </header>
)};

// --- DASHBOARD COMPONENTS ---

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
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
            const ctx = chartRef.current.getContext('2d');
            if (ctx) {
                chartInstance.current = new Chart(ctx, {
                    type: type,
                    data: data,
                    options: options,
                });
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
            <div className="relative h-64 sm:h-80">
                <canvas id={chartId} ref={chartRef}></canvas>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex items-center space-x-4">
        <div className="bg-blue-100 dark:bg-blue-800/50 p-3 rounded-full flex items-center justify-center w-12 h-12">
            {icon}
        </div>
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
        // Use the most recent regular schedule from archives for the heatmap
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
        if (value === 0 || !value) return theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50';
        const percentage = Math.min(value / (max > 0 ? max : 1), 1);
        if (percentage < 0.2) return 'bg-blue-200 dark:bg-blue-900';
        if (percentage < 0.4) return 'bg-blue-300 dark:bg-blue-800';
        if (percentage < 0.6) return 'bg-blue-400 dark:bg-blue-700';
        if (percentage < 0.8) return 'bg-blue-500 dark:bg-blue-600';
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
                                    const colorClass = getColorForDensity(count, heatmapData.maxDensity);
                                    return (
                                        <td key={`${day}-${slot}`} className={`p-0 border dark:border-gray-700`}>
                                            <Tooltip text={`${count} ${t('concurrentClasses')}`}>
                                                <div className={`w-full h-full p-2 text-center text-xs font-bold ${colorClass} ${count > 0 ? 'text-white' : ''}`}>
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

const Dashboard: React.FC<{
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
        classes.forEach(cls => {
            cls.subjects.forEach(sub => {
                const teacher = teachers.find(t => t.id === sub.teacherId);
                if (teacher) {
                    workload[teacher.name] = (workload[teacher.name] || 0) + sub.hoursPerWeek;
                }
            });
        });

        const sortedTeachers = Object.entries(workload).sort(([, a], [, b]) => b - a).slice(0, 15); // Show top 15 for readability

        return {
            labels: sortedTeachers.map(entry => entry[0]),
            datasets: [{
                label: t('hoursPerWeek'),
                data: sortedTeachers.map(entry => entry[1]),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            }]
        };
    }, [teachers, classes, t]);

    const subjectsPerLevelData = useMemo(() => {
        const counts: { [key: string]: number } = {};
        subjects.forEach(sub => {
            const level = levels.find(l => l.id === sub.levelId);
            if (level) {
                counts[level.name] = (counts[level.name] || 0) + 1;
            }
        });

        return {
            labels: Object.keys(counts),
            datasets: [{
                label: t('totalSubjects'),
                data: Object.values(counts),
                backgroundColor: ['rgba(236, 72, 153, 0.6)', 'rgba(59, 130, 246, 0.6)', 'rgba(16, 185, 129, 0.6)', 'rgba(139, 92, 246, 0.6)', 'rgba(249, 115, 22, 0.6)'],
                borderColor: ['#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#f97316'],
                borderWidth: 1,
            }]
        };
    }, [subjects, levels, t]);

    const roomUtilizationData = useMemo(() => {
        const utilization: { [roomName: string]: number } = {};
        const latestSchedule = archives.find(a => a.scheduleType === 'Regular')?.schedule;
        
        if (latestSchedule) {
            for (const className in latestSchedule) {
                for (const day in latestSchedule[className]) {
                    for (const timeSlot in latestSchedule[className][day as Day]) {
                        const entry = latestSchedule[className][day as Day]![timeSlot];
                        if (entry.roomName !== t('noRoom')) {
                            utilization[entry.roomName] = (utilization[entry.roomName] || 0) + 1;
                        }
                    }
                }
            }
        }
        
        const sortedRooms = Object.entries(utilization).sort(([, a], [, b]) => b - a);

        return {
            labels: sortedRooms.map(entry => entry[0]),
            datasets: [{
                label: t('hoursUsedPerWeek'),
                data: sortedRooms.map(entry => entry[1]),
                backgroundColor: 'rgba(236, 72, 153, 0.5)',
                borderColor: 'rgba(236, 72, 153, 1)',
                borderWidth: 1,
            }]
        };
    }, [archives, t]);

    const chartOptions = useMemo(() => {
        const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = theme === 'dark' ? '#E5E7EB' : '#374151';

        const barOptions = (indexAxis: 'x' | 'y' = 'x') => ({
            indexAxis: indexAxis,
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { color: textColor, font: { size: 10 } },
                    grid: { color: gridColor },
                },
                y: {
                    ticks: { color: textColor, font: { size: 10 } },
                    grid: { display: indexAxis === 'x' ? true : false, color: gridColor },
                }
            }
        });

        const doughnutOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom' as const,
                    labels: { color: textColor, font: { size: 10 } },
                },
            }
        };

        return { bar: barOptions('y'), doughnut: doughnutOptions, verticalBar: barOptions('x') };
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
            <ChartComponent
                chartId="teacherWorkloadChart"
                type="bar"
                title={t('teacherWorkload')}
                data={teacherWorkloadData}
                options={chartOptions.bar}
            />
            <ChartComponent
                chartId="subjectsPerLevelChart"
                type="doughnut"
                title={t('subjectsPerLevel')}
                data={subjectsPerLevelData}
                options={chartOptions.doughnut}
            />
            <ChartComponent
                chartId="roomUtilizationChart"
                type="bar"
                title={t('roomUtilization')}
                data={roomUtilizationData}
                options={chartOptions.verticalBar}
            />
             <ScheduleHeatmap
                levels={levels}
                classes={classes}
                archives={archives}
                globalDaysOff={globalDaysOff}
                t={t}
                theme={theme}
            />
        </div>
    </div>
)};


// --- DATA MANAGEMENT COMPONENTS ---
const DataCard: React.FC<{ title: string; onAdd?: () => void; children: React.ReactNode; addTooltipText?: string; }> = ({ title, onAdd, children, addTooltipText }) => (
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
        <div className="space-y-2 max-h-96 overflow-y-auto">
            {children}
        </div>
    </div>
);

const DataItem: React.FC<{ children: React.ReactNode; onDelete: () => void; onEdit?: () => void; onEditTimeSlots?: () => void; t: (key: TranslationKey) => string; }> = ({ children, onDelete, onEdit, onEditTimeSlots, t }) => (
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

// --- SCHEDULE VIEW ---
const ScheduleHeader: React.FC<{
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
        } else {
            // Backward compatibility for old archives
            const oldInfo = institutionInfo as { foundation?: string; institution?: string; address?: string; };
            return (
                <>
                    {oldInfo.foundation && <h2 className="text-lg font-bold uppercase text-gray-800 dark:text-gray-200">{oldInfo.foundation}</h2>}
                    {oldInfo.institution && <h1 className="text-2xl font-bold uppercase text-gray-900 dark:text-gray-100">{oldInfo.institution}</h1>}
                    {oldInfo.address && <p className="text-sm text-gray-600 dark:text-gray-400">{oldInfo.address}</p>}
                </>
            );
        }
    };
    
    const titleContext = useMemo(() => {
        if (viewContext === 'teacher' || viewContext === 'room') {
            return `${viewContext === 'teacher' ? 'GURU' : 'RUANGAN'}: ${viewSubjectName}`;
        }
        return selectedLevelName.toUpperCase();
    }, [viewContext, viewSubjectName, selectedLevelName]);


    return (
        <div className="mb-6 text-center border-b-2 border-black dark:border-gray-400 pb-4">
            {renderHeaderContent()}
            <p className="text-md font-semibold mt-4 text-gray-800 dark:text-gray-200">
                JADWAL PELAJARAN {scheduleType === 'Regular' ? 'REGULER' : 'UJIAN'} - {titleContext}
            </p>
            {(academicYear.masehi || academicYear.hijri) && (
                 <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tahun Ajaran: {academicYear.masehi}{academicYear.masehi && academicYear.hijri ? ' - ' : ''}{academicYear.hijri}
                </p>
            )}
        </div>
    );
};

// Drag and Drop Components
const DraggableEntry: React.FC<{
    id: string;
    data: DragData;
    children: React.ReactNode;
}> = ({ id, data, children }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id, data });
    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
        cursor: 'grabbing',
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            {children}
        </div>
    );
};

const DroppableCell: React.FC<{
    id: string;
    children: React.ReactNode;
    isValidDrop: boolean;
    isInvalidDrop: boolean;
    conflictMessage?: string;
}> = ({ id, children, isValidDrop, isInvalidDrop, conflictMessage }) => {
    const { setNodeRef } = useDroppable({ id });
    const baseClasses = "p-2 border border-gray-200 dark:border-gray-700 transition-colors duration-200 h-full";
    let stateClasses = '';
    if (isValidDrop) {
        stateClasses = 'bg-green-200 dark:bg-green-800/50';
    } else if (isInvalidDrop) {
        stateClasses = 'bg-red-200 dark:bg-red-800/50';
    }

    const cellContent = (
        <div ref={setNodeRef} className={`${baseClasses} ${stateClasses}`}>
            {children}
        </div>
    );

    return isInvalidDrop && conflictMessage ? (
        <Tooltip text={conflictMessage}>
            {cellContent}
        </Tooltip>
    ) : cellContent;
};


const ScheduleTable: React.FC<{ schedule: Schedule; filter: { type: string; value: string }; t: (key: TranslationKey, replacements?: Record<string, string>) => string; accentColor?: string; globalDaysOff: Day[] ; levels: EducationLevel[]; classes: Class[]; timeSlotsForLevel?: (levelId: string) => TimeSlot[]; onEntryClick: (context: SubstituteFinderContext) => void; droppableState: any; isCompactView: boolean; }> = ({ schedule, filter, t, accentColor = '#3b82f6', globalDaysOff, levels, classes, timeSlotsForLevel, onEntryClick, droppableState, isCompactView }) => {
    
    const getClassLevel = (className: string) => {
        const classInfo = classes.find(c => c.name === className);
        if (!classInfo) return null;
        return levels.find(l => l.id === classInfo.levelId);
    };

    const getEffectiveDaysOff = (className: string) => {
        const level = getClassLevel(className);
        if (level?.daysOff && level.daysOff.length > 0) {
            return level.daysOff;
        }
        return globalDaysOff;
    };
    
    const filteredSchedule = useMemo(() => {
        if (!filter.value) return schedule;
        
        const newSchedule: Schedule = {};
        
        if (filter.type === 'class') {
            if (schedule[filter.value]) {
                newSchedule[filter.value] = schedule[filter.value];
            }
            return newSchedule;
        }

        for (const className in schedule) {
            newSchedule[className] = {};
            for (const day of DAYS_OF_WEEK) {
                newSchedule[className][day] = {};
                if (schedule[className][day]) {
                    for (const timeSlot in schedule[className][day]) {
                        const entry = schedule[className][day]![timeSlot];
                        if ((filter.type === 'teacher' && entry.teacherName === filter.value) || 
                            (filter.type === 'room' && entry.roomName === filter.value)) {
                            newSchedule[className][day]![timeSlot] = entry;
                        }
                    }
                }
            }
        }
        return newSchedule;

    }, [schedule, filter]);

    const classNames = Object.keys(filteredSchedule).sort((a, b) => {
        const levelA = getClassLevel(a)?.name || '';
        const levelB = getClassLevel(b)?.name || '';
        if (levelA !== levelB) {
            return levelA.localeCompare(levelB);
        }
        return a.localeCompare(b);
    });

    if (classNames.length === 0) {
        return <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow text-gray-500 dark:text-gray-400">{t('noSchedule')}</div>;
    }

    return (
        <div className="space-y-8" style={{ '--accent-color': accentColor } as React.CSSProperties}>
            {classNames.map(className => {
                const classLevel = getClassLevel(className);
                const timeSlots = timeSlotsForLevel && classLevel ? timeSlotsForLevel(classLevel.id) : [];

                const effectiveDaysOff = getEffectiveDaysOff(className);
                const displayDays = DAYS_OF_WEEK.filter(day => !effectiveDaysOff.includes(day));

                if (timeSlots.length === 0) return null;

                return (
                    <div key={className} id={`schedule-${className.replace(/\s+/g, '-')}`} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow print:shadow-none print:p-2">
                        <h3 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-300">{className} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({classLevel?.name})</span></h3>
                        <div className="overflow-x-auto">
                            <table className={`w-full min-w-[600px] border-collapse text-center schedule-table-focusable ${isCompactView ? 'compact-view' : ''}`}>
                                <thead>
                                    <tr>
                                        <th className="p-2 border-b-2 text-white dark:text-gray-900 border-gray-200 dark:border-gray-600 text-sm font-semibold" style={{ backgroundColor: 'var(--accent-color)' }}>{t('time')}</th>
                                        {displayDays.map(day => <th key={day} className="p-2 border-b-2 text-white dark:text-gray-900 border-gray-200 dark:border-gray-600 text-sm font-semibold" style={{ backgroundColor: 'var(--accent-color)' }}>{t(day as TranslationKey)}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {timeSlots.map(slot => {
                                        if (slot.type === 'break') {
                                            return (
                                                <tr key={slot.id} className="bg-gray-100 dark:bg-gray-700/50">
                                                    <td className="p-2 border-b border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400">{slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}`: ''}</td>
                                                    <td colSpan={displayDays.length} className="p-2 border border-gray-200 dark:border-gray-700 text-center font-semibold text-sm text-gray-700 dark:text-gray-300">{slot.label}</td>
                                                </tr>
                                            );
                                        }
                                        return (
                                            <tr key={slot.id} className="odd:bg-gray-50 dark:odd:bg-gray-800/50">
                                                <td className="p-2 border-b border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400">{slot.label}</td>
                                                {displayDays.map(day => {
                                                    const entry = filteredSchedule[className]?.[day]?.[slot.label];
                                                    const droppableId = `${className}-${day}-${slot.label}`;
                                                    const isDroppable = droppableState.overId === droppableId;

                                                    return (
                                                        <td key={day} className="p-0">
                                                             <DroppableCell
                                                                id={droppableId}
                                                                isValidDrop={isDroppable && droppableState.isValid}
                                                                isInvalidDrop={isDroppable && !droppableState.isValid}
                                                                conflictMessage={isDroppable ? droppableState.conflictMessage : undefined}
                                                            >
                                                            {entry ? (
                                                                <DraggableEntry id={droppableId} data={{ from: { className, day, timeSlot: slot.label }, entry }}>
                                                                    <div
                                                                        className="schedule-entry-item text-xs sm:text-sm p-1 rounded-md cursor-pointer"
                                                                        onClick={() => onEntryClick({ day, timeSlot: slot.label, className, entry })}
                                                                        role="button"
                                                                        tabIndex={0}
                                                                    >
                                                                         {isCompactView ? (
                                                                            <>
                                                                                <p className="font-bold text-gray-800 dark:text-gray-100">{entry.subjectName}</p>
                                                                                <p className="text-gray-600 dark:text-gray-300">{getInitials(entry.teacherName)}</p>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <p className="font-bold text-gray-800 dark:text-gray-100">{entry.subjectName}</p>
                                                                                <p className="text-gray-600 dark:text-gray-300">{entry.teacherName}</p>
                                                                                <p className="text-blue-500 dark:text-blue-400 text-xs">@{entry.roomName}</p>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </DraggableEntry>
                                                            ) : <div className="min-h-[60px] flex items-center justify-center"><span className="text-gray-300 dark:text-gray-600">-</span></div>}
                                                            </DroppableCell>
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};


const MasterScheduleTable: React.FC<{ schedule: Schedule; t: (key: TranslationKey, replacements?: Record<string, string>) => string; accentColor?: string; globalDaysOff: Day[]; levels: EducationLevel[]; classes: Class[]; timeSlots: TimeSlot[]; onEntryClick: (context: SubstituteFinderContext) => void; droppableState: any; isCompactView: boolean; }> = ({ schedule, t, accentColor = '#3b82f6', globalDaysOff, levels, classes, timeSlots, onEntryClick, droppableState, isCompactView }) => {
    
    const getClassLevel = (className: string) => {
        const classInfo = classes.find(c => c.name === className);
        if (!classInfo) return null;
        return levels.find(l => l.id === classInfo.levelId);
    };

    const getEffectiveDaysOffForAll = () => {
        // For master view, if it's a single level, use its days off. If multiple, use global.
        const levelIdsInSchedule = new Set(Object.keys(schedule).map(cn => getClassLevel(cn)?.id).filter(Boolean));
        if (levelIdsInSchedule.size === 1) {
            const level = levels.find(l => l.id === Array.from(levelIdsInSchedule)[0]);
            if (level?.daysOff && level.daysOff.length > 0) return level.daysOff;
        }
        return globalDaysOff;
    };

    const classNames = Object.keys(schedule).sort((a, b) => {
        const levelA = getClassLevel(a)?.name || '';
        const levelB = getClassLevel(b)?.name || '';
        if (levelA !== levelB) return levelA.localeCompare(levelB);
        return a.localeCompare(b);
    });

    if (classNames.length === 0) {
        return <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow text-gray-500 dark:text-gray-400">{t('noSchedule')}</div>;
    }
    
    const effectiveDaysOff = getEffectiveDaysOffForAll();
    const displayDays = DAYS_OF_WEEK.filter(day => !effectiveDaysOff.includes(day));

    return (
        <div id="master-schedule-view" className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow print:shadow-none print:p-2 overflow-x-auto" style={{ '--accent-color': accentColor } as React.CSSProperties}>
            <table className={`w-full min-w-max border-collapse text-center schedule-table-focusable ${isCompactView ? 'compact-view' : ''}`}>
                <thead>
                    <tr>
                        <th className="p-2 border-b-2 text-white dark:text-gray-900 border-gray-200 dark:border-gray-600 text-sm font-semibold sticky left-0 z-10 bg-inherit" style={{ backgroundColor: 'var(--accent-color)' }}>{t('time')}</th>
                        {classNames.map(className => (
                            <th key={className} className="p-2 border-b-2 text-white dark:text-gray-900 border-gray-200 dark:border-gray-600 text-sm font-semibold" style={{ backgroundColor: 'var(--accent-color)' }}>
                                {className}
                                <div className="font-normal text-xs opacity-80">({getClassLevel(className)?.name})</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displayDays.map(day => (
                        <React.Fragment key={day}>
                            <tr>
                                <td colSpan={classNames.length + 1} className="p-1.5 font-bold text-base bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 sticky left-0 z-10">
                                    {t(day as TranslationKey)}
                                </td>
                            </tr>
                            {timeSlots.map(slot => {
                                if (slot.type === 'break') {
                                    return (
                                        <tr key={`${day}-${slot.id}`} className="bg-gray-100 dark:bg-gray-700/50">
                                            <td className="p-2 border-b border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400 sticky left-0 z-10 bg-gray-100 dark:bg-gray-700/50">{slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}`: ''}</td>
                                            <td colSpan={classNames.length} className="p-2 border border-gray-200 dark:border-gray-700 text-center font-semibold text-sm text-gray-700 dark:text-gray-300">{slot.label}</td>
                                        </tr>
                                    );
                                }
                                return (
                                    <tr key={`${day}-${slot.id}`} className="odd:bg-gray-50 dark:odd:bg-gray-800/50">
                                        <td className="p-2 border-b border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400 sticky left-0 z-10 bg-white dark:bg-gray-800 odd:bg-gray-50 dark:odd:bg-gray-800/50">{slot.label}</td>
                                        {classNames.map(className => {
                                            const entry = schedule[className]?.[day]?.[slot.label];
                                            const droppableId = `${className}-${day}-${slot.label}`;
                                            const isDroppable = droppableState.overId === droppableId;
                                            return (
                                                <td key={`${day}-${slot.id}-${className}`} className="p-0">
                                                     <DroppableCell
                                                        id={droppableId}
                                                        isValidDrop={isDroppable && droppableState.isValid}
                                                        isInvalidDrop={isDroppable && !droppableState.isValid}
                                                        conflictMessage={isDroppable ? droppableState.conflictMessage : undefined}
                                                    >
                                                    {entry ? (
                                                        <DraggableEntry id={droppableId} data={{ from: { className, day, timeSlot: slot.label }, entry }}>
                                                            <div
                                                                className="schedule-entry-item text-xs sm:text-sm p-1 rounded-md cursor-pointer"
                                                                onClick={() => onEntryClick({ day, timeSlot: slot.label, className, entry })}
                                                                role="button"
                                                                tabIndex={0}
                                                            >
                                                                {isCompactView ? (
                                                                     <>
                                                                        <p className="font-bold text-gray-800 dark:text-gray-100">{entry.subjectName}</p>
                                                                        <p className="text-gray-600 dark:text-gray-300 text-xs">{getInitials(entry.teacherName)}</p>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <p className="font-bold text-gray-800 dark:text-gray-100">{entry.subjectName}</p>
                                                                        <p className="text-gray-600 dark:text-gray-300 text-xs">{entry.teacherName}</p>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </DraggableEntry>
                                                    ) : <div className="min-h-[52px] flex items-center justify-center"><span className="text-gray-300 dark:text-gray-600">-</span></div>}
                                                    </DroppableCell>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const TeacherScheduleTable: React.FC<{ schedule: Schedule; teacherName: string; timeSlots: TimeSlot[]; displayDays: Day[]; t: (key: TranslationKey) => string; accentColor?: string; onEntryClick: (context: SubstituteFinderContext) => void; droppableState: any; isCompactView: boolean; }> = ({ schedule, teacherName, timeSlots, displayDays, t, accentColor = '#3b82f6', onEntryClick, droppableState, isCompactView }) => {
    const teacherSchedule = useMemo(() => {
        const processed: { [day in Day]?: { [timeSlot: string]: { subjectName: string; className: string; roomName: string; } } } = {};
        for (const className in schedule) {
            for (const day in schedule[className]) {
                const typedDay = day as Day;
                for (const timeSlot in schedule[className][typedDay]) {
                    const entry = schedule[className][typedDay]![timeSlot];
                    if (entry.teacherName === teacherName) {
                        if (!processed[typedDay]) {
                            processed[typedDay] = {};
                        }
                        processed[typedDay]![timeSlot] = {
                            subjectName: entry.subjectName,
                            className: className,
                            roomName: entry.roomName,
                        };
                    }
                }
            }
        }
        return processed;
    }, [schedule, teacherName]);

    return (
        <div id="teacher-schedule-view" className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow print:shadow-none print:p-2" style={{ '--accent-color': accentColor } as React.CSSProperties}>
            <h3 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-300">{t('teacher')}: {teacherName}</h3>
            <div className="overflow-x-auto">
                <table className={`w-full min-w-[600px] border-collapse text-center schedule-table-focusable ${isCompactView ? 'compact-view' : ''}`}>
                    <thead>
                        <tr>
                            <th className="p-2 border-b-2 text-white dark:text-gray-900 border-gray-200 dark:border-gray-600 text-sm font-semibold" style={{ backgroundColor: 'var(--accent-color)' }}>{t('time')}</th>
                            {displayDays.map(day => <th key={day} className="p-2 border-b-2 text-white dark:text-gray-900 border-gray-200 dark:border-gray-600 text-sm font-semibold" style={{ backgroundColor: 'var(--accent-color)' }}>{t(day as TranslationKey)}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map(slot => {
                            if (slot.type === 'break') {
                                return (
                                    <tr key={slot.id} className="bg-gray-100 dark:bg-gray-700/50">
                                        <td className="p-2 border-b border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400">{slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}`: ''}</td>
                                        <td colSpan={displayDays.length} className="p-2 border border-gray-200 dark:border-gray-700 text-center font-semibold text-sm text-gray-700 dark:text-gray-300">{slot.label}</td>
                                    </tr>
                                );
                            }
                            return (
                                <tr key={slot.id} className="odd:bg-gray-50 dark:odd:bg-gray-800/50">
                                    <td className="p-2 border-b border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400">{slot.label}</td>
                                    {displayDays.map(day => {
                                        const entry = teacherSchedule[day]?.[slot.label];
                                        return (
                                            <td key={day} className="p-2 border border-gray-200 dark:border-gray-700">
                                                {entry ? (
                                                    <div
                                                        className="schedule-entry-item text-xs sm:text-sm p-1 rounded-md cursor-pointer"
                                                        onClick={() => onEntryClick({ day, timeSlot: slot.label, className: entry.className, entry: { ...entry, teacherName } })}
                                                        role="button"
                                                        tabIndex={0}
                                                    >
                                                        <p className="font-bold text-gray-800 dark:text-gray-100">{entry.subjectName}</p>
                                                        <p className="text-gray-600 dark:text-gray-300">{entry.className}</p>
                                                        {!isCompactView && <p className="text-blue-500 dark:text-blue-400 text-xs">@{entry.roomName}</p>}
                                                    </div>
                                                ) : <span className="text-gray-300 dark:text-gray-600">-</span>}
                                            </td>
                                        )
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const RoomScheduleTable: React.FC<{ schedule: Schedule; roomName: string; timeSlots: TimeSlot[]; displayDays: Day[]; t: (key: TranslationKey) => string; accentColor?: string; onEntryClick: (context: SubstituteFinderContext) => void; droppableState: any; isCompactView: boolean; }> = ({ schedule, roomName, timeSlots, displayDays, t, accentColor = '#3b82f6', onEntryClick, droppableState, isCompactView }) => {
    const roomSchedule = useMemo(() => {
        const processed: { [day in Day]?: { [timeSlot: string]: { subjectName: string; className: string; teacherName: string; } } } = {};
        for (const className in schedule) {
            for (const day in schedule[className]) {
                const typedDay = day as Day;
                for (const timeSlot in schedule[className][typedDay]) {
                    const entry = schedule[className][typedDay]![timeSlot];
                    if (entry.roomName === roomName) {
                        if (!processed[typedDay]) {
                            processed[typedDay] = {};
                        }
                        processed[typedDay]![timeSlot] = {
                            subjectName: entry.subjectName,
                            className: className,
                            teacherName: entry.teacherName,
                        };
                    }
                }
            }
        }
        return processed;
    }, [schedule, roomName]);

    return (
        <div id="room-schedule-view" className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow print:shadow-none print:p-2" style={{ '--accent-color': accentColor } as React.CSSProperties}>
            <h3 className="text-xl font-bold mb-4 text-blue-700 dark:text-blue-300">{t('room')}: {roomName}</h3>
            <div className="overflow-x-auto">
                <table className={`w-full min-w-[600px] border-collapse text-center schedule-table-focusable ${isCompactView ? 'compact-view' : ''}`}>
                    <thead>
                        <tr>
                            <th className="p-2 border-b-2 text-white dark:text-gray-900 border-gray-200 dark:border-gray-600 text-sm font-semibold" style={{ backgroundColor: 'var(--accent-color)' }}>{t('time')}</th>
                            {displayDays.map(day => <th key={day} className="p-2 border-b-2 text-white dark:text-gray-900 border-gray-200 dark:border-gray-600 text-sm font-semibold" style={{ backgroundColor: 'var(--accent-color)' }}>{t(day as TranslationKey)}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map(slot => {
                            if (slot.type === 'break') {
                                return (
                                    <tr key={slot.id} className="bg-gray-100 dark:bg-gray-700/50">
                                        <td className="p-2 border-b border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400">{slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}` : ''}</td>
                                        <td colSpan={displayDays.length} className="p-2 border border-gray-200 dark:border-gray-700 text-center font-semibold text-sm text-gray-700 dark:text-gray-300">{slot.label}</td>
                                    </tr>
                                );
                            }
                            return (
                                <tr key={slot.id} className="odd:bg-gray-50 dark:odd:bg-gray-800/50">
                                    <td className="p-2 border-b border-gray-200 dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400">{slot.label}</td>
                                    {displayDays.map(day => {
                                        const entry = roomSchedule[day]?.[slot.label];
                                        return (
                                            <td key={day} className="p-2 border border-gray-200 dark:border-gray-700">
                                                {entry ? (
                                                    <div
                                                        className="schedule-entry-item text-xs sm:text-sm p-1 rounded-md cursor-pointer"
                                                        onClick={() => onEntryClick({ day, timeSlot: slot.label, className: entry.className, entry: { ...entry, roomName } })}
                                                        role="button"
                                                        tabIndex={0}
                                                    >
                                                        <p className="font-bold text-gray-800 dark:text-gray-100">{entry.subjectName}</p>
                                                        <p className="text-gray-600 dark:text-gray-300">{entry.className}</p>
                                                        <p className="text-green-500 dark:text-green-400 text-xs">{isCompactView ? getInitials(entry.teacherName) : entry.teacherName}</p>
                                                    </div>
                                                ) : <span className="text-gray-300 dark:text-gray-600">-</span>}
                                            </td>
                                        )
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ACCENT_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f97316', '#6366f1'];

const ColorPicker: React.FC<{selectedColor: string; onSelectColor: (color: string) => void; t: (key: TranslationKey) => string}> = ({ selectedColor, onSelectColor, t }) => (
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

// --- HELP & ABOUT PAGE ---
const HelpAndAboutPage: React.FC<{ t: (key: TranslationKey) => string; }> = ({ t }) => {
    const [openSection, setOpenSection] = useState<string | null>('guideIntro');

    const CollapsibleSection: React.FC<{ title: string; id: string; icon: string; children: React.ReactNode; }> = ({ title, id, icon, children }) => {
        const isOpen = openSection === id;
        return (
            <div className="border-b dark:border-gray-700">
                <button
                    onClick={() => setOpenSection(isOpen ? null : id)}
                    className="w-full flex justify-between items-center py-4 text-left font-semibold text-gray-800 dark:text-gray-200"
                >
                    <div className="flex items-center gap-3">
                        <i className={`bi ${icon} text-xl text-blue-500 dark:text-blue-400`}></i>
                        <span>{title}</span>
                    </div>
                    <i className={`bi bi-chevron-down transition-transform duration-300 ${isOpen ? 'transform rotate-180' : ''}`}></i>
                </button>
                <div className={`grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : ''}`}>
                    <div className="overflow-hidden">
                         <div className="prose prose-sm dark:prose-invert max-w-none space-y-2 text-gray-700 dark:text-gray-300 py-4 border-l-2 border-blue-500/30 pl-6 ml-3">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const featuresList = [
        "Manajemen data inti: Jenjang, Guru, Mapel, Ruangan, & Kelas.",
        "Generator jadwal otomatis untuk Reguler dan Ujian.",
        "Dukungan penjadwalan gabungan untuk semua jenjang sekaligus.",
        "Pengaturan hari libur global dan spesifik per jenjang.",
        "Kustomisasi slot waktu (jam pelajaran & istirahat) untuk setiap jenjang.",
        "Validasi konflik otomatis saat penjadwalan.",
        "Editor jadwal interaktif dengan fitur seret & lepas (drag & drop).",
        "Fitur 'Cari Guru Pengganti' yang cerdas.",
        "Dasbor analitik untuk visualisasi beban kerja guru dan utilisasi ruangan.",
        "Arsip jadwal dengan opsi cetak dan ekspor (HTML, CSV).",
        "Backup dan restore seluruh data aplikasi dalam satu klik.",
        "Dukungan PWA untuk fungsionalitas offline.",
        "Antarmuka responsif dengan tema terang dan gelap."
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400">{t('appName')}</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{t('appDescription')}</p>
                 <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-x-4 flex-wrap">
                    <span>
                        <span className="font-semibold">Pengembang:</span>{' '}
                        <a href="https://aiprojek01.my.id" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                           {t('developer')}
                        </a>
                    </span>
                    <span>&bull;</span>
                    <span>
                        <span className="font-semibold">{t('license')}:</span>{' '}
                        <a href="https://www.gnu.org/licenses/gpl-3.0.en.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                            GNU GPLv3
                        </a>
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a href="https://lynk.id/aiprojek/s/bvBJvdA" target="_blank" rel="noopener noreferrer" className="text-sm bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform transform hover:scale-105"><i className="bi bi-cup-hot-fill"></i> {t('donation')}</a>
                <a href="https://github.com/aiprojek/jadwalin" target="_blank" rel="noopener noreferrer" className="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform transform hover:scale-105"><i className="bi bi-github"></i> {t('sourceCode')}</a>
                <a href="https://t.me/aiprojek_community/32" target="_blank" rel="noopener noreferrer" className="text-sm bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform transform hover:scale-105"><i className="bi bi-telegram"></i> {t('joinDiscussion')}</a>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-4">{t('features')}</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 list-disc list-inside text-gray-700 dark:text-gray-300">
                    {featuresList.map((feature, index) => <li key={index}>{feature}</li>)}
                </ul>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-xl font-bold mb-2">{t('userGuide')}</h3>
                <CollapsibleSection title="Pendahuluan" id="guideIntro" icon="bi-lightbulb-fill">
                    <p>{t('guideIntro')}</p>
                </CollapsibleSection>
                <CollapsibleSection title={t('guideData')} id="guideData" icon="bi-database-fill-add">
                    <ul>
                        <li>{t('guideDataDetail1')}</li>
                        <li><b>{t('guideDataDetail2')}</b></li>
                        <li>{t('guideDataDetail3')}</li>
                        <li>{t('guideDataDetail4')}</li>
                    </ul>
                </CollapsibleSection>
                <CollapsibleSection title={t('guideGenerator')} id="guideGenerator" icon="bi-magic">
                     <ul>
                        <li>{t('guideGeneratorDetail1')}</li>
                        <li>{t('guideGeneratorDetail2')}</li>
                        <li>{t('guideGeneratorDetail3')}</li>
                        <li>{t('guideGeneratorDetail4')}</li>
                    </ul>
                </CollapsibleSection>
                 <CollapsibleSection title={t('guideInteraction')} id="guideInteraction" icon="bi-arrows-move">
                    <ul>
                        <li>{t('guideInteractionDetail1')}</li>
                        <li>{t('guideInteractionDetail2')}</li>
                        <li>{t('guideInteractionDetail3')}</li>
                    </ul>
                </CollapsibleSection>
                 <CollapsibleSection title={t('guideArchive')} id="guideArchive" icon="bi-archive-fill">
                    <ul>
                        <li>{t('guideArchiveDetail1')}</li>
                        <li>{t('guideArchiveDetail2')}</li>
                        <li>{t('guideArchiveDetail3')}</li>
                    </ul>
                </CollapsibleSection>
                 <CollapsibleSection title={t('guideSettings')} id="guideSettings" icon="bi-gear-wide-connected">
                    <ul>
                        <li>{t('guideSettingsDetail1')}</li>
                        <li>{t('guideSettingsDetail2')}</li>
                        <li><b>{t('guideSettingsDetail3')}</b></li>
                    </ul>
                </CollapsibleSection>
            </div>
        </div>
    );
};

const SubstituteFinderModal: React.FC<{
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
                                <span className="col-span-1 text-sm text-gray-500 dark:text-gray-400 text-center">
                                    {teacher.dailyHours} Jam Hari Ini
                                </span>
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

const ScheduleViewControls: React.FC<{
    viewContext: 'class' | 'teacher' | 'room', setViewContext: (v: 'class' | 'teacher' | 'room') => void,
    classViewMode: 'individual' | 'master', setClassViewMode: (v: 'individual' | 'master') => void,
    teacher: string, setTeacher: (v: string) => void,
    room: string, setRoom: (v: string) => void,
    isCompact: boolean, onToggleCompact: () => void,
    teachers: Teacher[],
    rooms: Room[],
    t: (key: TranslationKey, replacements?: Record<string, string>) => string;
}> = ({
    viewContext, setViewContext,
    classViewMode, setClassViewMode,
    teacher, setTeacher,
    room, setRoom,
    isCompact, onToggleCompact,
    teachers, rooms, t
}) => (
    <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 mb-4">
        <div className="flex rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
            {(['class', 'teacher', 'room'] as const).map(vc => (
                <button key={vc} onClick={() => setViewContext(vc)} className={`px-3 py-1 text-sm rounded-md transition-all flex items-center gap-1.5 ${viewContext === vc ? 'bg-white dark:bg-gray-800 shadow font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}>
                    {vc === 'class' && <i className="bi bi-grid-3x3-gap-fill"></i>}
                    {vc === 'teacher' && <i className="bi bi-person-fill"></i>}
                    {vc === 'room' && <i className="bi bi-door-closed-fill"></i>}
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
        {viewContext === 'teacher' && (
            <select value={teacher} onChange={e => setTeacher(e.target.value)} className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-sm px-3 py-2">
                <option value="">{t('selectTeacher')}</option>
                {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
        )}
         {viewContext === 'room' && (
            <select value={room} onChange={e => setRoom(e.target.value)} className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-sm px-3 py-2">
                <option value="">{t('selectRoom')}</option>
                {rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
        )}
        <Tooltip text={t('compactViewTooltip')}>
            <button
                onClick={onToggleCompact}
                className={`px-3 py-1 text-sm rounded-md transition-all flex items-center gap-1.5 ${isCompact ? 'bg-white dark:bg-gray-800 shadow font-semibold text-blue-600 dark:text-blue-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
                <i className={`bi ${isCompact ? 'bi-arrows-angle-expand' : 'bi-arrows-angle-contract'}`}></i>
                {t('compactView')}
            </button>
        </Tooltip>
    </div>
);

const ArchivedScheduleViewer: React.FC<{
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
    
    const effectiveDaysOff = globalDaysOff; // Simplified for archive view
    const displayDays = DAYS_OF_WEEK.filter(day => !effectiveDaysOff.includes(day));

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

                    <ScheduleViewControls
                        viewContext={viewContext} setViewContext={setViewContext}
                        classViewMode={classViewMode} setClassViewMode={setClassViewMode}
                        teacher={selectedTeacher} setTeacher={setSelectedTeacher}
                        room={selectedRoom} setRoom={setSelectedRoom}
                        isCompact={isCompact} onToggleCompact={() => setIsCompact(prev => !prev)}
                        teachers={teachers}
                        rooms={rooms}
                        t={t}
                    />

                    <div className="border-t dark:border-gray-700 pt-4">
                        <ScheduleHeader
                            institutionInfo={archive.institutionInfo}
                            academicYear={archive.academicYear}
                            scheduleType={archive.scheduleType}
                            selectedLevelName={archive.levelName}
                            viewContext={viewContext}
                            viewSubjectName={viewContext === 'teacher' ? selectedTeacher : selectedRoom}
                        />
                         {viewContext === 'class' ? (
                            classViewMode === 'individual' ? (
                                <ScheduleTable schedule={archive.schedule} filter={{ type: '', value: '' }} t={t} accentColor={archive.accentColor} globalDaysOff={effectiveDaysOff} levels={levels} classes={classes} timeSlotsForLevel={() => archive.timeSlots} onEntryClick={onEntryClick} droppableState={droppableState} isCompactView={isCompact} />
                            ) : (
                                <MasterScheduleTable schedule={archive.schedule} t={t} accentColor={archive.accentColor} globalDaysOff={effectiveDaysOff} levels={levels} classes={classes} timeSlots={archive.timeSlots} onEntryClick={onEntryClick} droppableState={droppableState} isCompactView={isCompact} />
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
    
    // Settings state - Initialized from localStorage using a lazy initializer function.
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
            // Deep merge to ensure new properties from defaults are included.
            return {
                ...defaults,
                ...(savedPrint || {}),
                margin: {
                    ...defaults.margin,
                    ...(savedPrint?.margin || {})
                }
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
    const [droppableState, setDroppableState] = useState({ overId: null, isValid: false, conflictMessage: '' });

    // PWA Service Worker Registration
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/service-worker.js')
                    .then(registration => {
                        console.log('Jadwalin PWA ServiceWorker registration successful with scope: ', registration.scope);
                    })
                    .catch(error => {
                        console.log('Jadwalin PWA ServiceWorker registration failed: ', error);
                    });
            });
        }
    }, []);


    const showToast = (message: string, type: ToastType = 'success') => {
        setToast({ message, type, isVisible: true });
    };

    // Load data (non-settings) and archives from localStorage on mount
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
            const migratedLevels = (data.levels || []).map((level: any) => {
                // Migration logic: if timeSlots is an array (old format), convert it.
                if (Array.isArray(level.timeSlots)) {
                    return { ...level, timeSlots: { regular: level.timeSlots, exam: defaultExamTimeSlots } };
                }
                // Ensure both regular and exam slots exist
                return {
                    ...level,
                    timeSlots: {
                        regular: level.timeSlots?.regular || defaultRegularTimeSlots,
                        exam: level.timeSlots?.exam || defaultExamTimeSlots
                    }
                };
            });
            setLevels(migratedLevels);
            setSubjects(data.subjects || []);
            setTeachers(data.teachers || []);
            setRooms(data.rooms || []);
            setClasses(data.classes || []);
            if (migratedLevels.length > 0) setSelectedLevel(migratedLevels[0].id);
        } else {
             // Dummy Data for first time users
            const initialLevels: EducationLevel[] = [{ id: 'level-1', name: 'SMP', timeSlots: defaultTimeSlots, daysOff: ['Saturday', 'Sunday'] }, { id: 'level-2', name: 'SMA', timeSlots: defaultTimeSlots, daysOff: ['Saturday', 'Sunday'] }];
            const initialSubjects: Subject[] = [{ id: 'subj-1', name: 'Matematika', levelId: 'level-1' }, { id: 'subj-2', name: 'IPA', levelId: 'level-1' }, { id: 'subj-3', name: 'Fisika', levelId: 'level-2' }, { id: 'subj-4', name: 'Kimia', levelId: 'level-2' }];
            const initialTeachers: Teacher[] = [{ id: 'teach-1', name: 'Budi', availableDays: ['Monday', 'Wednesday', 'Friday'], canTeachSubjects: ['subj-1', 'subj-2'], canTeachInLevels: ['level-1'] }, { id: 'teach-2', name: 'Ani', availableDays: ['Tuesday', 'Thursday'], canTeachSubjects: ['subj-3', 'subj-4'], canTeachInLevels: ['level-2'] }, { id: 'teach-3', name: 'Candra', availableDays: ['Monday', 'Tuesday', 'Wednesday'], canTeachSubjects: ['subj-1', 'subj-3'], canTeachInLevels: ['level-1', 'level-2'] }];
            const initialRooms: Room[] = [{ id: 'room-1', name: 'Ruang 101', levelIds: ['level-1', 'level-2'] }, { id: 'room-2', name: 'Lab IPA', levelIds: ['level-1'] }, { id: 'room-3', name: 'Lab Fisika', levelIds: ['level-2'] }];
            const initialClasses: Class[] = [{ id: 'class-1', name: 'Kelas 7A', levelId: 'level-1', subjects: [{ subjectId: 'subj-1', hoursPerWeek: 3, teacherId: 'teach-1', requiresRoom: true }, { subjectId: 'subj-2', hoursPerWeek: 2, teacherId: 'teach-1', requiresRoom: true }] }, { id: 'class-2', name: 'Kelas 10A', levelId: 'level-2', subjects: [{ subjectId: 'subj-3', hoursPerWeek: 3, teacherId: 'teach-2' }, { subjectId: 'subj-4', hoursPerWeek: 2, teacherId: 'teach-2' }] }];
            setLevels(initialLevels); setSubjects(initialSubjects); setTeachers(initialTeachers); setRooms(initialRooms); setClasses(initialClasses);
            if (initialLevels.length > 0) setSelectedLevel(initialLevels[0].id);
        }
        
        const savedArchives = localStorage.getItem('jadwalin_archives');
        if (savedArchives) {
            setArchives(JSON.parse(savedArchives));
        }

    }, []);
    
    // Save data to localStorage
    useEffect(() => {
        const dataToSave = { levels, subjects, teachers, rooms, classes };
        localStorage.setItem('jadwalin_data', JSON.stringify(dataToSave));
    }, [levels, subjects, teachers, rooms, classes]);

    // Save archives to localStorage
    useEffect(() => {
        localStorage.setItem('jadwalin_archives', JSON.stringify(archives));
    }, [archives]);
    
    // Effect to set default teacher/room for view
    useEffect(() => {
        if (scheduleViewContext === 'teacher' && teachers.length > 0 && !selectedTeacherForView) {
            setSelectedTeacherForView(teachers[0].name);
        }
        if (scheduleViewContext === 'room' && rooms.length > 0 && !selectedRoomForView) {
            setSelectedRoomForView(rooms[0].name);
        }
    }, [scheduleViewContext, teachers, rooms, selectedTeacherForView, selectedRoomForView]);


    const handleGenerateSchedule = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setIsAllLevelsSchedule(false);
        setScheduleViewContext('class'); // Reset views
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
        
        const isConflictError = (res: Schedule | GeminiError): res is GeminiError => {
            return !!res && typeof res === 'object' && 'conflicts' in res && Array.isArray((res as GeminiError).conflicts);
        }

        if (isConflictError(result)) {
            setError(result.conflicts);
        } else {
            const newSchedule = result;
            setGeneratedVariants(prev => [...prev, newSchedule]);
            setActiveVariantIndex(generatedVariants.length); // Switch to the newly generated variant
        }

        setIsLoading(false);
    }, [teachers, subjects, rooms, classes, scheduleType, selectedLevel, t, levels, generatedVariants.length, globalDaysOff]);

    const handleGenerateAllLevelsSchedule = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setIsAllLevelsSchedule(true);
        setScheduleViewContext('class'); // Reset views
        setClassScheduleViewMode('individual');
        setSelectedTeacherForView('');
        setSelectedRoomForView('');

        if (teachers.length === 0 || subjects.length === 0 || rooms.length === 0 || classes.length === 0) {
            setError([t('addErrorAllLevels')]);
            setIsLoading(false);
            return;
        }

        const result = await generateLocalSchedule(teachers, subjects, rooms, classes, scheduleType, t, levels, globalDaysOff);
        
        const isConflictError = (res: Schedule | GeminiError): res is GeminiError => {
            return !!res && typeof res === 'object' && 'conflicts' in res && Array.isArray((res as GeminiError).conflicts);
        }

        if (isConflictError(result)) {
            setError(result.conflicts);
        } else {
            const newSchedule = result;
            setGeneratedVariants(prev => [...prev, newSchedule]);
            setActiveVariantIndex(generatedVariants.length); // Switch to the newly generated variant
        }

        setIsLoading(false);
    }, [teachers, subjects, rooms, classes, scheduleType, t, levels, generatedVariants.length, globalDaysOff]);


    const handleSaveToArchive = () => {
        if (generatedVariants.length === 0) return;

        const scheduleToArchive = generatedVariants[activeVariantIndex];
        const currentLevel = levels.find(l => l.id === selectedLevel);
        
        // For 'All Levels', we need to bundle a union of all relevant time slots
        const getTimeSlotsForArchive = () => {
            if (isAllLevelsSchedule) {
                const schedule = generatedVariants[activeVariantIndex];
                const levelIdsInSchedule = new Set(Object.keys(schedule).map(cn => classes.find(c => c.name === cn)?.levelId).filter((id): id is string => !!id));

                const unionSlots: TimeSlot[] = [];
                levels.forEach(level => {
                    if (levelIdsInSchedule.has(level.id)) {
                        const slots = scheduleType === 'Regular' ? level.timeSlots.regular : level.timeSlots.exam;
                        slots.forEach(slot => {
                            if (!unionSlots.some(s => s.label === slot.label && s.type === slot.type)) {
                                unionSlots.push(slot);
                            }
                        });
                    }
                });
                return unionSlots.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
            } else {
                return scheduleType === 'Regular' ? currentLevel?.timeSlots.regular : currentLevel?.timeSlots.exam;
            }
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
            const defaultRegularTimeSlots: TimeSlot[] = [{ id: 'ts-reg-1', type: 'period', startTime: '07:30', endTime: '08:15', label: '07:30 - 08:15' }];
            const defaultExamTimeSlots: TimeSlot[] = [{ id: 'ts-exam-1', type: 'period', startTime: '08:00', endTime: '10:00', label: '08:00 - 10:00' }];
            const newLevel: EducationLevel = { id: `level-${Date.now()}`, name: data.name, daysOff: data.daysOff, timeSlots: { regular: defaultRegularTimeSlots, exam: defaultExamTimeSlots } };
            setLevels(prev => [...prev, newLevel]);
        }
        closeAllModals();
    };


    const handleSaveSubject = (data: Omit<Subject, 'id'> | Subject) => {
        if ('id' in data) {
            setSubjects(prev => prev.map(s => s.id === data.id ? data as Subject : s));
        } else {
            const newSubject = { id: `subj-${Date.now()}`, ...data };
            setSubjects(prev => [...prev, newSubject]);
        }
        closeAllModals();
    };
    
    const handleSaveRoom = (data: Omit<Room, 'id'> | Room) => {
        if ('id' in data) {
            setRooms(prev => prev.map(r => r.id === data.id ? data as Room : r));
        } else {
            const newRoom = { id: `room-${Date.now()}`, ...data };
            setRooms(prev => [...prev, newRoom]);
        }
        closeAllModals();
    };
    
    const handleSaveTeacher = (data: Omit<Teacher, 'id'> | Teacher) => {
        if ('id' in data) {
            setTeachers(prev => prev.map(t => t.id === data.id ? data as Teacher : t));
        } else {
            const newTeacher = { id: `teach-${Date.now()}`, ...data };
            setTeachers(prev => [...prev, newTeacher]);
        }
        closeAllModals();
    };
    
    const handleSaveClass = (data: Omit<Class, 'id'> | Class) => {
        if ('id' in data) {
            setClasses(prev => prev.map(c => c.id === data.id ? data as Class : c));
        } else {
            const newClass = { id: `class-${Date.now()}`, ...data };
            setClasses(prev => [...prev, newClass]);
        }
        closeAllModals();
    };

    const handleUpdateTimeSlotsForLevel = (newTimeSlots: {regular: TimeSlot[], exam: TimeSlot[]}) => {
        if (!editingLevel) return;
        setLevels(prevLevels => prevLevels.map(level => 
            level.id === editingLevel.id ? { ...level, timeSlots: newTimeSlots } : level
        ));
    };


    // --- ARCHIVE & EXPORT FUNCTIONS ---
    
    const getTimeSlotsForLevelFromArchive = useCallback((archiveItem: ArchivedSchedule, levelId: string) => {
        const level = levels.find(l => l.id === levelId);
        if (!level) return []; // Fallback
        return archiveItem.scheduleType === 'Regular' ? level.timeSlots.regular : level.timeSlots.exam;
    }, [levels]);

    const getScheduleContentAsHTML = useCallback(async (archiveItem: ArchivedSchedule, forceLightTheme: boolean, viewContext: 'class' | 'teacher' | 'room', viewContextSubject: string, classViewMode: 'individual' | 'master', isCompact: boolean) => {
        const tempDiv = document.createElement('div');
        const root = ReactDOM.createRoot(tempDiv);
        const showHeader = archiveItem.printSettings?.showHeader ?? true;
        
        const effectiveDaysOff = globalDaysOff; // Simplified for export, could be enhanced
        const displayDays = DAYS_OF_WEEK.filter(day => !effectiveDaysOff.includes(day));

        let scheduleComponent;
        
        const onEntryClickStub = () => {}; // Stub function for non-interactive export

        if (viewContext === 'teacher') {
            scheduleComponent = <TeacherScheduleTable schedule={archiveItem.schedule} teacherName={viewContextSubject} t={t} accentColor={archiveItem.accentColor} timeSlots={archiveItem.timeSlots} displayDays={displayDays} onEntryClick={onEntryClickStub} droppableState={{}} isCompactView={isCompact} />;
        } else if (viewContext === 'room') {
            scheduleComponent = <RoomScheduleTable schedule={archiveItem.schedule} roomName={viewContextSubject} t={t} accentColor={archiveItem.accentColor} timeSlots={archiveItem.timeSlots} displayDays={displayDays} onEntryClick={onEntryClickStub} droppableState={{}} isCompactView={isCompact} />;
        } else if (classViewMode === 'master') {
             scheduleComponent = <MasterScheduleTable schedule={archiveItem.schedule} t={t} accentColor={archiveItem.accentColor} globalDaysOff={globalDaysOff} levels={levels} classes={classes} timeSlots={archiveItem.timeSlots} onEntryClick={onEntryClickStub} droppableState={{}} isCompactView={isCompact} />;
        } else {
            scheduleComponent = <ScheduleTable schedule={archiveItem.schedule} filter={{ type: '', value: '' }} t={t} accentColor={archiveItem.accentColor} globalDaysOff={globalDaysOff} levels={levels} classes={classes} onEntryClick={onEntryClickStub} droppableState={{}} isCompactView={isCompact} />;
        }

        const finalComponent = (
             <React.StrictMode>
                <div style={{'--accent-color': archiveItem.accentColor} as React.CSSProperties}>
                    {showHeader && <ScheduleHeader {...archiveItem} selectedLevelName={archiveItem.levelName} viewContext={viewContext} viewSubjectName={viewContextSubject} />}
                    {scheduleComponent}
                </div>
            </React.StrictMode>
        );

        if (forceLightTheme) {
            root.render(<div className="light">{finalComponent}</div>);
        } else {
            root.render(finalComponent);
        }
        
        return new Promise<string>(resolve => {
            setTimeout(() => resolve(tempDiv.innerHTML), 100);
        });
    }, [t, globalDaysOff, levels, classes]);
    
    const generateDetailedFilename = (archiveItem: ArchivedSchedule) => {
        const sanitizedYear = (archiveItem.academicYear.masehi || '').replace(/[\\/]/g, '-') || 'TA-Tidak-Diatur';
        const now = new Date();
        const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        return `Jadwalin_${archiveItem.levelName.replace(/\s+/g, '-')}_${archiveItem.scheduleType}_${sanitizedYear}_${timestamp}`;
    };

    const handleExportHTML = async (archiveItem: ArchivedSchedule, viewContext: 'class' | 'teacher' | 'room', viewContextSubject: string, classViewMode: 'individual' | 'master', isCompact: boolean) => {
        const scheduleHTML = await getScheduleContentAsHTML(archiveItem, true, viewContext, viewContextSubject, classViewMode, isCompact);
        const currentPrintSettings = archiveItem.printSettings || printSettings;
        const styles = getExportStyles(currentPrintSettings);
        const fullHTML = `
            <!DOCTYPE html><html lang="${language}"><head><meta charset="UTF-8"><title>${t('exportedScheduleTitle')}</title><style>${styles}</style></head>
            <body class="bg-white p-8"><main>${scheduleHTML}</main></body></html>`;

        const blob = new Blob([fullHTML], { type: 'text/html' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${generateDetailedFilename(archiveItem)}.html`;
        link.click();
        URL.revokeObjectURL(link.href);
    };
    
    const handleExportCSV = (archiveItem: ArchivedSchedule) => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Kelas,Hari,Waktu,Mata Pelajaran,Guru,Ruangan\n";
        
        for (const className in archiveItem.schedule) {
            const classInfo = classes.find(c => c.name === className);
            const levelInfo = levels.find(l => l.id === classInfo?.levelId);
            const effectiveDaysOff = (levelInfo?.daysOff && levelInfo.daysOff.length > 0) ? levelInfo.daysOff : globalDaysOff;
            const workingDays = DAYS_OF_WEEK.filter(day => !effectiveDaysOff.includes(day));

            for (const day of workingDays) {
                if (archiveItem.schedule[className][day]) {
                     for (const timeSlot in archiveItem.schedule[className][day]) {
                        const entry = archiveItem.schedule[className][day]![timeSlot];
                        csvContent += `"${className}","${t(day as TranslationKey)}","${timeSlot}","${entry.subjectName}","${entry.teacherName}","${entry.roomName}"\n`;
                    }
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
        const currentPrintSettings = archiveItem.printSettings || printSettings;
        const styles = getExportStyles(currentPrintSettings);
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html lang="${language}" class="${localStorage.getItem('theme') || 'light'}">
                <head>
                    <title>${t('print')} - ${archiveItem.levelName}</title>
                    <style>${styles}</style>
                </head>
                <body>${scheduleHTML}</body>
                </html>
            `);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 250); // Delay to ensure styles are applied
        }
    };

    // --- SETTINGS FUNCTIONS ---
    const handleSaveSettings = () => {
        const settingsToSave = { institutionInfo, academicYear, printSettings, globalDaysOff, workloadWarningThreshold };
        localStorage.setItem('jadwalin_settings', JSON.stringify(settingsToSave));
        showToast(t('settingsSaved'), 'success');
        closeAllModals();
    };

    const handleInstInfoChange = (index: number, field: keyof InstitutionInfoItem, value: string | boolean) => {
        const newInfo = institutionInfo.map((item, i) => {
            if (i === index) {
                return { ...item, [field]: value };
            }
            return item;
        });
        setInstitutionInfo(newInfo);
    };

    const addInstInfoItem = () => {
        setInstitutionInfo(prev => [...prev, { id: `inst-${Date.now()}`, label: '', value: '', showInHeader: true }]);
    };
    const removeInstInfoItem = (index: number) => {
        setInstitutionInfo(prev => prev.filter((_, i) => i !== index));
    };

    
    const handleBackup = () => {
        const dataToBackup = {
            version: "2.2", // versioning for future migrations
            settings: { institutionInfo, academicYear, printSettings, globalDaysOff, workloadWarningThreshold },
            data: { levels, subjects, teachers, rooms, classes },
            archives
        };
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
        if (!file) return;

        if (!window.confirm(t('restoreConfirm'))) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result;
                if (typeof result === 'string') {
                    const restored = JSON.parse(result);
                    if (restored.version && restored.data && restored.data.levels) {
                        const restoredSettings = restored.settings || {};
                        if (restoredSettings.institutionInfo && Array.isArray(restoredSettings.institutionInfo)) {
                             setInstitutionInfo(restoredSettings.institutionInfo);
                        }
                        setAcademicYear(restoredSettings.academicYear || getDefaultAcademicYear());
                        setPrintSettings(restoredSettings.printSettings || getDefaultPrintSettings());
                        setGlobalDaysOff(restoredSettings.globalDaysOff || getDefaultGlobalDaysOff());
                        const threshold = restoredSettings.workloadWarningThreshold;
                        setWorkloadWarningThreshold(typeof threshold === 'number' ? threshold : getDefaultWorkloadWarningThreshold());

                        setLevels(restored.data.levels || []);
                        setSubjects(restored.data.subjects || []);
                        setTeachers(restored.data.teachers || []);
                        setRooms(restored.data.rooms || []);
                        setClasses(restored.data.classes || []);
                        setArchives(restored.archives || []);
                        showToast(t('restoreSuccess'), 'success');
                        setActiveTab('dashboard');
                    } else {
                        throw new Error("Invalid file structure");
                    }
                }
            } catch (error) {
                console.error("Restore failed:", error);
                showToast(t('restoreError'), 'error');
            } finally {
                if(restoreInputRef.current) restoreInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };

    // --- SUBSTITUTE TEACHER LOGIC ---

    const handleOpenSubstituteFinder = (context: SubstituteFinderContext) => {
        const { day, timeSlot, entry } = context;
        const currentSchedule = viewingArchive ? viewingArchive.schedule : generatedVariants[activeVariantIndex];

        if (!currentSchedule) return;

        const subject = subjects.find(s => s.name === entry.subjectName);
        const originalTeacher = teachers.find(t => t.name === entry.teacherName);

        if (!subject || !originalTeacher) return;

        const busyTeacherNames = new Set<string>();
        for (const className in currentSchedule) {
            const daySchedule = currentSchedule[className]?.[day];
            const scheduleEntry = daySchedule?.[timeSlot];
            if (scheduleEntry) {
                busyTeacherNames.add(scheduleEntry.teacherName);
            }
        }
        
        const calculateDailyHours = (teacherName: string, day: Day, schedule: Schedule) => {
            let hours = 0;
            for (const className in schedule) {
                const daySchedule = schedule[className]?.[day];
                if (daySchedule) {
                    for (const slot in daySchedule) {
                        if (daySchedule[slot].teacherName === teacherName) {
                            hours++;
                        }
                    }
                }
            }
            return hours;
        };


        const candidates = teachers
            .filter(t =>
                t.id !== originalTeacher.id &&
                t.canTeachSubjects.includes(subject.id) &&
                t.availableDays.includes(day) &&
                !busyTeacherNames.has(t.name)
            )
            .map(teacher => ({
                ...teacher,
                dailyHours: calculateDailyHours(teacher.name, day, currentSchedule)
            }));
            
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
    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragData(event.active.data.current as DragData);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over || !active.data.current) {
            setDroppableState({ overId: null, isValid: false, conflictMessage: '' });
            return;
        }

        const draggedData = active.data.current as DragData;
        const [targetClassName, targetDay, targetTimeSlot] = String(over.id).split('-') as [string, Day, string];

        // This is the core validation logic
        const currentSchedule = viewingArchive ? viewingArchive.schedule : generatedVariants[activeVariantIndex];
        const teacher = teachers.find(t => t.name === draggedData.entry.teacherName);
        
        let conflictMsg = '';

        if (teacher) {
            // 1. Teacher day availability
            if (!teacher.availableDays.includes(targetDay)) {
                conflictMsg = t('dragConflictTeacherUnavailable', { teacherName: teacher.name, day: t(targetDay) });
            }
            // 2. Teacher is busy check
            else {
                for (const className in currentSchedule) {
                    const entry = currentSchedule[className]?.[targetDay]?.[targetTimeSlot];
                    if (entry && entry.teacherName === teacher.name && className !== targetClassName) {
                        conflictMsg = t('dragConflictTeacherBusy', { teacherName: teacher.name });
                        break;
                    }
                }
            }
        }
        // 3. Room is busy check
        if (!conflictMsg && draggedData.entry.roomName !== t('noRoom')) {
            for (const className in currentSchedule) {
                 const entry = currentSchedule[className]?.[targetDay]?.[targetTimeSlot];
                 if (entry && entry.roomName === draggedData.entry.roomName) {
                     conflictMsg = t('dragConflictRoomBusy', { roomName: entry.roomName });
                     break;
                 }
            }
        }

        setDroppableState({
            overId: over.id,
            isValid: !conflictMsg,
            conflictMessage: conflictMsg,
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragData(null);
        setDroppableState({ overId: null, isValid: false, conflictMessage: '' });

        if (over && active.id !== over.id && droppableState.isValid) {
            const draggedData = active.data.current as DragData;
            const { from } = draggedData;
            const [toClassName, toDay, toTimeSlot] = String(over.id).split('-') as [string, Day, string];
            
            const updateFn = (prevSchedule: Schedule) => {
                const newSchedule = JSON.parse(JSON.stringify(prevSchedule));
                const entryToMove = newSchedule[from.className]?.[from.day]?.[from.timeSlot];
                if (entryToMove) {
                    // Check if target slot is occupied. If so, swap. For now, we only allow drop on empty.
                    if (newSchedule[toClassName]?.[toDay]?.[toTimeSlot]) {
                        // Advanced: Implement swap logic here if desired.
                        return prevSchedule; // Or show a toast message
                    }
                    
                    delete newSchedule[from.className][from.day][from.timeSlot];
                    if (Object.keys(newSchedule[from.className][from.day]).length === 0) {
                        delete newSchedule[from.className][from.day];
                    }
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
    };


    const timeSlotsForCurrentSchedule = useMemo(() => {
        if (generatedVariants.length === 0 || !generatedVariants[activeVariantIndex]) return [];

        if (isAllLevelsSchedule) {
            const schedule = generatedVariants[activeVariantIndex];
            const levelIdsInSchedule = new Set(Object.keys(schedule)
                .map(cn => classes.find(c => c.name === cn)?.levelId)
                .filter((id): id is string => !!id)
            );
            
            const unionSlots: TimeSlot[] = [];
            levels.forEach(level => {
                if (levelIdsInSchedule.has(level.id)) {
                    const slots = scheduleType === 'Regular' ? level.timeSlots.regular : level.timeSlots.exam;
                    slots.forEach(slot => {
                        if (!unionSlots.some(s => s.label === slot.label && s.type === slot.type)) {
                            unionSlots.push(slot);
                        }
                    });
                }
            });
            return unionSlots.sort((a, b) => (a.startTime || '00:00').localeCompare(b.startTime || '00:00'));
        } else {
            const level = levels.find(l => l.id === selectedLevel);
            if (!level) return [];
            return scheduleType === 'Regular' ? level.timeSlots.regular : level.timeSlots.exam;
        }
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


    // UI Rendering
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="sticky top-0 z-30 bg-gray-100 dark:bg-gray-900 shadow-sm">
                <Header t={t} language={language} setLanguage={setLanguage} onSettingsClick={() => setActiveTab('settings')} onHelpClick={() => setActiveTab('help')} theme={theme} setTheme={setTheme} />
                
                <div className="px-4 sm:px-6">
                    <div className="flex flex-nowrap overflow-x-auto no-scrollbar border-b border-gray-300 dark:border-gray-700">
                        {Object.entries(mainTabs).map(([key, { label, icon }]) => (
                            <button key={key} onClick={() => setActiveTab(key as any)} className={`px-4 py-2 text-sm font-medium border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === key ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                               <i className={`bi ${icon}`} aria-hidden="true"></i>
                               <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'data' && (
                     <div className="px-4 sm:px-6 bg-gray-100 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700">
                        <div className="flex flex-nowrap overflow-x-auto no-scrollbar">
                             {Object.entries(dataSubTabs).map(([key, { label, icon }]) => (
                                <button key={key} onClick={() => setActiveDataTab(key)} className={`px-4 py-2 text-sm font-medium flex items-center gap-2 whitespace-nowrap ${activeDataTab === key ? 'bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-t-lg' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>
                                    <i className={`bi ${icon}`} aria-hidden="true"></i>
                                    <span>{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <main className="p-4 sm:p-6">
                {/* --- Dashboard Tab --- */}
                {activeTab === 'dashboard' && <Dashboard teachers={teachers} subjects={subjects} rooms={rooms} classes={classes} levels={levels} archives={archives} globalDaysOff={globalDaysOff} t={t} theme={theme} />}

                {/* --- Data Management Tab --- */}
                {activeTab === 'data' && (
                    <div className="space-y-6">
                        {activeDataTab === 'levels' && (
                            <DataCard title={t('levels')} onAdd={() => { setEditingData(null); setModalContent('level'); }} addTooltipText={t('addLevelTitle')}>
                                {levels.map(level => <DataItem key={level.id} onDelete={() => removeDataItem(setLevels, level.id)} onEdit={() => { setEditingData(level); setModalContent('level');}} onEditTimeSlots={() => setEditingLevel(level)} t={t}>{level.name}</DataItem>)}
                            </DataCard>
                        )}
                         {activeDataTab === 'subjects' && (
                            <DataCard title={t('subjects')} onAdd={() => { setEditingData(null); setModalContent('subject'); }} addTooltipText={t('addSubjectTitle')}>
                                {subjects.map(subject => <DataItem key={subject.id} onDelete={() => removeDataItem(setSubjects, subject.id)} onEdit={() => { setEditingData(subject); setModalContent('subject');}} t={t}>{subject.name} <span className="text-xs text-gray-500">({levels.find(l => l.id === subject.levelId)?.name})</span></DataItem>)}
                            </DataCard>
                        )}
                         {activeDataTab === 'rooms' && (
                            <DataCard title={t('rooms')} onAdd={() => { setEditingData(null); setModalContent('room'); }} addTooltipText={t('addRoomTitle')}>
                                {rooms.map(room => <DataItem key={room.id} onDelete={() => removeDataItem(setRooms, room.id)} onEdit={() => { setEditingData(room); setModalContent('room');}} t={t}>{room.name}</DataItem>)}
                            </DataCard>
                        )}
                        {activeDataTab === 'teachers' && (
                            <DataCard title={t('teachers')} onAdd={() => { setEditingData(null); setModalContent('teacher'); }} addTooltipText={t('addTeacher')}>
                                {teachers.map(teacher => <DataItem key={teacher.id} onDelete={() => removeDataItem(setTeachers, teacher.id)} onEdit={() => { setEditingData(teacher); setModalContent('teacher');}} t={t}>{teacher.name}</DataItem>)}
                            </DataCard>
                        )}
                        {activeDataTab === 'classes' && (
                            <DataCard title={t('classes')} onAdd={() => { setEditingData(null); setModalContent('class'); }} addTooltipText={t('addClass')}>
                                {classes.map(cls => <DataItem key={cls.id} onDelete={() => removeDataItem(setClasses, cls.id)} onEdit={() => { setEditingData(cls); setModalContent('class');}} t={t}>{cls.name} <span className="text-xs text-gray-500">({levels.find(l => l.id === cls.levelId)?.name})</span></DataItem>)}
                            </DataCard>
                        )}
                    </div>
                )}
                
                {/* --- Schedule Generator Tab --- */}
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
                                    <button onClick={handleGenerateSchedule} disabled={isLoading || !selectedLevel} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                        {!isLoading && <i className="bi bi-magic"></i>}
                                        {isLoading ? t('generating') : t('generateButton', {scheduleType: ''})}
                                    </button>
                                     <Tooltip text="Tombol ini akan aktif jika ada setidaknya satu kelas yang telah didefinisikan di seluruh jenjang. Pemilihan jenjang pada dropdown akan diabaikan saat tombol ini diklik.">
                                        <button onClick={handleGenerateAllLevelsSchedule} disabled={isLoading || classes.length === 0} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                            {!isLoading && <i className="bi bi-diagram-3-fill"></i>}
                                            {isLoading ? t('generating') : t('generateAllLevels')}
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-100 dark:bg-red-800/50 border-l-4 border-red-500 text-red-700 dark:text-red-200 p-4 rounded-lg" role="alert">
                                <p className="font-bold">{t('generationErrorTitle')}</p>
                                <ul className="mt-2 list-disc list-inside text-sm">
                                    {error.map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                            </div>
                        )}
                        
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
                                            <button key={index} onClick={() => setActiveVariantIndex(index)} className={`px-3 py-1 text-sm rounded-full ${activeVariantIndex === index ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                                {t('variant')} {index + 1}
                                            </button>
                                        ))}
                                        <button onClick={isAllLevelsSchedule ? handleGenerateAllLevelsSchedule : handleGenerateSchedule} disabled={isLoading} className="px-3 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/50 disabled:opacity-50 flex items-center gap-1.5">
                                            <i className="bi bi-arrow-repeat"></i> {t('generateNewVariant')}
                                        </button>
                                    </div>
                                    <ScheduleViewControls
                                        viewContext={scheduleViewContext} setViewContext={setScheduleViewContext}
                                        classViewMode={classScheduleViewMode} setClassViewMode={setClassScheduleViewMode}
                                        teacher={selectedTeacherForView} setTeacher={setSelectedTeacherForView}
                                        room={selectedRoomForView} setRoom={setSelectedRoomForView}
                                        isCompact={isCompactView} onToggleCompact={() => setIsCompactView(prev => !prev)}
                                        teachers={teachers}
                                        rooms={rooms}
                                        t={t}
                                    />
                                    <div className={`flex flex-wrap items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg transition-opacity ${scheduleViewContext !== 'class' || classScheduleViewMode !== 'individual' ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('filterBy')}</h4>
                                        <select onChange={e => setFilter({ type: e.target.value, value: '' })} value={filter.type} className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-sm px-3 py-2.5">
                                            <option value="class">{t('class')}</option>
                                            <option value="teacher">{t('teacher')}</option>
                                            <option value="room">{t('room')}</option>
                                        </select>
                                        {filter.type === 'class' && (
                                            <select onChange={e => setFilter({ ...filter, value: e.target.value })} value={filter.value} className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-sm px-3 py-2.5">
                                                <option value="">{t('all')}</option>
                                                {Object.keys(generatedVariants[activeVariantIndex]).sort().map(name => <option key={name} value={name}>{name}</option>)}
                                            </select>
                                        )}
                                        {filter.type === 'teacher' && (
                                             <select onChange={e => setFilter({ ...filter, value: e.target.value })} value={filter.value} className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-sm px-3 py-2.5">
                                                <option value="">{t('all')}</option>
                                                {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                            </select>
                                        )}
                                        {filter.type === 'room' && (
                                            <select onChange={e => setFilter({ ...filter, value: e.target.value })} value={filter.value} className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm text-sm px-3 py-2.5">
                                                <option value="">{t('all')}</option>
                                                {rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                            </select>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                         {scheduleViewContext === 'class' ? (
                                            classScheduleViewMode === 'individual' ? (
                                                <ScheduleTable
                                                    schedule={generatedVariants[activeVariantIndex]}
                                                    filter={filter}
                                                    t={t}
                                                    accentColor={selectedAccentColor}
                                                    globalDaysOff={globalDaysOff}
                                                    levels={levels}
                                                    classes={classes}
                                                    onEntryClick={handleOpenSubstituteFinder}
                                                    droppableState={droppableState}
                                                    isCompactView={isCompactView}
                                                    timeSlotsForLevel={isAllLevelsSchedule 
                                                        ? (levelId) => {
                                                            const level = levels.find(l => l.id === levelId);
                                                            if (!level) return [];
                                                            return scheduleType === 'Regular' ? level.timeSlots.regular : level.timeSlots.exam;
                                                        } 
                                                        : () => timeSlotsForCurrentSchedule
                                                    }
                                                />
                                            ) : (
                                                <MasterScheduleTable
                                                    schedule={generatedVariants[activeVariantIndex]}
                                                    t={t}
                                                    accentColor={selectedAccentColor}
                                                    globalDaysOff={globalDaysOff}
                                                    levels={levels}
                                                    classes={classes}
                                                    timeSlots={timeSlotsForCurrentSchedule}
                                                    onEntryClick={handleOpenSubstituteFinder}
                                                    droppableState={droppableState}
                                                    isCompactView={isCompactView}
                                                />
                                            )
                                        ) : scheduleViewContext === 'teacher' ? (
                                            <TeacherScheduleTable 
                                                schedule={generatedVariants[activeVariantIndex]}
                                                teacherName={selectedTeacherForView}
                                                timeSlots={timeSlotsForCurrentSchedule}
                                                displayDays={DAYS_OF_WEEK.filter(day => !globalDaysOff.includes(day))}
                                                t={t}
                                                accentColor={selectedAccentColor}
                                                onEntryClick={handleOpenSubstituteFinder}
                                                droppableState={droppableState}
                                                isCompactView={isCompactView}
                                            />
                                        ) : (
                                             <RoomScheduleTable 
                                                schedule={generatedVariants[activeVariantIndex]}
                                                roomName={selectedRoomForView}
                                                timeSlots={timeSlotsForCurrentSchedule}
                                                displayDays={DAYS_OF_WEEK.filter(day => !globalDaysOff.includes(day))}
                                                t={t}
                                                accentColor={selectedAccentColor}
                                                onEntryClick={handleOpenSubstituteFinder}
                                                droppableState={droppableState}
                                                isCompactView={isCompactView}
                                            />
                                        )}
                                    </div>
                                </div>
                            </DndContext>
                        )}
                    </div>
                )}
                
                {/* --- Archive Tab --- */}
                {activeTab === 'archive' && (
                     <div className="space-y-4">
                        {archives.length === 0 ? (
                            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
                                <i className="bi bi-archive text-5xl text-gray-300 dark:text-gray-600"></i>
                                <h3 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-200">{t('archiveEmpty')}</h3>
                                <p className="mt-1 text-gray-500 dark:text-gray-400">{t('archiveEmptyDesc')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {archives.map(archive => (
                                    <div key={archive.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex flex-col justify-between" style={{ borderLeft: `5px solid ${archive.accentColor}` }}>
                                        <div>
                                            <p className="font-bold text-lg text-gray-800 dark:text-gray-200">{archive.levelName}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{t(archive.scheduleType as 'regular' | 'exam')}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('archivedOn')}: {new Date(archive.date).toLocaleString(language)}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t dark:border-gray-700">
                                            <button onClick={() => setViewingArchive(archive)} className="text-sm bg-blue-100 dark:bg-blue-800/50 hover:bg-blue-200 dark:hover:bg-blue-700/70 text-blue-700 dark:text-blue-200 font-semibold py-1 px-2 rounded-md flex-grow flex items-center justify-center gap-1.5"><i className="bi bi-eye-fill"></i> {t('viewSchedule')}</button>
                                            <button onClick={() => { if(window.confirm(t('deleteConfirm'))) setArchives(prev => prev.filter(a => a.id !== archive.id)) }} className="text-sm bg-red-100 dark:bg-red-800/50 hover:bg-red-200 dark:hover:bg-red-700/70 text-red-700 dark:text-red-200 font-semibold py-1 px-2 rounded-md flex items-center justify-center gap-1.5"><i className="bi bi-trash3-fill"></i></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                
                {/* --- Settings Tab --- */}
                {activeTab === 'settings' && (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {/* Institution Info */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">{t('institutionInfo')}</h3>
                            <div className="space-y-3">
                                {institutionInfo.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center p-2 rounded-md">
                                        <input type="text" placeholder={t('infoLabel')} value={item.label} onChange={e => handleInstInfoChange(index, 'label', e.target.value)} className="w-full md:col-span-4 rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm" />
                                        <input type="text" placeholder={t('infoValue')} value={item.value} onChange={e => handleInstInfoChange(index, 'value', e.target.value)} className="w-full md:col-span-6 rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2 text-sm" />
                                        <div className="md:col-span-2 flex items-center justify-end md:justify-between gap-2">
                                            <Tooltip text={t('showInHeader')}>
                                                <label className="flex items-center space-x-2 text-xs cursor-pointer p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
                                                    <input type="checkbox" checked={item.showInHeader} onChange={e => handleInstInfoChange(index, 'showInHeader', e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500"/>
                                                    <i className="bi bi-printer-fill text-gray-500 dark:text-gray-400"></i>
                                                </label>
                                            </Tooltip>
                                            <Tooltip text={t('delete')}>
                                                <button onClick={() => removeInstInfoItem(index)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40">
                                                    <i className="bi bi-trash3-fill"></i>
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={addInstInfoItem} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5">
                                <i className="bi bi-plus-circle-fill"></i> {t('addInfo')}
                            </button>
                        </div>

                         {/* Academic Year */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">{t('academicYear')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" placeholder={t('academicYearMasehi')} value={academicYear.masehi} onChange={e => setAcademicYear({...academicYear, masehi: e.target.value})} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2" />
                                <input type="text" placeholder={t('academicYearHijri')} value={academicYear.hijri} onChange={e => setAcademicYear({...academicYear, hijri: e.target.value})} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2" />
                            </div>
                        </div>
                        
                         {/* General Logic Settings */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">Pengaturan Logika & Validasi</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('workloadWarningThreshold')}</label>
                                    <Tooltip text={t('workloadWarningThresholdTooltip')}>
                                        <input type="number" min="0" value={workloadWarningThreshold} onChange={e => setWorkloadWarningThreshold(parseInt(e.target.value, 10) || 0)} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2" />
                                    </Tooltip>
                                </div>
                            </div>
                        </div>

                         {/* Holiday Settings */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">{t('holidaySettings')}</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('globalHolidays')}</label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('globalHolidaysDesc')}</p>
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {DAYS_OF_WEEK.map(day => (
                                        <label key={day} className="flex items-center space-x-2 text-sm">
                                            <input type="checkbox" checked={globalDaysOff.includes(day)} onChange={() => setGlobalDaysOff(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])} className="rounded text-blue-600 focus:ring-blue-500" />
                                            <span>{t(day as TranslationKey)}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {/* Print Settings */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">{t('printExportSettings')}</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">{t('paperSize')}</label>
                                        <select value={printSettings.paperSize} onChange={e => setPrintSettings(p => ({...p, paperSize: e.target.value as any}))} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2">
                                            <option value="A4">A4</option>
                                            <option value="F4">F4</option>
                                            <option value="Letter">Letter</option>
                                            <option value="Legal">Legal</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">{t('orientation')}</label>
                                        <select value={printSettings.orientation} onChange={e => setPrintSettings(p => ({...p, orientation: e.target.value as any}))} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2">
                                            <option value="portrait">{t('portrait')}</option>
                                            <option value="landscape">{t('landscape')}</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('margins')}</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {(['top', 'bottom', 'left', 'right'] as const).map(m => (
                                            <input key={m} type="number" placeholder={t(m)} value={printSettings.margin[m]} onChange={e => setPrintSettings(p => ({...p, margin: {...p.margin, [m]: Number(e.target.value)}}))} className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-3 py-2" />
                                        ))}
                                    </div>
                                </div>
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" checked={printSettings.showHeader} onChange={e => setPrintSettings(p => ({...p, showHeader: e.target.checked}))} className="rounded text-blue-600 focus:ring-blue-500" />
                                    <span>{t('includeHeader')}</span>
                                </label>
                            </div>
                        </div>

                        {/* Backup & Restore */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                            <h3 className="text-lg font-semibold mb-4">{t('dataBackupRestore')}</h3>
                            <div className="flex gap-4">
                                <button onClick={handleBackup} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"><i className="bi bi-download"></i>{t('backupData')}</button>
                                <button onClick={() => restoreInputRef.current?.click()} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"><i className="bi bi-upload"></i>{t('restoreData')}</button>
                                <input type="file" ref={restoreInputRef} onChange={handleRestore} accept=".json" className="hidden" />
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                             <button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><i className="bi bi-check-lg"></i>{t('saveSettings')}</button>
                        </div>
                    </div>
                )}
                
                {/* --- Help Tab --- */}
                {activeTab === 'help' && <HelpAndAboutPage t={t} />}

            </main>

            {/* --- Modals --- */}
            {modalContent === 'level' && (
                <Modal isOpen={!!modalContent} onClose={closeAllModals} title={editingData ? t('editLevelTitle') : t('addLevelTitle')} t={t}>
                    <LevelForm onSave={handleSaveLevel} onCancel={closeAllModals} t={t} initialData={editingData} globalDaysOff={globalDaysOff} />
                </Modal>
            )}
            {modalContent === 'subject' && (
                <Modal isOpen={!!modalContent} onClose={closeAllModals} title={editingData ? t('editSubjectTitle') : t('addSubjectTitle')} t={t}>
                    <SubjectForm levels={levels} onSave={handleSaveSubject} onCancel={closeAllModals} t={t} initialData={editingData} />
                </Modal>
            )}
            {modalContent === 'room' && (
                <Modal isOpen={!!modalContent} onClose={closeAllModals} title={editingData ? t('editRoomTitle') : t('addRoomTitle')} t={t}>
                    <RoomForm levels={levels} classes={classes} onSave={handleSaveRoom} onCancel={closeAllModals} t={t} initialData={editingData} />
                </Modal>
            )}
            {modalContent === 'teacher' && (
                <Modal isOpen={!!modalContent} onClose={closeAllModals} title={editingData ? t('editTeacher') : t('addTeacher')} size="lg" t={t}>
                    <TeacherForm subjects={subjects} levels={levels} onSave={handleSaveTeacher} onCancel={closeAllModals} t={t} initialData={editingData} />
                </Modal>
            )}
            {modalContent === 'class' && (
                <Modal isOpen={!!modalContent} onClose={closeAllModals} title={editingData ? t('editClass') : t('addClass')} size="lg" t={t}>
                    <ClassForm subjects={subjects} levels={levels} teachers={teachers} allClasses={classes} onSave={handleSaveClass} onCancel={closeAllModals} t={t} initialData={editingData} workloadWarningThreshold={workloadWarningThreshold} />
                </Modal>
            )}
            {editingLevel && (
                <TimeSlotEditorModal
                    isOpen={!!editingLevel}
                    onClose={() => setEditingLevel(null)}
                    onSave={handleUpdateTimeSlotsForLevel}
                    level={editingLevel}
                    t={t}
                />
            )}
            {viewingArchive && (
                <ArchivedScheduleViewer
                    archive={viewingArchive}
                    onClose={closeAllModals}
                    onPrint={handlePrint}
                    onExportHTML={handleExportHTML}
                    onExportCSV={handleExportCSV}
                    teachers={teachers}
                    rooms={rooms}
                    levels={levels}
                    classes={classes}
                    globalDaysOff={globalDaysOff}
                    t={t}
                    onEntryClick={handleOpenSubstituteFinder}
                    droppableState={droppableState}
                />
            )}
            {substituteFinderContext && (
                <SubstituteFinderModal
                    context={substituteFinderContext}
                    candidates={availableSubstitutes}
                    onSelect={handleSelectSubstitute}
                    onClose={closeAllModals}
                    t={t}
                />
            )}
            
            <ToastNotification message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={() => setToast({ ...toast, isVisible: false })} />
        </div>
    );
}
