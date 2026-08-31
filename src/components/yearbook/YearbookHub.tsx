'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  ensureDefaultYearbookProject,
  deleteYearbookEntry,
  deleteYearbookProject,
} from '@/lib/db';
import { YearbookProject, YearbookEntry } from '@/lib/types';
import {
  Calendar as CalendarIcon,
  Play,
  Plus,
  Flame,
  Film,
  BookOpen,
  Sparkles,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Layers,
  Settings2,
  FolderPlus,
  Image as ImageIcon,
} from 'lucide-react';
import YearbookPhotoEditorModal from './YearbookPhotoEditorModal';
import YearbookPhotoViewerModal from './YearbookPhotoViewerModal';
import CreateYearbookModal from './CreateYearbookModal';
import TimelapsePlayerModal from './TimelapsePlayerModal';
import {
  formatLocalDate,
  getLocalTodayString,
  formatDisplayDate,
  parseLocalDate,
} from '@/lib/date-utils';
import {
  deleteYearbookEntryFromCloud,
  deleteYearbookProjectFromCloud,
  syncYearbookProjectToCloud,
} from '@/lib/cloud-sync';

interface YearbookHubProps {
  className?: string;
}

// Single Day Card in the Timeline
function YearbookDayCard({
  entry,
  onView,
  onEdit,
  onDelete,
}: {
  entry: YearbookEntry;
  onView: (entry: YearbookEntry) => void;
  onEdit: (entry: YearbookEntry) => void;
  onDelete: (id: string) => void;
}) {
  const [thumbUrl, setThumbUrl] = useState('');

  useEffect(() => {
    const url = URL.createObjectURL(entry.thumbnailBlob || entry.photoBlob);
    setThumbUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [entry.thumbnailBlob, entry.photoBlob]);

  const dateObj = parseLocalDate(entry.date);
  const dayName = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
  const monthDay = formatDisplayDate(entry.date, { month: 'short', day: 'numeric' });

  return (
    <div
      onClick={() => onView(entry)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#e7e1d3] bg-white hover:border-[#c27838] hover:shadow-lg hover:shadow-stone-900/5 transition-all duration-300 cursor-pointer"
    >
      {/* Media Viewport */}
      <div className="relative aspect-[9/16] w-full overflow-hidden bg-[#1c1917]">
        {thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbUrl}
            alt={`Yearbook entry for ${entry.date}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-stone-600">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}

        {/* Date Stamp Pill Top */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className="rounded-lg bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
            {monthDay}
          </span>
          <span className="rounded-lg bg-[#c27838] px-1.5 py-0.5 text-[9px] font-mono font-bold text-white uppercase">
            {entry.aspectRatio}
          </span>
        </div>

        {/* Hover Quick Actions */}
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-black/40 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onView(entry);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-[#1c1917] shadow-md hover:bg-[#f5f1e8] transition-all cursor-pointer"
          >
            <span>View</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(entry);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#c27838] px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-[#a85d26] transition-all cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete entry for ${entry.date}?`)) {
                onDelete(entry.id);
              }
            }}
            className="rounded-xl border border-rose-400 bg-white/90 p-1.5 text-rose-600 hover:bg-white transition-colors cursor-pointer"
            title="Delete entry"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-2.5 text-xs flex items-center justify-between bg-white">
        <div>
          <span className="font-semibold text-[#1c1917]">{dayName}</span>
          <span className="text-[10px] text-[#78716c] ml-1.5">{entry.date}</span>
        </div>
      </div>
    </div>
  );
}

export default function YearbookHub({ className }: YearbookHubProps = {}) {
  const projects = useLiveQuery(() => db.yearbookProjects.toArray(), []) || [];
  const [activeProjectId, setActiveProjectId] = useState<string>('yb_main');

  const fallbackDefaultProject: YearbookProject = useMemo(() => ({
    id: 'yb_main',
    title: 'My Daily Photo Yearbook',
    description: 'Daily photo timelapse journey',
    aspectRatio: '9:16',
    startDate: getLocalTodayString(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }), []);

  useEffect(() => {
    ensureDefaultYearbookProject().then((def) => {
      if (!activeProjectId || activeProjectId === 'yb_main') {
        setActiveProjectId(def.id);
      }
    });
  }, [activeProjectId]);

  const activeProject: YearbookProject = useMemo(() => {
    return projects.find((p) => p.id === activeProjectId) || projects[0] || fallbackDefaultProject;
  }, [projects, activeProjectId, fallbackDefaultProject]);

  const rawEntries =
    useLiveQuery(
      () =>
        activeProject
          ? db.yearbook.where('yearbookId').equals(activeProject.id).toArray()
          : db.yearbook.toArray(),
      [activeProject.id]
    ) || [];

  const entries = useMemo(() => {
    return [...rawEntries].sort((a, b) => b.date.localeCompare(a.date));
  }, [rawEntries]);

  // Modals
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [editingProjectForModal, setEditingProjectForModal] = useState<YearbookProject | null>(null);

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<YearbookEntry | null>(null);

  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [selectedDateForEditor, setSelectedDateForEditor] = useState<string>(
    getLocalTodayString()
  );
  const [editingEntry, setEditingEntry] = useState<YearbookEntry | null>(null);
  const [isTimelapseOpen, setIsTimelapseOpen] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const todayStr = getLocalTodayString();

  // Calculate Streak
  const stats = useMemo(() => {
    const totalDays = entries.length;
    const dateSet = new Set(entries.map((e) => e.date));

    let streak = 0;
    const checkDate = new Date();

    while (true) {
      const dStr = formatLocalDate(checkDate);
      if (dateSet.has(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (streak === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yStr = formatLocalDate(checkDate);
          if (dateSet.has(yStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
        }
        break;
      }
    }

    return { totalDays, streak };
  }, [entries]);

  // Calendar days computation
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const dateEntryMap = new Map<string, YearbookEntry>();
    entries.forEach((e) => dateEntryMap.set(e.date, e));

    const days: { dateStr: string; dayNumber: number; entry?: YearbookEntry; isCurrentMonth: boolean }[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startDayOfWeek + i + 1);
      const dStr = formatLocalDate(prevDate);
      days.push({
        dateStr: dStr,
        dayNumber: prevDate.getDate(),
        entry: dateEntryMap.get(dStr),
        isCurrentMonth: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dStr = `${year}-${mStr}-${dayStr}`;
      days.push({
        dateStr: dStr,
        dayNumber: d,
        entry: dateEntryMap.get(dStr),
        isCurrentMonth: true,
      });
    }

    return days;
  }, [currentMonth, entries]);

  const handleOpenAddForDate = (dateStr: string) => {
    const existing = entries.find((e) => e.date === dateStr);
    setSelectedDateForEditor(dateStr);
    setEditingEntry(existing || null);
    setIsPhotoEditorOpen(true);
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteYearbookEntry(id);
    deleteYearbookEntryFromCloud(id);
  };

  const handleDeleteActiveProject = async () => {
    if (!activeProject) return;
    if (
      confirm(
        `Are you sure you want to delete the yearbook "${activeProject.title}" and all its photos?`
      )
    ) {
      const pId = activeProject.id;
      await deleteYearbookProject(pId);
      deleteYearbookProjectFromCloud(pId);
      const remaining = projects.filter((p) => p.id !== pId);
      if (remaining.length > 0) {
        setActiveProjectId(remaining[0].id);
      } else {
        const fresh = await ensureDefaultYearbookProject();
        setActiveProjectId(fresh.id);
      }
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const monthYearLabel = currentMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8">
      {/* 1. Yearbook Selector Hub */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-[#e7e1d3] bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f5f1e8] text-[#c27838] border border-[#e7e1d3]">
            <BookOpen className="h-5 w-5" />
          </div>

          <div className="flex flex-col min-w-0">
            <label className="text-[10px] uppercase font-bold tracking-wider text-[#78716c]">
              Active Yearbook Series
            </label>
            <div className="flex items-center gap-2">
              <select
                value={activeProject?.id || ''}
                onChange={(e) => setActiveProjectId(e.target.value)}
                className="font-display text-sm sm:text-base font-bold text-[#1c1917] bg-transparent border-b border-[#e7e1d3] pb-0.5 focus:outline-none focus:border-[#c27838] cursor-pointer max-w-[220px] sm:max-w-xs truncate"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id} className="bg-white text-[#1c1917]">
                    {proj.title} ({proj.aspectRatio})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenAddForDate(todayStr)}
            className="flex items-center gap-1.5 rounded-xl bg-[#c27838] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#a85d26] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Photo ({todayStr})</span>
          </button>

          <button
            onClick={() => {
              setEditingProjectForModal(activeProject);
              setIsCreateProjectOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-[#e7e1d3] bg-[#fbf9f5] px-3 py-2 text-xs font-medium text-[#1c1917] hover:bg-[#f5f1e8] transition-colors cursor-pointer"
            title="Edit Yearbook Settings"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {projects.length > 1 && (
            <button
              onClick={handleDeleteActiveProject}
              className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Delete this yearbook"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => {
              setEditingProjectForModal(null);
              setIsCreateProjectOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-[#e7e1d3] bg-white px-3 py-2 text-xs font-medium text-[#1c1917] hover:bg-[#f5f1e8] transition-all cursor-pointer"
          >
            <FolderPlus className="h-4 w-4 text-[#c27838]" />
            <span>New Series</span>
          </button>
        </div>
      </div>

      {/* 2. Hero & Streak Stats Header */}
      <div className="relative overflow-hidden rounded-3xl border border-[#e7e1d3] bg-[#f5f1e8] p-6 sm:p-8">
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#c27838] border border-[#e7e1d3]">
              <Film className="h-3.5 w-3.5" />
              <span>{activeProject?.title || 'Daily Photo Yearbook'}</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#1c1917]">
              {activeProject?.title || 'Photo Yearbook'}
            </h1>
            <p className="text-xs sm:text-sm text-[#78716c]">
              {activeProject?.description ||
                'Add one photo every day, auto-align eyes and face, add Snapchat captions, and generate a seamless aging/growth timelapse video.'}
            </p>
          </div>

          {/* Streak Stats */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-[#e7e1d3] bg-white p-3 sm:p-3.5 shadow-xs">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                <Flame className="h-4 w-4 sm:h-5 sm:w-5 fill-amber-500 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] text-[#78716c] uppercase tracking-wider font-semibold truncate">
                  Streak
                </p>
                <p className="text-base sm:text-lg font-bold text-[#1c1917] truncate">
                  {stats.streak} {stats.streak === 1 ? 'Day' : 'Days'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-[#e7e1d3] bg-white p-3 sm:p-3.5 shadow-xs">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#f5f1e8] text-[#c27838] border border-[#e7e1d3] shrink-0">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] text-[#78716c] uppercase tracking-wider font-semibold truncate">
                  Entries
                </p>
                <p className="text-base sm:text-lg font-bold text-[#1c1917] truncate">
                  {stats.totalDays} Total
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="relative mt-6 flex flex-wrap items-center gap-3 pt-6 border-t border-[#e7e1d3]">
          <button
            onClick={() => handleOpenAddForDate(todayStr)}
            className="flex items-center gap-2 rounded-xl bg-[#c27838] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#a85d26] transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Today&apos;s Photo ({todayStr})</span>
          </button>

          <button
            disabled={entries.length === 0}
            onClick={() => setIsTimelapseOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#292524] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-[#1c1917] transition-all cursor-pointer disabled:opacity-40"
          >
            <Play className="h-4 w-4 fill-white" />
            <span>Play Timelapse Video ({entries.length} Frames)</span>
          </button>
        </div>
      </div>

      {/* 3. Calendar Grid */}
      <div className="rounded-3xl border border-[#e7e1d3] bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-[#c27838]" />
            <h3 className="font-display text-sm sm:text-base font-bold text-[#1c1917]">
              {monthYearLabel}
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={prevMonth}
              className="rounded-xl border border-[#e7e1d3] bg-[#fbf9f5] p-1.5 text-[#1c1917] hover:bg-[#f5f1e8]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="rounded-xl border border-[#e7e1d3] bg-[#fbf9f5] px-2.5 py-1 text-xs text-[#1c1917] hover:bg-[#f5f1e8]"
            >
              Current Month
            </button>
            <button
              onClick={nextMonth}
              className="rounded-xl border border-[#e7e1d3] bg-[#fbf9f5] p-1.5 text-[#1c1917] hover:bg-[#f5f1e8]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#78716c] uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Month Day Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {calendarDays.map((day) => {
            const isToday = day.dateStr === todayStr;
            const hasEntry = Boolean(day.entry);

            return (
              <button
                key={day.dateStr}
                onClick={() => {
                  if (day.entry) {
                    setViewingEntry(day.entry);
                    setIsViewerOpen(true);
                  } else {
                    handleOpenAddForDate(day.dateStr);
                  }
                }}
                className={`group relative flex flex-col items-center justify-between rounded-xl border p-2 sm:p-2.5 min-h-[56px] sm:min-h-[64px] transition-all cursor-pointer ${
                  hasEntry
                    ? 'border-[#c27838] bg-[#f5f1e8] text-[#1c1917] shadow-xs'
                    : isToday
                    ? 'border-amber-400 bg-amber-50 text-amber-800'
                    : day.isCurrentMonth
                    ? 'border-[#e7e1d3] bg-[#fbf9f5] text-[#1c1917] hover:border-[#c27838] hover:bg-white'
                    : 'border-transparent text-stone-300 opacity-40 hover:opacity-80'
                }`}
                title={
                  hasEntry
                    ? `Click to view full photo for ${day.dateStr}`
                    : `Click to log photo for ${day.dateStr}`
                }
              >
                <span className="text-xs font-semibold">{day.dayNumber}</span>

                {hasEntry ? (
                  <span className="flex h-2 w-2 rounded-full bg-[#c27838] shadow-xs" />
                ) : isToday ? (
                  <span className="text-[9px] font-bold text-amber-700">+ Today</span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-stone-200 group-hover:bg-stone-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Chronological Daily Entries Timeline Stream */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-display text-base sm:text-lg font-bold text-[#1c1917] truncate">
              Timeline • {activeProject?.title}
            </h3>
            <span className="shrink-0 rounded-lg bg-[#f5f1e8] px-2.5 py-0.5 text-xs font-bold text-[#78716c] border border-[#e7e1d3] whitespace-nowrap">
              {entries.length} {entries.length === 1 ? 'Day' : 'Days'}
            </span>
          </div>

          {entries.length > 0 && (
            <button
              onClick={() => setIsTimelapseOpen(true)}
              className="self-start sm:self-auto flex items-center gap-1.5 rounded-xl bg-[#292524] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1c1917] transition-all cursor-pointer shrink-0"
            >
              <Play className="h-3.5 w-3.5 fill-white" />
              <span>Watch Timelapse</span>
            </button>
          )}
        </div>

        {entries.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {entries.map((entry) => (
              <YearbookDayCard
                key={entry.id}
                entry={entry}
                onView={(e) => {
                  setViewingEntry(e);
                  setIsViewerOpen(true);
                }}
                onEdit={(e) => {
                  setSelectedDateForEditor(e.date);
                  setEditingEntry(e);
                  setIsPhotoEditorOpen(true);
                }}
                onDelete={handleDeleteEntry}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#e7e1d3] bg-white py-16 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5f1e8] text-[#c27838] mb-4 border border-[#e7e1d3]">
              <Film className="h-8 w-8" />
            </div>
            <h3 className="font-display text-base sm:text-lg font-bold text-[#1c1917]">
              No Photos Logged in &quot;{activeProject?.title}&quot;
            </h3>
            <p className="mt-1 max-w-sm text-xs sm:text-sm text-[#78716c]">
              Select any date (e.g. 31st August, 1st September) or snap today&apos;s photo to start building your auto-aligned timelapse.
            </p>

            <button
              onClick={() => handleOpenAddForDate(todayStr)}
              className="mt-5 rounded-xl bg-[#c27838] px-4 py-2 text-xs font-semibold text-white hover:bg-[#a85d26] transition-all cursor-pointer shadow-sm"
            >
              Log Today&apos;s Photo ({todayStr})
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <YearbookPhotoViewerModal
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setViewingEntry(null);
        }}
        entry={viewingEntry}
        entries={entries}
        currentProject={activeProject}
        onEdit={(e) => {
          setSelectedDateForEditor(e.date);
          setEditingEntry(e);
          setIsPhotoEditorOpen(true);
        }}
        onDelete={handleDeleteEntry}
      />

      <YearbookPhotoEditorModal
        isOpen={isPhotoEditorOpen}
        onClose={() => {
          setIsPhotoEditorOpen(false);
          setEditingEntry(null);
        }}
        currentProject={activeProject}
        initialDate={selectedDateForEditor}
        existingEntry={editingEntry}
        onEntrySaved={async () => {
          const exists = await db.yearbookProjects.get(activeProject.id);
          if (!exists) {
            await db.yearbookProjects.put(activeProject);
            syncYearbookProjectToCloud(activeProject);
          }
        }}
      />

      <TimelapsePlayerModal
        isOpen={isTimelapseOpen}
        onClose={() => setIsTimelapseOpen(false)}
        entries={entries}
        currentProject={activeProject}
      />

      <CreateYearbookModal
        isOpen={isCreateProjectOpen}
        onClose={() => {
          setIsCreateProjectOpen(false);
          setEditingProjectForModal(null);
        }}
        editingProject={editingProjectForModal}
        onProjectSaved={(p) => {
          setActiveProjectId(p.id);
        }}
      />
    </div>
  );
}
