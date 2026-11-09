import React, { useState, useCallback } from 'react';
import {
  MagneticSource,
  VisualSettings,
  FieldProbe,
  Vector2D,
  Preset,
  SourceType,
} from './types/physics';
import { PRESETS } from './physics/presets';
import { SimulationCanvas } from './components/SimulationCanvas';
import { TopBar } from './components/TopBar';
import { SelectedSourcePanel } from './components/SelectedSourcePanel';
import { VisualSettingsPanel } from './components/VisualSettingsPanel';
import { ProbeCard } from './components/ProbeCard';
import { PresetsModal } from './components/PresetsModal';
import { EducationalModal } from './components/EducationalModal';
import {
  Sparkles,
  RotateCcw,
  Layers,
  Compass,
  Sliders,
  Info,
} from 'lucide-react';

export default function App() {
  // Initial magnet setup: A classic bar magnet and a horseshoe magnet ready to experiment
  const [sources, setSources] = useState<MagneticSource[]>([
    {
      id: 'bar_init',
      type: 'bar',
      x: 360,
      y: 340,
      rotation: 0,
      strength: 1.2,
      flipped: false,
      width: 150,
      height: 42,
      label: 'Magnete a Barra',
    },
    {
      id: 'hs_init',
      type: 'horseshoe',
      x: 680,
      y: 340,
      rotation: Math.PI / 2, // opening facing left towards the bar
      strength: 1.3,
      flipped: false,
      width: 140,
      height: 150,
      gap: 52,
      armThickness: 28,
      label: 'Ferro di Cavallo',
    },
  ]);

  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Visual settings state
  const [visualSettings, setVisualSettings] = useState<VisualSettings>({
    showFieldLines: true,
    fieldLineDensity: 110,
    fieldLineStepSize: 5,
    maxLineSteps: 280,
    animatedFlow: true,
    vectorMode: 'needles',
    vectorGridSpacing: 38,
    colorByMagnitude: true,
    showHeatmap: false,
    heatmapOpacity: 0.8,
    showEquipotential: false,
    showProbe: true,
  });

  // Interactive field measurement probe
  const [probe, setProbe] = useState<FieldProbe>({
    x: 520,
    y: 220,
    active: true,
  });

  // User custom field lines (created via Shift+Click)
  const [customSeeds, setCustomSeeds] = useState<Vector2D[]>([]);

  // Modals & Panels visibility
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);

  // Selected source reference
  const selectedSource = sources.find((s) => s.id === selectedSourceId) || null;

  // Add a new magnetic source
  const handleAddSource = useCallback((type: SourceType) => {
    const newId = `src_${Date.now()}`;
    // Position in visible center
    const defaultX = 480 + (Math.random() * 80 - 40);
    const defaultY = 320 + (Math.random() * 80 - 40);

    let newSource: MagneticSource;

    if (type === 'bar') {
      newSource = {
        id: newId,
        type: 'bar',
        x: defaultX,
        y: defaultY,
        rotation: 0,
        strength: 1.2,
        flipped: false,
        width: 150,
        height: 42,
        label: `Barra ${sources.length + 1}`,
      };
    } else if (type === 'horseshoe') {
      newSource = {
        id: newId,
        type: 'horseshoe',
        x: defaultX,
        y: defaultY,
        rotation: 0,
        strength: 1.4,
        flipped: false,
        width: 140,
        height: 150,
        gap: 52,
        armThickness: 28,
        label: `Ferro Cavallo ${sources.length + 1}`,
      };
    } else {
      newSource = {
        id: newId,
        type: 'wire',
        x: defaultX,
        y: defaultY,
        rotation: 0,
        strength: 1.5,
        flipped: false,
        radius: 20,
        currentDirection: 1,
        label: `Filo ${sources.length + 1}`,
      };
    }

    setSources((prev) => [...prev, newSource]);
    setSelectedSourceId(newId);
    setActivePresetId(null);
  }, [sources.length]);

  // Update source properties
  const handleUpdateSource = useCallback((id: string, updates: Partial<MagneticSource>) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? ({ ...s, ...updates } as MagneticSource) : s))
    );
  }, []);

  // Delete source
  const handleDeleteSource = useCallback((id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
    setSelectedSourceId((curr) => (curr === id ? null : curr));
  }, []);

  // Duplicate source
  const handleDuplicateSource = useCallback((src: MagneticSource) => {
    const newId = `src_${Date.now()}`;
    const cloned: MagneticSource = {
      ...src,
      id: newId,
      x: src.x + 35,
      y: src.y + 35,
      label: src.label ? `${src.label} (copia)` : undefined,
    };
    setSources((prev) => [...prev, cloned]);
    setSelectedSourceId(newId);
  }, []);

  // Update visual settings
  const handleUpdateVisualSettings = useCallback((updates: Partial<VisualSettings>) => {
    setVisualSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  // Load a preset
  const handleSelectPreset = useCallback((preset: Preset) => {
    // Clone sources so they have fresh state
    const clonedSources = preset.sources.map((s) => ({ ...s }));
    setSources(clonedSources);
    setSelectedSourceId(clonedSources[0]?.id || null);
    setActivePresetId(preset.id);
    setCustomSeeds([]);
  }, []);

  // Clear canvas
  const handleClearCanvas = useCallback(() => {
    setSources([]);
    setSelectedSourceId(null);
    setCustomSeeds([]);
    setActivePresetId(null);
  }, []);

  // Export screenshot as PNG
  const handleExportPNG = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `campo_magnetico_2d_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* 1. Universal Top Navigation Bar */}
      <TopBar
        onOpenPresets={() => setIsPresetsModalOpen(true)}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onToggleProbe={() =>
          setVisualSettings((prev) => ({ ...prev, showProbe: !prev.showProbe }))
        }
        isProbeActive={visualSettings.showProbe}
        onToggleSettingsPanel={() => setIsSettingsPanelOpen((prev) => !prev)}
        isSettingsPanelOpen={isSettingsPanelOpen}
        onAddSource={handleAddSource}
        onExportImage={handleExportPNG}
      />

      {/* 2. Main Simulation Canvas Workspace */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <SimulationCanvas
          sources={sources}
          selectedSourceId={selectedSourceId}
          onSelectSource={setSelectedSourceId}
          onUpdateSource={handleUpdateSource}
          visualSettings={visualSettings}
          probe={probe}
          onUpdateProbe={setProbe}
          customSeeds={customSeeds}
          onAddCustomSeed={(seed) => setCustomSeeds((prev) => [...prev, seed])}
          onClearCustomSeeds={() => setCustomSeeds([])}
        />

        {/* Floating Left Dock: Visual Settings Panel (collapsible) */}
        {isSettingsPanelOpen && (
          <div className="absolute top-4 left-4 z-20 transition-all">
            <VisualSettingsPanel
              settings={visualSettings}
              onUpdateSettings={handleUpdateVisualSettings}
              hasCustomSeeds={customSeeds.length > 0}
              onClearCustomSeeds={() => setCustomSeeds([])}
            />
          </div>
        )}

        {/* Floating Right Dock: Selected Magnet Inspector Panel */}
        {selectedSource && (
          <div className="absolute top-4 right-4 z-20 transition-all">
            <SelectedSourcePanel
              source={selectedSource}
              onUpdate={handleUpdateSource}
              onDelete={handleDeleteSource}
              onDuplicate={handleDuplicateSource}
              onClose={() => setSelectedSourceId(null)}
            />
          </div>
        )}

        {/* Floating Measurement Probe HUD Card */}
        {visualSettings.showProbe && (
          <div className="absolute bottom-4 right-4 z-20 transition-all">
            <ProbeCard
              probe={probe}
              sources={sources}
              onClose={() => handleUpdateVisualSettings({ showProbe: false })}
              onResetPosition={() => setProbe((p) => ({ ...p, x: 480, y: 320 }))}
            />
          </div>
        )}

        {/* Floating Bottom Quick Bar for fast student/teacher exploration */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl text-xs">
          {/* Quick presets button */}
          <button
            onClick={() => setIsPresetsModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Scenari ({PRESETS.length})</span>
          </button>

          <span className="text-slate-700">|</span>

          {/* Quick toggle field lines */}
          <button
            onClick={() =>
              handleUpdateVisualSettings({ showFieldLines: !visualSettings.showFieldLines })
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              visualSettings.showFieldLines
                ? 'bg-sky-500/20 text-sky-300 font-medium'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Linee B</span>
          </button>

          {/* Quick toggle vector needles / filings */}
          <button
            onClick={() => {
              const nextMode =
                visualSettings.vectorMode === 'needles'
                  ? 'arrows'
                  : visualSettings.vectorMode === 'arrows'
                  ? 'filings'
                  : visualSettings.vectorMode === 'filings'
                  ? 'none'
                  : 'needles';
              handleUpdateVisualSettings({ vectorMode: nextMode });
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>
              {visualSettings.vectorMode === 'needles'
                ? 'Bussole'
                : visualSettings.vectorMode === 'arrows'
                ? 'Frecce'
                : visualSettings.vectorMode === 'filings'
                ? 'Limatura'
                : 'Vettori: Off'}
            </span>
          </button>

          <span className="text-slate-700">|</span>

          {/* Toggle tools panel */}
          <button
            onClick={() => setIsSettingsPanelOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
              isSettingsPanelOpen
                ? 'bg-sky-500/20 text-sky-300 font-medium'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>Strumenti</span>
          </button>

          <span className="text-slate-700">|</span>

          {/* Clear all sources button */}
          <button
            onClick={handleClearCanvas}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors"
            title="Svuota la tela"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Azzera</span>
          </button>
        </div>

        {/* Empty canvas help banner if no sources present */}
        {sources.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl text-center max-w-md pointer-events-auto backdrop-blur-md">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mx-auto mb-3">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Tela Vuota</h3>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Non c&apos;è alcuna sorgente di campo magnetico sulla tela. Scegli uno scenario o aggiungi un nuovo magnete per visualizzare le linee di forza.
              </p>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setIsPresetsModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors"
                >
                  Scegli uno Scenario
                </button>
                <button
                  onClick={() => handleAddSource('bar')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  + Aggiungi Barra
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 3. Educational Modals */}
      <PresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        onSelectPreset={handleSelectPreset}
        activePresetId={activePresetId}
      />

      <EducationalModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
}
