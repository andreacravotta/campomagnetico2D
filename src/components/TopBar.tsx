import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Sparkles,
  BookOpen,
  Camera,
  Compass,
  Sliders,
  Magnet,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { SourceType } from '../types/physics';

interface TopBarProps {
  onOpenPresets: () => void;
  onOpenGuide: () => void;
  onToggleProbe: () => void;
  isProbeActive: boolean;
  onToggleSettingsPanel: () => void;
  isSettingsPanelOpen: boolean;
  onAddSource: (type: SourceType) => void;
  onExportImage: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenPresets,
  onOpenGuide,
  onToggleProbe,
  isProbeActive,
  onToggleSettingsPanel,
  isSettingsPanelOpen,
  onAddSource,
  onExportImage,
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="relative z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shrink-0">
      {/* Zone 1: Brand title (one line, single element wordmark) */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 via-blue-500 to-rose-500 flex items-center justify-center shadow-md">
          <Magnet className="w-4 h-4 text-white -rotate-45" />
        </div>
        <span className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0 font-sans">
          Visualizzatore Campo Magnetico 2D
        </span>
      </div>

      {/* Zone 2: 4-5 concise single-line nav links */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-300">
        <button
          onClick={onOpenPresets}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 py-1"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Preset Scenari</span>
        </button>

        <button
          onClick={onToggleSettingsPanel}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 ${
            isSettingsPanelOpen ? 'text-sky-400 font-semibold' : 'hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          <span>Strumenti Vista</span>
        </button>

        <button
          onClick={onToggleProbe}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 ${
            isProbeActive ? 'text-sky-400 font-semibold' : 'hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>Sonda Misura</span>
        </button>

        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 py-1"
        >
          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
          <span>Guida Fisica</span>
        </button>

        <button
          onClick={onExportImage}
          className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 text-slate-400"
          title="Salva uno screenshot ad alta risoluzione"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Esporta PNG</span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="relative shrink-0" ref={addMenuRef}>
        <button
          onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Aggiungi Magnete</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAddMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isAddMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 text-xs">
            <button
              onClick={() => {
                onAddSource('bar');
                setIsAddMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors text-left"
            >
              <div className="w-7 h-4 rounded bg-gradient-to-r from-blue-600 to-red-600 flex items-center justify-between px-1 text-[8px] font-bold text-white shrink-0">
                <span>S</span>
                <span>N</span>
              </div>
              <div>
                <div className="font-semibold text-slate-100">Magnete a Barra</div>
                <div className="text-[10px] text-slate-400">Classico dipolo rettangolare</div>
              </div>
            </button>

            <button
              onClick={() => {
                onAddSource('horseshoe');
                setIsAddMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors text-left"
            >
              <div className="w-7 h-5 rounded-t-none rounded-b-md border-2 border-slate-700 border-t-0 flex items-start justify-between px-0.5 text-[8px] font-bold shrink-0">
                <span className="text-red-500">N</span>
                <span className="text-blue-500">S</span>
              </div>
              <div>
                <div className="font-semibold text-slate-100">Ferro di Cavallo</div>
                <div className="text-[10px] text-slate-400">Forte campo nel traferro</div>
              </div>
            </button>

            <button
              onClick={() => {
                onAddSource('wire');
                setIsAddMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors text-left"
            >
              <div className="w-5 h-5 rounded-full bg-amber-600 flex items-center justify-center font-bold text-[10px] text-slate-950 shrink-0">
                ⊙
              </div>
              <div>
                <div className="font-semibold text-slate-100">Filo con Corrente</div>
                <div className="text-[10px] text-slate-400">Linee circolari concentriche</div>
              </div>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
