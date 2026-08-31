'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  Eye,
  Film,
  Layers,
  Database,
  ShieldCheck,
  Zap,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Calendar,
  Camera,
  Upload,
  Heart,
  ChevronRight,
  Maximize2,
  HardDrive,
  Compass,
} from 'lucide-react';
import { getLocalTodayString, formatDisplayDate } from '@/lib/date-utils';

interface LandingPageProps {
  onEnterApp: () => void;
  yearbookCount: number;
}

// Simulated frames for the interactive landing page timelapse scrubber
const DEMO_FRAMES = [
  {
    day: 1,
    date: 'Jan 01, 2026',
    caption: 'Day 1: The start of the journey 🌱',
    avatarHue: 25,
    hairStyle: 'Short',
    quote: 'A single frame captured.',
  },
  {
    day: 30,
    date: 'Jan 30, 2026',
    caption: 'Day 30: One month consistent! ✨',
    avatarHue: 35,
    hairStyle: 'Textured',
    quote: 'Habit turns into ritual.',
  },
  {
    day: 90,
    date: 'Mar 31, 2026',
    caption: 'Day 90: Spring is here 🌸',
    avatarHue: 45,
    hairStyle: 'Growing',
    quote: 'The subtle drift of time.',
  },
  {
    day: 180,
    date: 'Jun 30, 2026',
    caption: 'Day 180: Half a year milestone 🔥',
    avatarHue: 55,
    hairStyle: 'Longer',
    quote: 'Visible changes emerge.',
  },
  {
    day: 270,
    date: 'Sep 30, 2026',
    caption: 'Day 270: Autumn transformation 🍂',
    avatarHue: 30,
    hairStyle: 'Full',
    quote: 'Posture locked. Eyes aligned.',
  },
  {
    day: 365,
    date: 'Dec 31, 2026',
    caption: 'Day 365: 1 Full Year Complete 🏆',
    avatarHue: 20,
    hairStyle: 'Transformed',
    quote: 'A whole year sculpted.',
  },
];

export default function LandingPage({ onEnterApp, yearbookCount }: LandingPageProps) {
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [ghostDemoOpacity, setGhostDemoOpacity] = useState(0.4);
  const [showCrosshairs, setShowCrosshairs] = useState(true);

  // Auto-play demo timelapse
  useEffect(() => {
    let timer: any;
    if (isPlayingDemo) {
      timer = setInterval(() => {
        setCurrentFrameIdx((prev) => (prev + 1) % DEMO_FRAMES.length);
      }, 750);
    }
    return () => clearInterval(timer);
  }, [isPlayingDemo]);

  const activeDemo = DEMO_FRAMES[currentFrameIdx];
  const prevDemo = DEMO_FRAMES[(currentFrameIdx - 1 + DEMO_FRAMES.length) % DEMO_FRAMES.length];

  return (
    <div className="relative min-h-screen bg-[#fbf9f5] text-[#1c1917] overflow-x-hidden selection:bg-[#c27838]/20 selection:text-[#a85d26]">
      {/* Editorial Decorative Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-radial from-[#c27838]/15 via-[#f5f1e8] to-transparent blur-3xl" />
        <div className="absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-radial from-[#a85d26]/10 via-[#f5f1e8] to-transparent blur-3xl" />
        <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-radial from-[#c27838]/10 via-[#f5f1e8] to-transparent blur-3xl" />
      </div>

      {/* Top Maximalist Editorial Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-[#e7e1d3] bg-[#fbf9f5]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl overflow-hidden shadow-xs ring-1 ring-[#c27838]/30 shrink-0">
              <img
                src="/icons/icon-192.png"
                alt="Yearbook Crest"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#1c1917]">
                  Year<span className="text-[#c27838]">book</span>
                </span>
                <span className="hidden sm:inline-flex rounded-full bg-[#f5f1e8] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c27838] border border-[#e7e1d3]">
                  Daily Studio
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onEnterApp}
              className="group flex items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl bg-[#1c1917] px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-[#c27838] transition-all duration-300 cursor-pointer"
            >
              <span>Open Studio</span>
              <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section: Editorial Maximalism */}
      <section className="relative mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24">
        {/* Vintage Top Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e7e1d3] bg-white px-4 py-1.5 shadow-xs">
            <span className="flex h-2 w-2 rounded-full bg-[#c27838] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#78716c]">
              Memory Preservation & Growth Architecture
            </span>
            <span className="text-[#e7e1d3]">•</span>
            <span className="text-xs font-bold text-[#c27838]">100% Client-Side</span>
          </div>
        </div>

        {/* Main Headline */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <h1 className="font-serif-editorial text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#1c1917] leading-[1.08]">
            The daily architecture of <span className="italic text-[#c27838] font-normal underline decoration-[#c27838]/40 decoration-wavy">time</span>, sculpted frame by frame.
          </h1>

          <p className="text-base sm:text-xl text-[#78716c] font-light max-w-2xl mx-auto leading-relaxed">
            One photo every day. Automatically eye-locked with zero manual effort, snapchat captioned, and rendered into fluid, life-transforming timelapse cinema.
          </p>

          {/* CTAs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onEnterApp}
              className="group flex items-center gap-3 rounded-2xl bg-[#c27838] px-8 py-4 text-sm sm:text-base font-semibold text-white shadow-xl shadow-[#c27838]/20 hover:bg-[#a85d26] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <Sparkles className="h-5 w-5" />
              <span>Start Your Daily Yearbook</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>

            <a
              href="#interactive-demo"
              className="flex items-center gap-2 rounded-2xl border border-[#e7e1d3] bg-white px-6 py-4 text-sm sm:text-base font-medium text-[#1c1917] hover:bg-[#f5f1e8] hover:border-[#c27838] transition-all cursor-pointer shadow-xs"
            >
              <Play className="h-4 w-4 text-[#c27838]" />
              <span>Explore Interactive Demo</span>
            </a>
          </div>
        </div>

        {/* Maximalist Floating Polaroids Collage */}
        <div className="mt-14 relative mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 items-end">
            {/* Polaroid 1 */}
            <div className="polaroid-card rounded-2xl p-3 sm:p-4 rotate-[-3deg] transform hover:rotate-0 transition-transform">
              <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-stone-900 flex flex-col items-center justify-center text-white text-center p-3 border border-stone-800">
                <div className="absolute top-2 left-2 rounded-full bg-[#c27838] px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                  Day 1
                </div>
                <div className="h-20 w-20 rounded-full border-2 border-dashed border-[#c27838]/80 flex items-center justify-center mb-2">
                  <Eye className="h-8 w-8 text-[#c27838]" />
                </div>
                <div className="absolute bottom-3 inset-x-2 bg-black/70 backdrop-blur-xs py-1 px-2 rounded-lg text-[10px] font-semibold text-white">
                  The Beginning • Jan 01
                </div>
              </div>
              <div className="mt-2.5 px-1 flex justify-between items-center text-[11px] font-serif-editorial text-[#78716c]">
                <span>Frame #001</span>
                <span className="text-[#c27838] font-mono">00:00.06s</span>
              </div>
            </div>

            {/* Polaroid 2 (Prominent Center) */}
            <div className="polaroid-card rounded-2xl p-3 sm:p-4 rotate-[2deg] transform hover:rotate-0 transition-transform md:-translate-y-4 shadow-xl">
              <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-stone-900 flex flex-col items-center justify-center text-white text-center p-3 border border-stone-800">
                <div className="absolute top-2 left-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                  Day 90
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute top-[38%] left-0 right-0 border-t border-dashed border-[#c27838]" />
                  <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-[#c27838]" />
                </div>
                <div className="h-20 w-20 rounded-full border-2 border-dashed border-emerald-500/80 flex items-center justify-center mb-2">
                  <Eye className="h-8 w-8 text-emerald-400" />
                </div>
                <div className="absolute bottom-3 inset-x-2 bg-black/70 backdrop-blur-xs py-1 px-2 rounded-lg text-[10px] font-semibold text-white">
                  Spring Growth • Mar 31
                </div>
              </div>
              <div className="mt-2.5 px-1 flex justify-between items-center text-[11px] font-serif-editorial text-[#78716c]">
                <span>Frame #090</span>
                <span className="text-emerald-600 font-mono">Auto-Aligned</span>
              </div>
            </div>

            {/* Polaroid 3 */}
            <div className="polaroid-card rounded-2xl p-3 sm:p-4 rotate-[-2deg] transform hover:rotate-0 transition-transform">
              <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-stone-900 flex flex-col items-center justify-center text-white text-center p-3 border border-stone-800">
                <div className="absolute top-2 left-2 rounded-full bg-amber-600 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                  Day 180
                </div>
                <div className="h-20 w-20 rounded-full border-2 border-dashed border-amber-500/80 flex items-center justify-center mb-2">
                  <Eye className="h-8 w-8 text-amber-400" />
                </div>
                <div className="absolute bottom-3 inset-x-2 bg-black/70 backdrop-blur-xs py-1 px-2 rounded-lg text-[10px] font-semibold text-white">
                  Summer Shift • Jun 30
                </div>
              </div>
              <div className="mt-2.5 px-1 flex justify-between items-center text-[11px] font-serif-editorial text-[#78716c]">
                <span>Frame #180</span>
                <span className="text-amber-600 font-mono">Snapchat Bar</span>
              </div>
            </div>

            {/* Polaroid 4 */}
            <div className="polaroid-card rounded-2xl p-3 sm:p-4 rotate-[3deg] transform hover:rotate-0 transition-transform md:-translate-y-2">
              <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-stone-900 flex flex-col items-center justify-center text-white text-center p-3 border border-stone-800">
                <div className="absolute top-2 left-2 rounded-full bg-purple-600 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                  Day 365
                </div>
                <div className="h-20 w-20 rounded-full border-2 border-dashed border-purple-500/80 flex items-center justify-center mb-2">
                  <Sparkles className="h-8 w-8 text-purple-400" />
                </div>
                <div className="absolute bottom-3 inset-x-2 bg-black/70 backdrop-blur-xs py-1 px-2 rounded-lg text-[10px] font-semibold text-white">
                  Full Year Cinema • Dec 31
                </div>
              </div>
              <div className="mt-2.5 px-1 flex justify-between items-center text-[11px] font-serif-editorial text-[#78716c]">
                <span>Frame #365</span>
                <span className="text-purple-600 font-mono">15 FPS Export</span>
              </div>
            </div>
          </div>

          {/* Editorial Stamps Overlaid */}
          <div className="hidden sm:flex absolute -bottom-6 left-8 items-center gap-2 rounded-2xl bg-[#1c1917] px-4 py-2 text-white shadow-xl border border-stone-800 -rotate-3">
            <Eye className="h-4 w-4 text-[#c27838]" />
            <span className="text-xs font-mono font-bold tracking-tight">
              EYE-AXIS LOCK: 50% X • 38% Y
            </span>
          </div>

          <div className="hidden sm:flex absolute -top-4 right-8 items-center gap-2 rounded-2xl bg-white px-4 py-2 text-[#1c1917] shadow-xl border border-[#e7e1d3] rotate-3">
            <Database className="h-4 w-4 text-[#c27838]" />
            <span className="text-xs font-semibold tracking-tight">
              MongoDB Atlas Cloud Sync
            </span>
          </div>
        </div>
      </section>

      {/* Infinite Golden Marquee Ribbon */}
      <section className="border-y border-[#e7e1d3] bg-[#f5f1e8] py-4 overflow-hidden">
        <div className="animate-marquee flex items-center gap-8 whitespace-nowrap text-xs font-bold uppercase tracking-widest text-[#78716c]">
          <span className="flex items-center gap-2 text-[#c27838]">
            <Sparkles className="h-3.5 w-3.5" /> 365 DAILY FRAMES
          </span>
          <span>•</span>
          <span>REAL-TIME COMPUTER VISION EYE LEVELING</span>
          <span>•</span>
          <span className="text-[#1c1917]">ONION-SKIN GHOST REFERENCE LAYER</span>
          <span>•</span>
          <span>80% LOSSLESS WEBP COMPRESSION</span>
          <span>•</span>
          <span className="text-[#c27838]">MONGODB ATLAS HYBRID SYNC</span>
          <span>•</span>
          <span>100% OFFLINE CAPABLE PWA</span>
          <span>•</span>
          <span className="text-[#1c1917]">CINEMATIC 15 FPS VIDEO RENDERER</span>
          <span>•</span>
          <span>PHONE • LAPTOP • IPAD OPTIMIZED</span>
          <span>•</span>
          {/* Repeated for smooth loop */}
          <span className="flex items-center gap-2 text-[#c27838]">
            <Sparkles className="h-3.5 w-3.5" /> 365 DAILY FRAMES
          </span>
          <span>•</span>
          <span>REAL-TIME COMPUTER VISION EYE LEVELING</span>
          <span>•</span>
          <span className="text-[#1c1917]">ONION-SKIN GHOST REFERENCE LAYER</span>
          <span>•</span>
          <span>80% LOSSLESS WEBP COMPRESSION</span>
          <span>•</span>
          <span className="text-[#c27838]">MONGODB ATLAS HYBRID SYNC</span>
          <span>•</span>
        </div>
      </section>

      {/* Interactive Timelapse Experience Section */}
      <section id="interactive-demo" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f1e8] px-3 py-1 text-xs font-semibold text-[#c27838] border border-[#e7e1d3]">
            <Film className="h-3.5 w-3.5" />
            <span>Interactive Simulator</span>
          </div>
          <h2 className="font-serif-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[#1c1917]">
            Witness the steady flow of time.
          </h2>
          <p className="text-xs sm:text-sm text-[#78716c]">
            Scrub the timeline or press play to experience how automatic eye-alignment transforms daily snapshots into smooth, movie-grade progression.
          </p>
        </div>

        {/* Live Interactive Simulator Console */}
        <div className="mx-auto max-w-4xl rounded-3xl border border-[#e7e1d3] bg-white p-6 sm:p-8 shadow-2xl shadow-stone-900/5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left: Interactive Preview Frame */}
            <div className="md:col-span-7 flex justify-center">
              <div className="relative aspect-9/16 w-full max-w-[280px] sm:max-w-[320px] rounded-3xl overflow-hidden bg-stone-950 shadow-2xl border-4 border-stone-900 flex flex-col justify-between p-4">
                {/* Top Status */}
                <div className="flex items-center justify-between z-10">
                  <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-mono font-bold text-white border border-white/10">
                    Day {activeDemo.day} of 365
                  </span>
                  <span className="rounded-full bg-[#c27838] px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    {activeDemo.date}
                  </span>
                </div>

                {/* Face & Landmark Simulation */}
                <div className="relative flex flex-1 items-center justify-center my-auto">
                  {/* Ghost Layer (Onion Skin) */}
                  <div
                    style={{ opacity: ghostDemoOpacity }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity"
                  >
                    <div className="h-44 w-36 rounded-[45%] border-2 border-dashed border-stone-600 bg-stone-800/40 flex flex-col items-center justify-center">
                      <div className="flex gap-8 mb-4">
                        <div className="h-3 w-3 rounded-full bg-stone-500" />
                        <div className="h-3 w-3 rounded-full bg-stone-500" />
                      </div>
                      <div className="h-1.5 w-8 rounded-full bg-stone-500" />
                    </div>
                  </div>

                  {/* Active Aligned Face Graphic */}
                  <div className="relative z-10 flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <div
                      style={{
                        borderColor: `hsl(${activeDemo.avatarHue}, 70%, 55%)`,
                        backgroundColor: `hsl(${activeDemo.avatarHue}, 60%, 15%)`,
                      }}
                      className="h-48 w-40 rounded-[48%] border-2 flex flex-col items-center justify-center shadow-lg transition-all duration-300 relative"
                    >
                      {/* Eyes Level */}
                      <div className="flex gap-10 mb-4 items-center">
                        <div className="relative flex items-center justify-center">
                          <div className="h-4 w-4 rounded-full bg-white flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-stone-900" />
                          </div>
                          {showCrosshairs && (
                            <div className="absolute h-8 w-8 rounded-full border border-[#c27838]/60 animate-ping pointer-events-none" />
                          )}
                        </div>

                        <div className="relative flex items-center justify-center">
                          <div className="h-4 w-4 rounded-full bg-white flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-stone-900" />
                          </div>
                          {showCrosshairs && (
                            <div className="absolute h-8 w-8 rounded-full border border-[#c27838]/60 animate-ping pointer-events-none" />
                          )}
                        </div>
                      </div>

                      {/* Nose & Smile */}
                      <div className="h-3 w-1 bg-stone-400 rounded-full mb-3" />
                      <div className="h-2 w-10 border-b-2 border-white rounded-full" />
                    </div>
                  </div>

                  {/* Alignment Crosshairs Guide */}
                  {showCrosshairs && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="absolute top-[38%] left-0 right-0 border-t border-dashed border-[#c27838]" />
                      <span className="absolute top-[38%] left-2 -translate-y-4 text-[8px] font-mono text-[#c27838] font-bold bg-black/80 px-1 py-0.5 rounded">
                        EYE LEVEL (38%)
                      </span>
                      <div className="absolute top-0 bottom-0 left-1/2 border-l border-dashed border-[#c27838]/70" />
                    </div>
                  )}
                </div>

                {/* Snapchat Style Overlay Caption Bar */}
                <div className="z-10 bg-black/75 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl border border-white/10 text-center shadow-lg">
                  <p className="text-xs font-semibold tracking-wide">
                    {activeDemo.caption}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Scrubber & Interactive Controls */}
            <div className="md:col-span-5 space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#c27838]">
                  Frame {currentFrameIdx + 1} of {DEMO_FRAMES.length}
                </span>
                <h3 className="font-serif-editorial text-2xl font-bold text-[#1c1917] mt-1">
                  {activeDemo.date}
                </h3>
                <p className="text-xs text-[#78716c] mt-1 italic font-serif-editorial">
                  &ldquo;{activeDemo.quote}&rdquo;
                </p>
              </div>

              {/* Slider Scrubber */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-[#1c1917]">
                  <span>Timeline Progression</span>
                  <span className="text-[#c27838]">Day {activeDemo.day}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={DEMO_FRAMES.length - 1}
                  step="1"
                  value={currentFrameIdx}
                  onChange={(e) => {
                    setCurrentFrameIdx(Number(e.target.value));
                    setIsPlayingDemo(false);
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#78716c]">
                  <span>Day 1</span>
                  <span>Day 180</span>
                  <span>Day 365</span>
                </div>
              </div>

              {/* Interactive Toggles */}
              <div className="space-y-3 pt-2 border-t border-[#e7e1d3]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#1c1917]">Ghost Layer Opacity</span>
                  <span className="text-xs font-mono font-bold text-[#c27838]">
                    {Math.round(ghostDemoOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ghostDemoOpacity}
                  onChange={(e) => setGhostDemoOpacity(Number(e.target.value))}
                  className="w-full"
                />

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-medium text-[#1c1917]">Face Alignment Guides</span>
                  <button
                    type="button"
                    onClick={() => setShowCrosshairs(!showCrosshairs)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                      showCrosshairs
                        ? 'bg-[#c27838] text-white'
                        : 'bg-[#f5f1e8] text-[#78716c]'
                    }`}
                  >
                    {showCrosshairs ? 'Guides Active' : 'Hidden'}
                  </button>
                </div>
              </div>

              {/* Playback Controls & CTA */}
              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlayingDemo(!isPlayingDemo)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#c27838] py-3 text-xs sm:text-sm font-semibold text-white shadow-md hover:bg-[#a85d26] transition-all cursor-pointer"
                >
                  {isPlayingDemo ? (
                    <>
                      <Pause className="h-4 w-4" />
                      <span>Pause Timelapse</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>Play 15 FPS Timelapse</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentFrameIdx(0);
                    setIsPlayingDemo(false);
                  }}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e7e1d3] bg-[#fbf9f5] text-[#1c1917] hover:bg-[#f5f1e8] transition-all cursor-pointer"
                  title="Reset to Day 1"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Maximalist Feature Bento Grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 border-t border-[#e7e1d3]">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#c27838]">
            Craftsmanship & Precision
          </span>
          <h2 className="font-serif-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[#1c1917]">
            Built like an editorial atelier.
          </h2>
          <p className="text-xs sm:text-sm text-[#78716c]">
            Every single feature has been engineered for zero-friction daily ritual, maximum privacy, and flawless timelapse continuity.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Zero-Manual Eye Alignment */}
          <div className="md:col-span-2 rounded-3xl border border-[#e7e1d3] bg-white p-8 shadow-sm hover:border-[#c27838] transition-all group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f1e8] text-[#c27838] border border-[#e7e1d3]">
                <Eye className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-bold text-amber-800">
                100% Automatic
              </span>
            </div>
            <h3 className="font-serif-editorial text-2xl font-bold text-[#1c1917] mb-2">
              Automatic Eye & Landmark Normalization
            </h3>
            <p className="text-xs sm:text-sm text-[#78716c] leading-relaxed max-w-xl mb-6">
              No manual nudge or guesswork required. The integrated computer vision engine instantly locates ocular coordinates, centers the face horizontally at 50%, and anchors eye level at 38% height for butter-smooth morphing.
            </p>
            <div className="rounded-2xl bg-[#1c1917] p-4 text-xs font-mono text-[#c27838] flex items-center justify-between border border-stone-800">
              <span>Target: Center [50.0% X] • Eye-Anchor [38.0% Y]</span>
              <span className="text-emerald-400 font-bold">✓ AUTO LOCKED</span>
            </div>
          </div>

          {/* Card 2: Lossless WebP Compression */}
          <div className="rounded-3xl border border-[#e7e1d3] bg-white p-8 shadow-sm hover:border-[#c27838] transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f1e8] text-[#c27838] border border-[#e7e1d3]">
                <Zap className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-800">
                80% Savings
              </span>
            </div>
            <h3 className="font-serif-editorial text-xl font-bold text-[#1c1917] mb-2">
              Lossless Compression
            </h3>
            <p className="text-xs text-[#78716c] leading-relaxed mb-4">
              High-density WebP encoding preserves 100% edge sharpness, color depth, and full resolution while drastically shrinking file sizes to ~180KB.
            </p>
            <div className="rounded-2xl bg-[#f5f1e8] p-3 text-center border border-[#e7e1d3]">
              <span className="text-xs font-bold text-[#1c1917]">512 MB = 2,500+ Daily Photos</span>
            </div>
          </div>

          {/* Card 3: Snapchat Caption Bar */}
          <div className="rounded-3xl border border-[#e7e1d3] bg-white p-8 shadow-sm hover:border-[#c27838] transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f1e8] text-[#c27838] border border-[#e7e1d3]">
                <Sliders className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-[11px] font-bold text-purple-800">
                Overlay Bar
              </span>
            </div>
            <h3 className="font-serif-editorial text-xl font-bold text-[#1c1917] mb-2">
              Snapchat Style Captions
            </h3>
            <p className="text-xs text-[#78716c] leading-relaxed mb-4">
              Draggable frosted black overlay bar with dynamic day counters and customizable date stamps burned directly into video frames.
            </p>
            <div className="rounded-xl bg-black/80 text-white text-[11px] font-semibold text-center py-2 px-3">
              Day 142 • New haircut today ✂️
            </div>
          </div>

          {/* Card 4: Onion-Skin Ghost Layer */}
          <div className="rounded-3xl border border-[#e7e1d3] bg-white p-8 shadow-sm hover:border-[#c27838] transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f1e8] text-[#c27838] border border-[#e7e1d3]">
                <Layers className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-[11px] font-bold text-blue-800">
                Precision Guide
              </span>
            </div>
            <h3 className="font-serif-editorial text-xl font-bold text-[#1c1917] mb-2">
              Onion-Skin Ghosting
            </h3>
            <p className="text-xs text-[#78716c] leading-relaxed mb-4">
              Overlay the previous day&apos;s photo with adjustable opacity to match head tilt, angle, and facial perspective with zero drift.
            </p>
            <div className="rounded-2xl bg-[#f5f1e8] p-3 text-center border border-[#e7e1d3]">
              <span className="text-xs font-mono text-[#78716c]">Ghost Match: 0% → 100%</span>
            </div>
          </div>

          {/* Card 5: MongoDB Cloud Sync */}
          <div className="rounded-3xl border border-[#e7e1d3] bg-white p-8 shadow-sm hover:border-[#c27838] transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f1e8] text-[#c27838] border border-[#e7e1d3]">
                <Database className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-bold text-emerald-800">
                Atlas Connected
              </span>
            </div>
            <h3 className="font-serif-editorial text-xl font-bold text-[#1c1917] mb-2">
              Hybrid Cloud Sync
            </h3>
            <p className="text-xs text-[#78716c] leading-relaxed mb-4">
              Instant offline IndexedDB local speed coupled with background MongoDB Atlas replication across Phone, Laptop, and iPad.
            </p>
            <div className="rounded-2xl bg-emerald-50 p-3 text-center border border-emerald-200">
              <span className="text-xs font-semibold text-emerald-800">1-Click Multi-Device Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophical Quote Block */}
      <section className="border-t border-[#e7e1d3] bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-10 w-10 rounded-full bg-[#f5f1e8] border border-[#e7e1d3] flex items-center justify-center text-[#c27838]">
              <Compass className="h-5 w-5" />
            </div>
          </div>
          <blockquote className="font-serif-editorial text-2xl sm:text-4xl font-normal italic text-[#1c1917] leading-relaxed">
            &ldquo;We do not remember days, we remember moments — and the imperceptible drift of who we were into who we are becoming.&rdquo;
          </blockquote>
          <div className="text-xs font-mono uppercase tracking-widest text-[#78716c]">
            YEARBOOK ATELIER • 365 DAYS CHRONICLE
          </div>
        </div>
      </section>

      {/* Bottom Maximalist CTA */}
      <section className="border-t border-[#e7e1d3] bg-[#fbf9f5] py-20">
        <div className="mx-auto max-w-4xl px-4 text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#1c1917] px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#c27838]" />
            <span>Ready to begin Day 1?</span>
          </div>

          <h2 className="font-serif-editorial text-4xl sm:text-6xl font-bold tracking-tight text-[#1c1917]">
            Your lifetime timelapse starts with today&apos;s photo.
          </h2>

          <p className="text-sm sm:text-base text-[#78716c] max-w-xl mx-auto">
            Create your first yearbook project, upload a photo, and experience the zero-manual alignment engine in seconds.
          </p>

          <div className="pt-4 flex justify-center">
            <button
              onClick={onEnterApp}
              className="group flex items-center gap-3 rounded-2xl bg-[#c27838] px-10 py-5 text-base sm:text-lg font-semibold text-white shadow-2xl shadow-[#c27838]/25 hover:bg-[#a85d26] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="h-5 w-5" />
              <span>Launch Yearbook Studio</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Maximalist Footer */}
      <footer className="border-t border-[#e7e1d3] bg-white py-12 text-center text-xs text-[#78716c]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden shadow-xs ring-1 ring-[#c27838]/30">
              <img
                src="/icons/icon-192.png"
                alt="Yearbook Crest"
                className="h-full w-full object-cover"
              />
            </div>
            <span className="font-display text-base font-bold text-[#1c1917]">
              Year<span className="text-[#c27838]">book</span>
            </span>
            <span>•</span>
            <span className="text-[#c27838] font-medium">Daily Photo Growth Atelier</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <span>100% Offline PWA</span>
            <span>•</span>
            <span>MongoDB Cloud Sync</span>
            <span>•</span>
            <span>Lossless WebP</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
