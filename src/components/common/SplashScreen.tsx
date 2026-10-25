import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check for user's motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      onComplete();
      return;
    }

    // Run concise 800ms presentation (within the 600ms - 1000ms range requirement)
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 750);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 950);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading FaultLens AI"
      onClick={() => onComplete()}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#080B12] text-white select-none transition-opacity duration-200 cursor-pointer ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle Background Radial Glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-purple-900/15 via-indigo-900/10 to-cyan-900/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-md px-6 space-y-5">
        {/* Animated Connected Nodes & Brand Glyph */}
        <div className="relative flex items-center justify-center">
          {/* Animated node waveform backdrop */}
          <svg
            className="w-28 h-28 absolute text-purple-500/20 animate-pulse"
            viewBox="0 0 100 100"
            fill="none"
          >
            <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="50" cy="50" r="28" stroke="#22D3EE" strokeWidth="0.8" strokeOpacity="0.4" />
            <circle cx="20" cy="35" r="3" fill="#8B5CF6" />
            <circle cx="80" cy="35" r="3" fill="#22D3EE" />
            <circle cx="35" cy="80" r="2.5" fill="#8B5CF6" />
            <circle cx="65" cy="80" r="2.5" fill="#22D3EE" />
            <line x1="20" y1="35" x2="50" y2="50" stroke="#8B5CF6" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="80" y1="35" x2="50" y2="50" stroke="#22D3EE" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="35" y1="80" x2="50" y2="50" stroke="#8B5CF6" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="65" y1="80" x2="50" y2="50" stroke="#22D3EE" strokeWidth="1" strokeOpacity="0.4" />
          </svg>

          {/* Core Brand Glyph */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-purple-900/40 relative z-10">
            <Activity className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight text-white">FaultLens</h1>
            <span className="text-xs uppercase font-extrabold tracking-widest px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
              AI
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Predict Failures. Trace Dependencies. Recover Before Downtime.
          </p>
        </div>

        {/* Minimal Progress Line Indicator */}
        <div className="w-44 pt-2">
          <div className="w-full bg-[#161D2B] h-1 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full w-full rounded-full animate-[flow-dash_0.8s_ease-in-out_infinite]" />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-mono">
            <span>Initializing Engine</span>
            <span>Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
