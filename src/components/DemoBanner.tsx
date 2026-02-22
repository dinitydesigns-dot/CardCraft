import { DEMO_MAX_TRIES, DEMO_TEMPLATES } from '../types';
import { Sparkles, X, ChevronRight, Zap } from 'lucide-react';

interface Props {
  triesUsed: number;
  currentTemplateIndex: number;
  onExit: () => void;
  onCycleTemplate: () => void;
  onRequestUpgrade: () => void;
}

export function DemoBanner({ triesUsed, currentTemplateIndex, onExit, onCycleTemplate, onRequestUpgrade }: Props) {
  const triesLeft = Math.max(0, DEMO_MAX_TRIES - triesUsed);
  const templateName = DEMO_TEMPLATES[currentTemplateIndex]
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const triesColors = ['text-green-400', 'text-yellow-400', 'text-orange-400', 'text-red-400'];
  const triesColor = triesColors[Math.min(triesUsed, triesColors.length - 1)];

  return (
    <div className="bg-gradient-to-r from-violet-900 via-purple-900 to-indigo-900 border-b border-violet-700/60 sticky top-0 z-50">
      {/* Main row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center gap-2">

        {/* Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-violet-500/30 border border-violet-400/40 rounded-full shrink-0">
          <Sparkles className="w-3 h-3 text-violet-300 animate-pulse" />
          <span className="text-[10px] sm:text-xs font-bold text-violet-200 uppercase tracking-wide">Demo</span>
        </div>

        {/* Tries */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1">
            {Array.from({ length: DEMO_MAX_TRIES }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center text-[8px] sm:text-[9px] font-black transition-all ${
                  i < triesUsed
                    ? 'border-gray-600 bg-gray-700 text-gray-500'
                    : 'border-violet-400 bg-violet-500/30 text-violet-200'
                }`}
              >
                {i < triesUsed ? '✓' : i + 1}
              </div>
            ))}
          </div>
          <span className={`text-xs font-bold ${triesColor}`}>{triesLeft}</span>
        </div>

        {/* Template switcher — hidden on very small screens */}
        <button
          onClick={onCycleTemplate}
          className="hidden xs:flex items-center gap-1 px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold text-white transition-all group shrink-0"
        >
          <span className="hidden sm:inline">{templateName}</span>
          <span className="sm:hidden">Template</span>
          <ChevronRight className="w-3 h-3 text-purple-300 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Upgrade + exit */}
        <button
          onClick={onRequestUpgrade}
          className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 active:scale-95 text-gray-900 rounded-lg text-xs font-bold shadow-md transition-all shrink-0"
        >
          <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="hidden xs:inline">Get Full Access</span>
          <span className="xs:hidden">Upgrade</span>
        </button>

        <button
          onClick={onExit}
          title="Exit demo"
          className="text-purple-400 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-violet-900/60">
        <div
          className="h-full bg-gradient-to-r from-violet-400 to-purple-400 transition-all duration-700"
          style={{ width: `${(triesLeft / DEMO_MAX_TRIES) * 100}%` }}
        />
      </div>
    </div>
  );
}
