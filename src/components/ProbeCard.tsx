import React from 'react';
import { FieldProbe, MagneticSource } from '../types/physics';
import { calculateMagneticField } from '../physics/magneticEngine';
import { Compass, Move, X } from 'lucide-react';

interface ProbeCardProps {
  probe: FieldProbe;
  sources: MagneticSource[];
  onClose: () => void;
  onResetPosition: () => void;
}

export const ProbeCard: React.FC<ProbeCardProps> = ({
  probe,
  sources,
  onClose,
  onResetPosition,
}) => {
  if (!probe.active) return null;

  const field = calculateMagneticField(probe.x, probe.y, sources);
  const magnitude = Math.sqrt(field.x * field.x + field.y * field.y);
  const angleRad = Math.atan2(field.y, field.x);
  const angleDeg = ((angleRad * 180) / Math.PI + 360) % 360;

  // Approximate physical calibration in milliTesla and Gauss
  const bMilliTesla = (magnitude * 1.5).toFixed(2);
  const bGauss = (magnitude * 15.0).toFixed(1);

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl text-slate-100 w-72 pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100">Sonda Magnetica</h4>
            <div className="text-[11px] text-slate-400 font-mono">
              X: {probe.x} · Y: {probe.y}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
          title="Chiudi sonda"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Magnitude Display */}
      <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/60 mb-3">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-1">
          Intensità del Campo |B|
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-sky-400 tabular-nums">
            {bMilliTesla}
          </span>
          <span className="text-xs text-slate-400 font-mono">mT</span>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-sm font-mono text-slate-300 tabular-nums">
            {bGauss} G
          </span>
        </div>
      </div>

      {/* Components & Direction Angle */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-950/40 rounded-lg p-2 border border-slate-800/40">
          <div className="text-[10px] text-slate-400 font-mono">Bx (Orizzontale)</div>
          <div className="text-xs font-mono font-semibold text-slate-200 tabular-nums">
            {(field.x * 1.5).toFixed(2)} mT
          </div>
        </div>
        <div className="bg-slate-950/40 rounded-lg p-2 border border-slate-800/40">
          <div className="text-[10px] text-slate-400 font-mono">By (Verticale)</div>
          <div className="text-xs font-mono font-semibold text-slate-200 tabular-nums">
            {(field.y * 1.5).toFixed(2)} mT
          </div>
        </div>
      </div>

      {/* Compass Needle Indicator & Angle */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-slate-950/40 rounded-lg border border-slate-800/40">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full border border-sky-500/40 relative flex items-center justify-center bg-slate-900"
            style={{ transform: `rotate(${angleDeg}deg)` }}
          >
            <div className="w-0.5 h-4 bg-gradient-to-t from-blue-500 via-white to-red-500 rounded-full" />
          </div>
          <span className="text-xs text-slate-300">Direzione θ:</span>
        </div>
        <span className="text-xs font-mono font-bold text-sky-300 tabular-nums">
          {angleDeg.toFixed(1)}°
        </span>
      </div>

      {/* Drag Tip */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
        <span className="flex items-center gap-1">
          <Move className="w-3 h-3 text-sky-400" /> Trascina sulla tela
        </span>
        <button
          onClick={onResetPosition}
          className="hover:text-sky-300 transition-colors underline underline-offset-2"
        >
          Riposiziona al centro
        </button>
      </div>
    </div>
  );
};
