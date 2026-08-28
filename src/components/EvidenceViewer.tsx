import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Layers, 
  Sliders, 
  Eye, 
  Columns, 
  Grid2X2, 
  SplitSquareVertical, 
  AlertTriangle,
  Info,
  CheckCircle2,
  MousePointerClick
} from 'lucide-react';
import { ReceiptDocument, ReceiptField } from '../types';

interface EvidenceViewerProps {
  receipt: ReceiptDocument;
  selectedField: ReceiptField | null;
  onSelectField: (field: ReceiptField) => void;
  onInspectField: (field: ReceiptField) => void;
  heatmapOpacity: number;
  setHeatmapOpacity: (val: number) => void;
  showBoundingBoxes: boolean;
  setShowBoundingBoxes: (val: boolean) => void;
  syncZoom: boolean;
  setSyncZoom: (val: boolean) => void;
}

type ViewMode = 'four_panel' | 'side_by_side' | 'split_slider' | 'single_tab';

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  receipt,
  selectedField,
  onSelectField,
  onInspectField,
  heatmapOpacity,
  setHeatmapOpacity,
  showBoundingBoxes,
  setShowBoundingBoxes,
  syncZoom,
  setSyncZoom,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('four_panel');
  const [activeSingleTab, setActiveSingleTab] = useState<'original' | 'restored' | 'heatmap' | 'overlay'>('restored');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [splitPosition, setSplitPosition] = useState<number>(50); // percentage 0-100
  const isSplitDragging = useRef(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom helpers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3.5));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.6));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };
  const handleFitScreen = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Split slider dragging
  const handleSplitMouseMove = (e: MouseEvent) => {
    if (!isSplitDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newPos = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSplitPosition(newPos);
  };

  const handleSplitMouseUp = () => {
    isSplitDragging.current = false;
    window.removeEventListener('mousemove', handleSplitMouseMove);
    window.removeEventListener('mouseup', handleSplitMouseUp);
  };

  const startSplitDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    isSplitDragging.current = true;
    window.addEventListener('mousemove', handleSplitMouseMove);
    window.addEventListener('mouseup', handleSplitMouseUp);
  };

  const panels = [
    {
      id: 'original',
      title: '1. Original Degraded Receipt',
      badge: 'Input Thermal Substrate',
      badgeColor: 'bg-slate-200 text-slate-800 border-slate-300',
      imageUrl: receipt.originalImageUrl,
      description: `Degradation: ${receipt.degradationType.replace('_', ' ')} (${receipt.degradationSeverity})`,
    },
    {
      id: 'restored',
      title: '2. Restored Receipt (Unrolled DSDNet)',
      badge: 'Unrolled DSDNet Restoration',
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
      imageUrl: receipt.restoredImageUrl,
      description: 'Reconstructed thermal strokes & ink substrate denoising',
    },
    {
      id: 'heatmap',
      title: '3. Authenticity Heatmap M_auth',
      badge: 'Pixel Authenticity Support Q_q',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      imageUrl: receipt.heatmapImageUrl,
      description: 'Pixel-level evidence density & stroke continuity',
    },
    {
      id: 'overlay',
      title: '4. Blended Evidence Overlay',
      badge: 'DSDNet + Heatmap Alpha Blend',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      imageUrl: receipt.overlayImageUrl,
      description: `Alpha blend: ${(heatmapOpacity * 100).toFixed(0)}%`,
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      {/* Control Header */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: View Mode Switches */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-700 mr-1 hidden sm:inline">View Mode:</span>
          <div className="inline-flex rounded-md shadow-xs bg-white border border-slate-200 p-0.5">
            <button
              id="btn-view-four-panel"
              onClick={() => setViewMode('four_panel')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'four_panel'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="4-Panel Grid"
            >
              <Grid2X2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">4-Panel Grid</span>
            </button>
            <button
              id="btn-view-side-by-side"
              onClick={() => setViewMode('side_by_side')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'side_by_side'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Side-by-Side Dual"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Dual Comparison</span>
            </button>
            <button
              id="btn-view-split-slider"
              onClick={() => setViewMode('split_slider')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'split_slider'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Interactive Split Slider"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Split Curtain</span>
            </button>
            <button
              id="btn-view-single-tab"
              onClick={() => setViewMode('single_tab')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'single_tab'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Single Focus Tab"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Focus Tab</span>
            </button>
          </div>
        </div>

        {/* Center: Zoom and Pan Tools */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-0.5">
          <button
            id="btn-zoom-in"
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-slate-100 text-slate-700 hover:text-slate-900"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="font-mono text-[11px] px-1.5 text-slate-600 min-w-[42px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            id="btn-zoom-out"
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-slate-100 text-slate-700 hover:text-slate-900"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
          <button
            id="btn-fit-screen"
            onClick={handleFitScreen}
            className="p-1 rounded hover:bg-slate-100 text-slate-700 hover:text-slate-900"
            title="Fit to Screen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-reset-view"
            onClick={handleResetZoom}
            className="p-1 rounded hover:bg-slate-100 text-slate-700 hover:text-slate-900"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Overlay Options */}
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700">
            <input
              type="checkbox"
              checked={showBoundingBoxes}
              onChange={(e) => setShowBoundingBoxes(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
            />
            <span className="text-xs">Field Boxes</span>
          </label>

          {(viewMode === 'four_panel' || activeSingleTab === 'overlay') && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px]">Overlay:</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={heatmapOpacity}
                onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                className="w-16 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <span className="font-mono text-[10px] w-6">{Math.round(heatmapOpacity * 100)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Authenticity Heatmap Legend Strip (Thesis §4.3.2 Thresholds) */}
      <div className="bg-slate-900 text-slate-100 px-4 py-1.5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-[11px]">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-slate-300 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-teal-400" />
            Authenticity Support Legend:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-300 inline-block" />
            <span className="font-medium text-emerald-300">High Authenticity (Accepted)</span>
            <span className="text-slate-400 font-mono text-[10px]">(≥ 0.85)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-300 inline-block" />
            <span className="font-medium text-amber-300">Moderate (Warning)</span>
            <span className="text-slate-400 font-mono text-[10px]">(0.70 – 0.84)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 border border-red-400 inline-block" />
            <span className="font-medium text-red-300">Low Support (Manual Review)</span>
            <span className="text-slate-400 font-mono text-[10px]">(&lt; 0.70)</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[10px]">
          <MousePointerClick className="w-3 h-3 text-teal-400" />
          <span>Click any bounding box to inspect forensic evidence & Equation (8) score</span>
        </div>
      </div>

      {/* Main Canvas / Image Display Workspace */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`flex-1 bg-slate-100/90 overflow-hidden relative select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* VIEW 1: FOUR PANEL GRID */}
        {viewMode === 'four_panel' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 h-full overflow-y-auto">
            {panels.map((p) => (
              <div 
                key={p.id}
                className="bg-white rounded-md border border-slate-200 shadow-xs flex flex-col overflow-hidden"
              >
                <div className="px-2.5 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-xs truncate">{p.title}</span>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${p.badgeColor}`}>
                    {p.badge.split(' ')[0]}
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-center p-2 bg-slate-50/50 min-h-[300px] overflow-hidden relative">
                  <div
                    style={{
                      transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                      transformOrigin: 'center center',
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                    }}
                    className="relative max-w-full flex items-center justify-center"
                  >
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="rounded border border-slate-200 shadow-xs max-h-[380px] w-auto object-contain pointer-events-none"
                    />
                    {/* Bounding box overlays */}
                    {showBoundingBoxes && (
                      <BoundingBoxOverlay
                        fields={receipt.fields}
                        selectedField={selectedField}
                        onSelectField={onSelectField}
                        onInspectField={onInspectField}
                      />
                    )}
                  </div>
                </div>
                <div className="px-2.5 py-1 bg-white border-t border-slate-100 text-[10px] text-slate-500 truncate">
                  {p.description}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW 2: SIDE BY SIDE DUAL VIEW */}
        {viewMode === 'side_by_side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 h-full overflow-y-auto">
            {/* Panel 1: Original */}
            <div className="bg-white rounded-md border border-slate-200 shadow-xs flex flex-col overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-xs">Original Degraded Thermal Substrate</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">
                  Input Source
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center p-3 bg-slate-50/50 overflow-hidden relative">
                <div
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                    transformOrigin: 'center center',
                  }}
                  className="relative flex items-center justify-center"
                >
                  <img
                    src={receipt.originalImageUrl}
                    alt="Original"
                    className="rounded border border-slate-200 max-h-[460px] w-auto object-contain"
                  />
                  {showBoundingBoxes && (
                    <BoundingBoxOverlay
                      fields={receipt.fields}
                      selectedField={selectedField}
                      onSelectField={onSelectField}
                      onInspectField={onInspectField}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Panel 2: Restored with Heatmap Overlay Toggle */}
            <div className="bg-white rounded-md border border-slate-200 shadow-xs flex flex-col overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-xs">Restored Receipt + Authenticity Heatmap</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-mono">
                  Unrolled DSDNet Restoration
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center p-3 bg-slate-50/50 overflow-hidden relative">
                <div
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                    transformOrigin: 'center center',
                  }}
                  className="relative flex items-center justify-center"
                >
                  <img
                    src={receipt.overlayImageUrl}
                    alt="Restored Overlay"
                    className="rounded border border-slate-200 max-h-[460px] w-auto object-contain"
                  />
                  {showBoundingBoxes && (
                    <BoundingBoxOverlay
                      fields={receipt.fields}
                      selectedField={selectedField}
                      onSelectField={onSelectField}
                      onInspectField={onInspectField}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: INTERACTIVE SPLIT SLIDER */}
        {viewMode === 'split_slider' && (
          <div className="h-full flex flex-col p-4 items-center justify-center overflow-hidden">
            <div className="relative rounded-md border border-slate-300 shadow-md bg-white overflow-hidden max-h-[500px] w-[340px] max-w-full flex items-center justify-center">
              {/* Underneath: Restored */}
              <img
                src={receipt.restoredImageUrl}
                alt="Restored"
                className="w-full h-auto object-contain block"
              />
              
              {/* Overlay clipped: Original */}
              <div
                style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
                className="absolute inset-0 w-full h-full pointer-events-none"
              >
                <img
                  src={receipt.originalImageUrl}
                  alt="Original"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Slider Handle Divider Line */}
              <div
                style={{ left: `${splitPosition}%` }}
                onMouseDown={startSplitDrag}
                className="absolute top-0 bottom-0 w-1 bg-teal-500 cursor-ew-resize z-20 flex items-center justify-center shadow-lg"
              >
                <div className="w-7 h-7 -ml-3 rounded-full bg-slate-900 border-2 border-white text-white flex items-center justify-center shadow-md text-[10px] font-bold">
                  ↔
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-mono z-10">
                Original (Degraded)
              </div>
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-teal-900/80 text-white text-[10px] font-mono z-10">
                Unrolled DSDNet Restored
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-2 text-center">
              Drag the center slider left/right to compare degraded input against reconstructed stroke geometry.
            </p>
          </div>
        )}

        {/* VIEW 4: SINGLE FOCUS TAB */}
        {viewMode === 'single_tab' && (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200">
              {panels.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveSingleTab(p.id as any)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeSingleTab === p.id
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.title.split('. ')[1]}
                </button>
              ))}
            </div>
            <div className="flex-1 flex items-center justify-center p-4 bg-slate-100/50 overflow-hidden relative">
              <div
                style={{
                  transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                  transformOrigin: 'center center',
                }}
                className="relative flex items-center justify-center"
              >
                <img
                  src={
                    activeSingleTab === 'original'
                      ? receipt.originalImageUrl
                      : activeSingleTab === 'restored'
                      ? receipt.restoredImageUrl
                      : activeSingleTab === 'heatmap'
                      ? receipt.heatmapImageUrl
                      : receipt.overlayImageUrl
                  }
                  alt={activeSingleTab}
                  className="rounded border border-slate-200 shadow-md max-h-[500px] w-auto object-contain"
                />
                {showBoundingBoxes && (
                  <BoundingBoxOverlay
                    fields={receipt.fields}
                    selectedField={selectedField}
                    onSelectField={onSelectField}
                    onInspectField={onInspectField}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface BoundingBoxOverlayProps {
  fields: ReceiptField[];
  selectedField: ReceiptField | null;
  onSelectField: (field: ReceiptField) => void;
  onInspectField: (field: ReceiptField) => void;
}

const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
  fields,
  selectedField,
  onSelectField,
  onInspectField,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-auto">
      {fields.map((field) => {
        const isSelected = selectedField?.id === field.id;
        const isManual = field.decisionStatus === 'manual_verification';
        const isWarning = field.decisionStatus === 'warning';

        const borderColor = isSelected
          ? 'border-blue-600 bg-blue-500/20 ring-2 ring-blue-500'
          : isManual
          ? 'border-red-500 bg-red-500/15 hover:bg-red-500/25'
          : isWarning
          ? 'border-amber-500 bg-amber-500/15 hover:bg-amber-500/25'
          : 'border-teal-500 bg-teal-500/10 hover:bg-teal-500/20';

        return (
          <div
            key={field.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectField(field);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onInspectField(field);
            }}
            style={{
              left: `${field.boundingBox.x}%`,
              top: `${field.boundingBox.y}%`,
              width: `${field.boundingBox.width}%`,
              height: `${field.boundingBox.height}%`,
            }}
            className={`absolute border cursor-pointer transition-all duration-150 rounded-xs group flex items-start justify-between p-0.5 ${borderColor}`}
            title={`${field.name}: ${field.value}\nA_field(f): ${(field.afieldScore * 100).toFixed(1)}% | Q_q: ${(field.pixelQuantileAuth * 100).toFixed(0)}% | C_OCR: ${(field.ocrConfidence * 100).toFixed(0)}% | Status: ${field.decisionStatus}`}
          >
            <span
              className={`text-[8px] font-mono font-bold px-1 rounded shadow-xs leading-none ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : isManual
                  ? 'bg-red-600 text-white'
                  : isWarning
                  ? 'bg-amber-600 text-white'
                  : 'bg-teal-700 text-white'
              }`}
            >
              {field.name.slice(0, 10)}
            </span>

            {isSelected && (
              <span className="text-[7px] bg-slate-900 text-white px-1 rounded animate-pulse">
                Active
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
