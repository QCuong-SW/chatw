'use client';

import React from 'react';

const TECH_ITEMS = [
  {
    name: 'React 19',
    category: 'UI Library',
    color: '#00d8ff',
    icon: (
      <svg className="w-12 h-12 text-[#00d8ff] animate-[spin_12s_linear_infinite]" viewBox="-11.5 -10.23174 23 20.46348">
        <circle cx="0" cy="0" r="2.05" fill="#00d8ff" />
        <g stroke="#00d8ff" strokeWidth="1" fill="none">
          <ellipse rx="11" ry="4.2" />
          <ellipse rx="11" ry="4.2" transform="rotate(60)" />
          <ellipse rx="11" ry="4.2" transform="rotate(120)" />
        </g>
      </svg>
    ),
  },
  {
    name: 'Next.js 15',
    category: 'Fullstack App Router',
    color: '#ffffff',
    icon: (
      <svg className="w-11 h-11 text-slate-900 dark:text-white" viewBox="0 0 180 180" fill="currentColor">
        <mask height="180" id="m1" maskUnits="userSpaceOnUse" width="180" x="0" y="0" style={{ maskType: 'alpha' }}>
          <circle cx="90" cy="90" fill="black" r="90" />
        </mask>
        <g mask="url(#m1)">
          <circle cx="90" cy="90" fill="currentColor" r="90" />
          <path d="M149.508 157.438L69.1478 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.137 149.508 157.438Z" fill="url(#p0)" />
          <rect fill="url(#p1)" height="72" width="12" x="115" y="54" />
        </g>
        <defs>
          <linearGradient gradientUnits="userSpaceOnUse" id="p0" x1="109" x2="144.5" y1="116.5" y2="160.5">
            <stop stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <linearGradient gradientUnits="userSpaceOnUse" id="p1" x1="121" x2="120.799" y1="54" y2="106.875">
            <stop stopColor="white" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    name: 'NestJS 10',
    category: 'Node.js Framework',
    color: '#e0234e',
    icon: (
      <svg className="w-11 h-11" viewBox="0 0 256 256" fill="none">
        <path d="M128 0L24.8 45.9V183.6L128 256L231.2 183.6V45.9L128 0Z" fill="#E0234E" fillOpacity="0.2" />
        <path d="M205.8 45.9L128 0L50.2 45.9V137.7L128 183.6L205.8 137.7V45.9Z" fill="#E0234E" />
        <path d="M128 36.7L68.6 71.8V126.9L128 162.1L187.4 126.9V71.8L128 36.7Z" fill="#FFFFFF" />
        <path d="M128 64.3L89.6 86.9V122.3L128 144.9L166.4 122.3V86.9L128 64.3Z" fill="#E0234E" />
      </svg>
    ),
  },
  {
    name: 'Redis 7',
    category: 'In-Memory Cache & PubSub',
    color: '#dc382d',
    icon: (
      <svg className="w-11 h-11" viewBox="0 0 256 219" fill="none">
        <path d="M128 0L0 54.8571L128 109.714L256 54.8571L128 0Z" fill="#D82C20" />
        <path d="M0 54.8571V109.714L128 164.571V109.714L0 54.8571Z" fill="#A81D13" />
        <path d="M256 54.8571V109.714L128 164.571V109.714L256 54.8571Z" fill="#B82419" />
        <path d="M0 109.714V164.571L128 219.429V164.571L0 109.714Z" fill="#7C140C" />
        <path d="M256 109.714V164.571L128 219.429V164.571L256 109.714Z" fill="#931A11" />
      </svg>
    ),
  },
  {
    name: 'Cloudinary CDN',
    category: 'Cloud Storage & Media',
    color: '#3448c5',
    icon: (
      <svg className="w-12 h-12 text-[#3448c5] dark:text-[#38bdf8]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
      </svg>
    ),
  },
  {
    name: 'Tailwind CSS 4',
    category: 'Utility Styling',
    color: '#06b6d4',
    icon: (
      <svg className="w-12 h-12" viewBox="0 0 256 154" fill="none">
        <path d="M128 0C93.8667 0 72.5333 17.0667 64 51.2C76.8 34.1333 91.7333 27.7333 108.8 32C118.538 34.4344 125.509 41.5173 133.228 49.3591C145.799 62.1311 160.71 77.2889 192 77.2889C226.133 77.2889 247.467 60.2222 256 26.0889C243.2 43.1556 228.267 49.5556 211.2 45.2889C201.462 42.8544 194.491 35.7716 186.772 27.9298C174.201 15.1578 159.29 0 128 0ZM64 76.8C29.8667 76.8 8.53333 93.8667 0 128C12.8 110.933 27.7333 104.533 44.8 108.8C54.5376 111.234 61.5093 118.317 69.2277 126.159C81.7995 138.931 96.7104 154.089 128 154.089C162.133 154.089 183.467 137.022 192 102.889C179.2 119.956 164.267 126.356 147.2 122.089C137.462 119.654 130.491 112.572 122.772 104.73C110.201 91.9578 95.2896 76.8 64 76.8Z" fill="#06B6D4" />
      </svg>
    ),
  },
  {
    name: 'Socket.IO',
    category: 'Bi-directional Realtime',
    color: '#010101',
    icon: (
      <div className="w-11 h-11 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-black text-xl shadow-md">
        ⚡
      </div>
    ),
  },
  {
    name: 'MongoDB',
    category: 'Document Database',
    color: '#13aa52',
    icon: (
      <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center font-black text-xl shadow-md">
        🍃
      </div>
    ),
  },
];

export function TechStackMarquee() {
  return (
    <div className="w-full relative z-20 mt-auto pt-6 pb-4 overflow-hidden select-none">
      {/* Subtle Divider Label */}
      <div className="flex items-center justify-center gap-3 mb-3 px-6">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-800 to-transparent flex-1" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-200">
          Powered By Modern Technology Stack
        </span>
        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-800 to-transparent flex-1" />
      </div>

      {/* Mask Gradient Fades at Edges for Smooth Horizon Effect */}
      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="animate-marquee flex gap-4 py-2">
          {/* Loop twice for seamless infinite marquee */}
          {[...TECH_ITEMS, ...TECH_ITEMS].map((tech, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3.5 px-5 py-3 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/90 shadow-md shadow-slate-900/5 backdrop-blur-md hover:scale-105 hover:border-blue-500/50 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 cursor-pointer shrink-0 group"
            >
              <div className="shrink-0 p-1 group-hover:scale-110 transition-transform duration-300">
                {tech.icon}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {tech.name}
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-300">
                  {tech.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
