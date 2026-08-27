'use client';

import React from 'react';

export function TechStackFloatingIcons() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 select-none">
      {/* 1. React (Top Left - Cyan Glow, Rotating Atom) */}
      <div className="absolute top-[8%] left-[7%] animate-drift-1 opacity-20 dark:opacity-25 hover:opacity-40 transition-opacity duration-700 hidden lg:block drop-shadow-[0_20px_40px_rgba(0,216,255,0.45)]">
        <svg className="w-32 h-32 text-[#00d8ff] animate-[spin_20s_linear_infinite]" viewBox="-11.5 -10.23174 23 20.46348">
          <circle cx="0" cy="0" r="2.05" fill="#00d8ff" />
          <g stroke="#00d8ff" strokeWidth="1" fill="none">
            <ellipse rx="11" ry="4.2" />
            <ellipse rx="11" ry="4.2" transform="rotate(60)" />
            <ellipse rx="11" ry="4.2" transform="rotate(120)" />
          </g>
        </svg>
      </div>

      {/* 2. Next.js (Top Right - Sleek Monogram) */}
      <div className="absolute top-[10%] right-[9%] animate-drift-2 [animation-delay:1s] opacity-20 dark:opacity-25 hover:opacity-40 transition-opacity duration-700 hidden lg:block drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)] dark:drop-shadow-[0_20px_40px_rgba(255,255,255,0.25)]">
        <svg className="w-28 h-28 text-slate-900 dark:text-white" viewBox="0 0 180 180" fill="currentColor">
          <mask height="180" id="mask0" maskUnits="userSpaceOnUse" width="180" x="0" y="0" style={{ maskType: 'alpha' }}>
            <circle cx="90" cy="90" fill="black" r="90" />
          </mask>
          <g mask="url(#mask0)">
            <circle cx="90" cy="90" data-circle="true" fill="currentColor" r="90" />
            <path d="M149.508 157.438L69.1478 54H54V125.97H66.1136V69.3836L139.999 164.845C143.333 162.614 146.509 160.137 149.508 157.438Z" fill="url(#paint0_linear)" />
            <rect fill="url(#paint1_linear)" height="72" width="12" x="115" y="54" />
          </g>
          <defs>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear" x1="109" x2="144.5" y1="116.5" y2="160.5">
              <stop stopColor="white" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <linearGradient gradientUnits="userSpaceOnUse" id="paint1_linear" x1="121" x2="120.799" y1="54" y2="106.875">
              <stop stopColor="white" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 3. NestJS (Mid Left - Crimson Red Crest) */}
      <div className="absolute top-[42%] left-[5%] animate-drift-3 [animation-delay:2s] opacity-20 dark:opacity-25 hover:opacity-40 transition-opacity duration-700 hidden lg:block drop-shadow-[0_20px_40px_rgba(224,35,78,0.45)]">
        <svg className="w-30 h-30" viewBox="0 0 256 256" fill="none">
          <path d="M128 0L24.8 45.9V183.6L128 256L231.2 183.6V45.9L128 0Z" fill="#E0234E" fillOpacity="0.15" />
          <path d="M205.8 45.9L128 0L50.2 45.9V137.7L128 183.6L205.8 137.7V45.9Z" fill="#E0234E" />
          <path d="M128 36.7L68.6 71.8V126.9L128 162.1L187.4 126.9V71.8L128 36.7Z" fill="#FFFFFF" />
          <path d="M128 64.3L89.6 86.9V122.3L128 144.9L166.4 122.3V86.9L128 64.3Z" fill="#E0234E" />
        </svg>
      </div>

      {/* 4. Redis (Mid Right - Ruby Red Stack) */}
      <div className="absolute top-[40%] right-[6%] animate-drift-1 [animation-delay:1.5s] opacity-20 dark:opacity-25 hover:opacity-40 transition-opacity duration-700 hidden lg:block drop-shadow-[0_20px_40px_rgba(220,56,45,0.45)]">
        <svg className="w-28 h-28" viewBox="0 0 256 219" fill="none">
          <path d="M128 0L0 54.8571L128 109.714L256 54.8571L128 0Z" fill="#D82C20" />
          <path d="M0 54.8571V109.714L128 164.571V109.714L0 54.8571Z" fill="#A81D13" />
          <path d="M256 54.8571V109.714L128 164.571V109.714L256 54.8571Z" fill="#B82419" />
          <path d="M0 109.714V164.571L128 219.429V164.571L0 109.714Z" fill="#7C140C" />
          <path d="M256 109.714V164.571L128 219.429V164.571L256 109.714Z" fill="#931A11" />
        </svg>
      </div>

      {/* 5. Cloudinary (Bottom Left - Sky Blue Cloud) */}
      <div className="absolute bottom-[10%] left-[8%] animate-drift-2 [animation-delay:0.5s] opacity-20 dark:opacity-25 hover:opacity-40 transition-opacity duration-700 hidden lg:block drop-shadow-[0_20px_40px_rgba(52,72,197,0.45)]">
        <svg className="w-32 h-32 text-[#3448c5] dark:text-[#38bdf8]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
        </svg>
      </div>

      {/* 6. TailwindCSS (Bottom Right - Teal Wave Mark) */}
      <div className="absolute bottom-[12%] right-[10%] animate-drift-3 [animation-delay:2.5s] opacity-20 dark:opacity-25 hover:opacity-40 transition-opacity duration-700 hidden lg:block drop-shadow-[0_20px_40px_rgba(6,182,212,0.45)]">
        <svg className="w-32 h-32" viewBox="0 0 256 154" fill="none">
          <path d="M128 0C93.8667 0 72.5333 17.0667 64 51.2C76.8 34.1333 91.7333 27.7333 108.8 32C118.538 34.4344 125.509 41.5173 133.228 49.3591C145.799 62.1311 160.71 77.2889 192 77.2889C226.133 77.2889 247.467 60.2222 256 26.0889C243.2 43.1556 228.267 49.5556 211.2 45.2889C201.462 42.8544 194.491 35.7716 186.772 27.9298C174.201 15.1578 159.29 0 128 0ZM64 76.8C29.8667 76.8 8.53333 93.8667 0 128C12.8 110.933 27.7333 104.533 44.8 108.8C54.5376 111.234 61.5093 118.317 69.2277 126.159C81.7995 138.931 96.7104 154.089 128 154.089C162.133 154.089 183.467 137.022 192 102.889C179.2 119.956 164.267 126.356 147.2 122.089C137.462 119.654 130.491 112.572 122.772 104.73C110.201 91.9578 95.2896 76.8 64 76.8Z" fill="#06B6D4" />
        </svg>
      </div>
    </div>
  );
}
