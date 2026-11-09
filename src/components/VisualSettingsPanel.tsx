import React from 'react';
import { VisualSettings, VectorDisplayMode } from '../types/physics';
import {
  Eye,
  Activity,
  Layers,
  Compass,
  Sparkles,
  Sliders,
  Flame,
  RotateCcw,
} from 'lucide-react';

interface VisualSettingsPanelProps {
  settings: VisualSettings;
  onUpdateSettings: (updates: Partial<VisualSettings>) => void;
  hasCustomSeeds: boolean;
  onClearCustomSeeds: () => void;
}

export const VisualSettingsPanel: React.FC<VisualSettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  hasCustomSeeds,
  onClearCustomSeeds,
}) => {
  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl text-slate-100 w-80 space-y-4 max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
          <Eye className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-100">Visualizzazione Campo</h4>
          <p className="text-[11px] text-slate-400">Rendering vettori e linee di forza</p>
        </div>
      </div>

      {/* 1. Field Lines Controls */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showFieldLines}
              onChange={(e) => onUpdateSettings({ showFieldLines: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span>Linee di Campo Magnetico</span>
          </label>
          <span className="text-[11px] text-sky-400 font-mono">
            {settings.showFieldLines ? 'Attive' : 'Nascoste'}
          </span>
        </div>

        {settings.showFieldLines && (
          <div className="pl-5 space-y-2.5 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Densità Linee:</span>
                <span className="font-mono text-slate-300">{settings.fieldLineDensity}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="180"
                step="10"
                value={settings.fieldLineDensity}
                onChange={(e) => onUpdateSettings({ fieldLineDensity: Number(e.target.value) })}
                className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-sky-400" /> Flusso Animato:
              </span>
              <button
                onClick={() => onUpdateSettings({ animatedFlow: !settings.animatedFlow })}
                className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                  settings.animatedFlow
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {settings.animatedFlow ? 'Attivo' : 'Fermo'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Vector Field Mode (Segmented Control) */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Modalità Campo Vettoriale:</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/70 rounded-lg border border-slate-800">
          {(
            [
              { id: 'needles', label: 'Bussole / Aghi' },
              { id: 'arrows', label: 'Frecce Vettoriali' },
              { id: 'filings', label: 'Limatura Ferro' },
              { id: 'none', label: 'Nessuno' },
            ] as { id: VectorDisplayMode; label: string }[]
          ).map((mode) => (
            <button
              key={mode.id}
              onClick={() => onUpdateSettings({ vectorMode: mode.id })}
              className={`py-1.5 px-2 rounded text-[11px] font-medium transition-all text-center truncate ${
                settings.vectorMode === mode.id
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Vector grid options if needles or arrows */}
        {(settings.vectorMode === 'needles' || settings.vectorMode === 'arrows') && (
          <div className="space-y-2 pt-1 pl-1">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Risoluzione Griglia:</span>
                <span className="font-mono text-slate-300">{settings.vectorGridSpacing} px</span>
              </div>
              <input
                type="range"
                min="24"
                max="60"
                step="4"
                value={settings.vectorGridSpacing}
                onChange={(e) => onUpdateSettings({ vectorGridSpacing: Number(e.target.value) })}
                className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-500"
              />
            </div>

            {settings.vectorMode === 'arrows' && (
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={settings.colorByMagnitude}
                  onChange={(e) => onUpdateSettings({ colorByMagnitude: e.target.checked })}
                  className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0"
                />
                <span>Colore proporzionale a |B|</span>
              </label>
            )}
          </div>
        )}
      </div>

      {/* 3. Heatmap of Field Magnitude */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showHeatmap}
              onChange={(e) => onUpdateSettings({ showHeatmap: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Mappa di Calore (|B|)
            </span>
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            {settings.showHeatmap ? 'Attiva' : 'Off'}
          </span>
        </div>
      </div>

      {/* 4. Interactive Probe Toggle */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.showProbe}
            onChange={(e) => onUpdateSettings({ showProbe: e.target.checked })}
            className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
          />
          <span className="flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-sky-400" /> Sonda Magnetica Dinamica
          </span>
        </label>
      </div>

      {/* Custom Seeds Reset */}
      {hasCustomSeeds && (
        <div className="pt-2 border-t border-slate-800/80">
          <button
            onClick={onClearCustomSeeds}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-sky-400" /> Rimuovi linee personalizzate
          </button>
        </div>
      )}
    </div>
  );
};
