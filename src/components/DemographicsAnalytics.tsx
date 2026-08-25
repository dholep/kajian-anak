import React, { useState } from 'react';
import { EventConfig, Participant } from '../types';
import { 
  Users, 
  UserCheck, 
  MapPin, 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  Calendar, 
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface DemographicsAnalyticsProps {
  participants: Participant[];
  config: EventConfig;
}

export const DemographicsAnalytics: React.FC<DemographicsAnalyticsProps> = ({
  participants,
  config,
}) => {
  const [hoveredAgeGroup, setHoveredAgeGroup] = useState<string | null>(null);
  
  const total = participants.length;
  const ikhwanList = participants.filter((p) => p.gender === 'ikhwan');
  const akhwatList = participants.filter((p) => p.gender === 'akhwat');
  const attendedList = participants.filter((p) => p.attendanceStatus === 'hadir');

  const ikhwanCount = ikhwanList.length;
  const akhwatCount = akhwatList.length;
  const attendedCount = attendedList.length;

  const ikhwanPct = total > 0 ? Math.round((ikhwanCount / total) * 100) : 0;
  const akhwatPct = total > 0 ? Math.round((akhwatCount / total) * 100) : 0;
  const attendanceRate = total > 0 ? Math.round((attendedCount / total) * 100) : 0;

  // Age Breakdown Calculations
  const ageGroups = [
    { label: '4 - 6 Thn (PAUD/TK)', shortLabel: '4-6 thn', min: 4, max: 6 },
    { label: '7 - 9 Thn (SD Awal)', shortLabel: '7-9 thn', min: 7, max: 9 },
    { label: '10 - 12 Thn (SD Akhir)', shortLabel: '10-12 thn', min: 10, max: 12 },
    { label: '13+ Thn (Pra-Remaja)', shortLabel: '13+ thn', min: 13, max: 20 },
  ];

  const ageData = ageGroups.map((group) => {
    const ikh = ikhwanList.filter((p) => p.age >= group.min && p.age <= group.max).length;
    const akh = akhwatList.filter((p) => p.age >= group.min && p.age <= group.max).length;
    return {
      group: group.label,
      shortLabel: group.shortLabel,
      ikhwan: ikh,
      akhwat: akh,
      total: ikh + akh,
    };
  });

  const maxAgeCount = Math.max(1, ...ageData.map((d) => Math.max(d.ikhwan, d.akhwat, d.total)));

  // Average Age
  const avgAge = total > 0 
    ? (participants.reduce((acc, curr) => acc + curr.age, 0) / total).toFixed(1)
    : '0';

  // Domicile / Region Distribution
  const domicileCounts: Record<string, number> = {};
  participants.forEach((p) => {
    const dom = p.domicile || 'Lainnya';
    domicileCounts[dom] = (domicileCounts[dom] || 0) + 1;
  });

  const domicileData = Object.entries(domicileCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const topDomicile = domicileData.length > 0 ? domicileData[0].name : '-';

  return (
    <div id="analytics-dashboard-section" className="space-y-6">
      
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Peserta */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Pendaftar</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {total}
            </span>
            <span className="text-xs text-slate-400">
              dari kuota {config.ikhwanQuota + config.akhwatQuota}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className="bg-slate-900 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (total / Math.max(1, config.ikhwanQuota + config.akhwatQuota)) * 100)}%` }}
            />
          </div>
        </div>

        {/* Rasio Ikhwan vs Akhwat */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Rasio Gender</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <PieIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-xs text-indigo-600 font-bold">Ikhwan</span>
              <p className="text-xl font-extrabold text-slate-900">{ikhwanCount} <span className="text-xs font-normal text-slate-400">({ikhwanPct}%)</span></p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <span className="text-xs text-rose-500 font-bold">Akhwat</span>
              <p className="text-xl font-extrabold text-slate-900">{akhwatCount} <span className="text-xs font-normal text-slate-400">({akhwatPct}%)</span></p>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Kapasitas: {config.ikhwanQuota} Ikhwan | {config.akhwatQuota} Akhwat
          </p>
        </div>

        {/* Tingkat Kehadiran (Attendance Rate) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tingkat Presensi</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {attendanceRate}%
            </span>
            <span className="text-xs text-slate-500">
              ({attendedCount} Hadir)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>

        {/* Demografi Utama */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Profil Singkat</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Rata-rata Usia:</span>
              <span className="font-bold text-slate-800">{avgAge} Tahun</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Domisili Terbanyak:</span>
              <span className="font-bold text-slate-800 truncate max-w-[120px]">{topDomicile}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Data diverifikasi langsung</span>
          </div>
        </div>

      </div>

      {/* Visual Charts Row 1: Age Distribution & Gender Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Age Group Breakdown Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-700" />
                Distribusi Kelompok Usia Peserta
              </h3>
              <p className="text-xs text-slate-500">
                Segmentasi usia anak untuk penyesuaian materi dan pembagian kelompok belajar.
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
                <span>Ikhwan</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span>Akhwat</span>
              </span>
            </div>
          </div>

          {/* Pure CSS / SVG High Precision Responsive Bar Chart */}
          <div className="space-y-4 pt-2">
            {ageData.map((item) => {
              const ikhwanPctBar = maxAgeCount > 0 ? (item.ikhwan / maxAgeCount) * 100 : 0;
              const akhwatPctBar = maxAgeCount > 0 ? (item.akhwat / maxAgeCount) * 100 : 0;

              return (
                <div 
                  key={item.group} 
                  className="space-y-1.5 p-2 rounded-xl hover:bg-slate-50/80 transition-colors"
                  onMouseEnter={() => setHoveredAgeGroup(item.group)}
                  onMouseLeave={() => setHoveredAgeGroup(null)}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.group}</span>
                    <span className="font-mono text-slate-500 font-medium">
                      Total: <strong className="text-slate-900">{item.total}</strong> Anak
                    </span>
                  </div>

                  {/* Dual Bar (Ikhwan & Akhwat) */}
                  <div className="space-y-1">
                    {/* Ikhwan Bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-indigo-600 w-12 text-right">
                        Ikhwan ({item.ikhwan})
                      </span>
                      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(item.ikhwan > 0 ? 4 : 0, ikhwanPctBar)}%` }}
                        />
                      </div>
                    </div>

                    {/* Akhwat Bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-rose-500 w-12 text-right">
                        Akhwat ({item.akhwat})
                      </span>
                      <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-rose-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(item.akhwat > 0 ? 4 : 0, akhwatPctBar)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gender & Attendance Ring Breakdown (1 Col) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          
          {/* Gender Ratio Card */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              Komposisi Ikhwan vs Akhwat
            </h3>
            
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <span>Ikhwan (Laki-laki)</span>
                </span>
                <span className="font-bold text-indigo-600">{ikhwanCount} ({ikhwanPct}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                <div 
                  className="bg-indigo-600 h-full transition-all duration-500"
                  style={{ width: `${ikhwanPct}%` }}
                />
                <div 
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${akhwatPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Akhwat (Perempuan)</span>
                </span>
                <span className="font-bold text-rose-500">{akhwatCount} ({akhwatPct}%)</span>
              </div>
            </div>
          </div>

          {/* Attendance Status Card */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              Status Presensi On-Site
            </h3>
            
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <span>Hadir Terverifikasi</span>
                </span>
                <span className="font-bold text-emerald-600">{attendedCount} ({attendanceRate}%)</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-500"
                  style={{ width: `${attendanceRate}%` }}
                />
                <div 
                  className="bg-slate-300 h-full transition-all duration-500"
                  style={{ width: `${100 - attendanceRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  <span>Belum Hadir</span>
                </span>
                <span className="font-semibold text-slate-500">{total - attendedCount} ({100 - attendanceRate}%)</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Visual Charts Row 2: Top Domicile / Regional Breakdown */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-700" />
              Sebaran Asal Domisili Peserta
            </h3>
            <p className="text-xs text-slate-500">
              Statistik wilayah tempat tinggal peserta untuk perencanaan logistik & akomodasi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {domicileData.map((item, index) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div 
                key={item.name}
                className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-white text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shadow-2xs">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-xs sm:text-sm text-slate-900">{item.name}</p>
                    <p className="text-[11px] text-slate-500">{item.value} Peserta</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
