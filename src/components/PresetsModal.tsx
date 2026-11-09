import React from 'react';
import { PRESETS } from '../physics/presets';
import { Preset } from '../types/physics';
import { X, Sparkles, Check } from 'lucide-react';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: Preset) => void;
  activePresetId?: string | null;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
  activePresetId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Configurazioni e Preset Didattici
              </h3>
              <p className="text-xs text-slate-400">
                Seleziona uno scenario sperimentale per esplorare le geometrie di campo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Cards List */}
        <div className="p-6 overflow-y-auto space-y-3">
          {PRESETS.map((preset) => {
            const isCurrent = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                  isCurrent
                    ? 'bg-sky-950/40 border-sky-500/80 shadow-md ring-1 ring-sky-500/50'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100">
                      {preset.title}
                    </span>
                    {isCurrent && (
                      <span className="text-[11px] text-sky-400 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Attivo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {preset.description}
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500 font-mono">
                    <span>{preset.sources.length} {preset.sources.length === 1 ? 'sorgente' : 'sorgenti'}</span>
                    <span>·</span>
                    <span>{preset.sources.map((s) => s.type === 'bar' ? 'Barra' : s.type === 'horseshoe' ? 'Ferro di cavallo' : 'Filo').join(', ')}</span>
                  </div>
                </div>

                <div className="shrink-0 mt-1">
                  <span className="px-3 py-1 rounded-md text-xs font-medium bg-slate-800 text-sky-300 hover:bg-sky-600 hover:text-white transition-colors">
                    Carica
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/50 text-xs text-slate-400">
          <span>Tutti gli elementi rimangono trascinabili e modificabili dopo il caricamento</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-lg transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
