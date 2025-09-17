
import React, { useState } from 'react';
import type { TranslationKey } from '../types';

export const HelpAndAboutPage: React.FC<{ t: (key: TranslationKey) => string; }> = ({ t }) => {
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
                    <span><span className="font-semibold">Pengembang:</span> <a href="https://aiprojek01.my.id" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{t('developer')}</a></span>
                    <span>&bull;</span>
                    <span><span className="font-semibold">{t('license')}:</span> <a href="https://www.gnu.org/licenses/gpl-3.0.en.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">GNU GPLv3</a></span>
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
                <CollapsibleSection title="Pendahuluan" id="guideIntro" icon="bi-lightbulb-fill"><p>{t('guideIntro')}</p></CollapsibleSection>
                <CollapsibleSection title={t('guideData')} id="guideData" icon="bi-database-fill-add"><ul><li>{t('guideDataDetail1')}</li><li><b>{t('guideDataDetail2')}</b></li><li>{t('guideDataDetail3')}</li><li>{t('guideDataDetail4')}</li></ul></CollapsibleSection>
                <CollapsibleSection title={t('guideGenerator')} id="guideGenerator" icon="bi-magic"><ul><li>{t('guideGeneratorDetail1')}</li><li>{t('guideGeneratorDetail2')}</li><li>{t('guideGeneratorDetail3')}</li><li>{t('guideGeneratorDetail4')}</li></ul></CollapsibleSection>
                <CollapsibleSection title={t('guideInteraction')} id="guideInteraction" icon="bi-arrows-move"><ul><li>{t('guideInteractionDetail1')}</li><li>{t('guideInteractionDetail2')}</li><li>{t('guideInteractionDetail3')}</li></ul></CollapsibleSection>
                <CollapsibleSection title={t('guideArchive')} id="guideArchive" icon="bi-archive-fill"><ul><li>{t('guideArchiveDetail1')}</li><li>{t('guideArchiveDetail2')}</li><li>{t('guideArchiveDetail3')}</li></ul></CollapsibleSection>
                <CollapsibleSection title={t('guideSettings')} id="guideSettings" icon="bi-gear-wide-connected"><ul><li>{t('guideSettingsDetail1')}</li><li>{t('guideSettingsDetail2')}</li><li><b>{t('guideSettingsDetail3')}</b></li></ul></CollapsibleSection>
            </div>
        </div>
    );
};
