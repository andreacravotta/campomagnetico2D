import React from 'react';
import { MagneticSource } from '../types/physics';
import {
  RotateCw,
  ArrowLeftRight,
  Trash2,
  Copy,
  Sliders,
  X,
  Magnet,
  Zap,
} from 'lucide-react';

interface SelectedSourcePanelProps {
  source: MagneticSource;
  onUpdate: (id: string, updates: Partial<MagneticSource>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (source: MagneticSource) => void;
  onClose: () => void;
}

export const SelectedSourcePanel: React.FC<SelectedSourcePanelProps> = ({
  source,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
}) => {
  const rotationDeg = Math.round(((source.rotation * 180) / Math.PI) % 360);
  const normalizedDeg = (rotationDeg + 360) % 360;

  const handleRotationChange = (deg: number) => {
    onUpdate(source.id, { rotation: (deg * Math.PI) / 180 });
  };

  const rotateBy = (deltaDeg: number) => {
    const nextDeg = (normalizedDeg + deltaDeg + 360) % 360;
    handleRotationChange(nextDeg);
  };

  const getSourceTypeName = () => {
    switch (source.type) {
      case 'bar':
        return 'Magnete a Barra';
      case 'horseshoe':
        return 'Magnete a Ferro di Cavallo';
      case 'wire':
        return 'Filo con Corrente';
      case 'coil':
        return 'Spira / Bobina';
      default:
        return 'Generatore di Campo';
    }
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl text-slate-100 w-80 max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            {source.type === 'wire' ? <Zap className="w-4 h-4" /> : <Magnet className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">{getSourceTypeName()}</h4>
            <div className="text-[11px] text-slate-400 font-mono">
              X: {source.x} · Y: {source.y}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          title="Deseleziona"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Action: Invert Polarity */}
      <div className="mb-4">
        <button
          onClick={() => onUpdate(source.id, { flipped: !source.flipped })}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-sky-400" />
          <span>Inverti Polarità (Poli N ↔ S)</span>
        </button>
      </div>

      {/* Rotation Control */}
      <div className="mb-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <RotateCw className="w-3.5 h-3.5 text-slate-400" /> Orientamento:
          </span>
          <span className="font-mono text-sky-400 font-semibold tabular-nums">
            {normalizedDeg}°
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="359"
          value={normalizedDeg}
          onChange={(e) => handleRotationChange(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
        />
        <div className="flex items-center justify-between gap-1 pt-1">
          <button
            onClick={() => rotateBy(-90)}
            className="flex-1 py-1 text-[11px] font-mono rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
          >
            -90°
          </button>
          <button
            onClick={() => rotateBy(-45)}
            className="flex-1 py-1 text-[11px] font-mono rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
          >
            -45°
          </button>
          <button
            onClick={() => handleRotationChange(0)}
            className="flex-1 py-1 text-[11px] font-mono rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
          >
            0°
          </button>
          <button
            onClick={() => rotateBy(45)}
            className="flex-1 py-1 text-[11px] font-mono rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
          >
            +45°
          </button>
          <button
            onClick={() => rotateBy(90)}
            className="flex-1 py-1 text-[11px] font-mono rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
          >
            +90°
          </button>
        </div>
      </div>

      {/* Field Strength Slider */}
      <div className="mb-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-slate-400" /> Intensità B₀:
          </span>
          <span className="font-mono text-sky-400 font-semibold tabular-nums">
            {source.strength.toFixed(2)}x
          </span>
        </div>
        <input
          type="range"
          min="0.2"
          max="3.0"
          step="0.1"
          value={source.strength}
          onChange={(e) => onUpdate(source.id, { strength: parseFloat(e.target.value) })}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
        />
      </div>

      {/* Dimensions Controls based on type */}
      {source.type === 'bar' && (
        <div className="space-y-3 mb-4 pt-2 border-t border-slate-800/70">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Lunghezza Barra:</span>
              <span className="font-mono text-slate-300">{source.width} px</span>
            </div>
            <input
              type="range"
              min="80"
              max="240"
              step="5"
              value={source.width}
              onChange={(e) => onUpdate(source.id, { width: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Spessore:</span>
              <span className="font-mono text-slate-300">{source.height} px</span>
            </div>
            <input
              type="range"
              min="24"
              max="64"
              step="2"
              value={source.height}
              onChange={(e) => onUpdate(source.id, { height: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>
        </div>
      )}

      {source.type === 'horseshoe' && (
        <div className="space-y-3 mb-4 pt-2 border-t border-slate-800/70">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Distanza Traferro (Gap N-S):</span>
              <span className="font-mono text-slate-300">{source.gap} px</span>
            </div>
            <input
              type="range"
              min="30"
              max="90"
              step="2"
              value={source.gap}
              onChange={(e) =>
                onUpdate(source.id, {
                  gap: parseInt(e.target.value, 10),
                  width: parseInt(e.target.value, 10) + source.armThickness * 2,
                })
              }
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Altezza complessiva:</span>
              <span className="font-mono text-slate-300">{source.height} px</span>
            </div>
            <input
              type="range"
              min="100"
              max="200"
              step="5"
              value={source.height}
              onChange={(e) => onUpdate(source.id, { height: parseInt(e.target.value, 10) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>
        </div>
      )}

      {source.type === 'wire' && (
        <div className="space-y-3 mb-4 pt-2 border-t border-slate-800/70">
          <div className="text-xs text-slate-400 mb-1">Verso della Corrente:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onUpdate(source.id, { currentDirection: 1 })}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                source.currentDirection === 1
                  ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="font-bold text-sm">⊙</span> Uscente
            </button>
            <button
              onClick={() => onUpdate(source.id, { currentDirection: -1 })}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
                source.currentDirection === -1
                  ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="font-bold text-sm">⊗</span> Entrante
            </button>
          </div>
        </div>
      )}

      {/* Duplicate & Delete Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
        <button
          onClick={() => onDuplicate(source)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
        >
          <Copy className="w-3.5 h-3.5" /> Duplica
        </button>
        <button
          onClick={() => onDelete(source.id)}
          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors"
          title="Elimina questo generatore"
        >
          <Trash2 className="w-3.5 h-3.5" /> Elimina
        </button>
      </div>
    </div>
  );
};
