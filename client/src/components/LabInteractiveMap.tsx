import React, { useMemo, useState, useRef } from 'react';
import {
  AlertTriangle,
  Compass,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Computer, LabMapData } from '../types';
import {
  getReconstructedRoomLayout,
  WorkstationSeat,
} from '../config/lab-layouts.config';

interface LabInteractiveMapProps {
  mapData: LabMapData | null;
  selectedComputerId?: string;
  highlightComputerId?: string; // For assistant view / read-only ticket inspector
  onSelectComputer?: (computer: Computer) => void;
  readOnly?: boolean;
  className?: string;
}

/**
 * Top-View Interactive PC Workstation Component
 * Architectural top-view symbol with monitor, base stand, and desk keyboard silhouette.
 */
interface WorkstationElementProps {
  seat: WorkstationSeat;
  computer?: Computer;
  isSelected: boolean;
  isBusy: boolean;
  readOnly: boolean;
  isDark: boolean;
  onSelect?: (computer: Computer) => void;
}

const WorkstationElement: React.FC<WorkstationElementProps> = ({
  seat,
  computer,
  isSelected,
  isBusy,
  readOnly,
  isDark,
  onSelect,
}) => {
  const isVertical = seat.orientation === 'vertical';
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isBusy && !readOnly && computer && onSelect) {
      onSelect(computer);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isBusy && !readOnly && computer && onSelect) {
      e.preventDefault();
      onSelect(computer);
    }
  };

  // Theme-aware architectural palette for workstation symbols
  const styles = useMemo(() => {
    if (isBusy) {
      // Under Maintenance / Active Ticket (Amber / Ochre)
      return {
        casingFill: isDark ? '#271705' : '#fef3c7',
        casingStroke: isDark ? '#f59e0b' : '#d97706',
        screenFill: isDark ? '#451a03' : '#fde68a',
        standFill: isDark ? '#78350f' : '#b45309',
        keyboardFill: isDark ? '#1f1304' : '#fef9c3',
        keyboardStroke: isDark ? '#92400e' : '#d97706',
        ledFill: isDark ? '#f59e0b' : '#b45309',
        ringStroke: isDark ? '#f59e0b' : '#d97706',
        haloFill: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(217, 119, 6, 0.12)',
      };
    }

    if (isSelected) {
      // Selected Fault Workstation (Sky / Ocean Accent)
      return {
        casingFill: isDark ? '#082f49' : '#e0f2fe',
        casingStroke: isDark ? '#38bdf8' : '#0284c7',
        screenFill: isDark ? '#0284c7' : '#bae6fd',
        standFill: isDark ? '#0369a1' : '#0284c7',
        keyboardFill: isDark ? '#0c2438' : '#f0f9ff',
        keyboardStroke: isDark ? '#0284c7' : '#0369a1',
        ledFill: '#38bdf8',
        ringStroke: isDark ? '#38bdf8' : '#0284c7',
        haloFill: isDark ? 'rgba(56, 189, 248, 0.22)' : 'rgba(2, 132, 199, 0.18)',
      };
    }

    if (isHovered && !readOnly) {
      // Hovered Available (Subtle elevation & accent)
      return {
        casingFill: isDark ? '#062d25' : '#ccfbf1',
        casingStroke: isDark ? '#2dd4bf' : '#0d9488',
        screenFill: isDark ? '#0f766e' : '#99f6e4',
        standFill: isDark ? '#14b8a6' : '#0f766e',
        keyboardFill: isDark ? '#08201a' : '#f0fdfa',
        keyboardStroke: isDark ? '#14b8a6' : '#0d9488',
        ledFill: isDark ? '#34d399' : '#059669',
        ringStroke: isDark ? '#2dd4bf' : '#0d9488',
        haloFill: isDark ? 'rgba(45, 212, 191, 0.15)' : 'rgba(13, 148, 136, 0.12)',
      };
    }

    // Default Available (Understated Architectural Teal / Slate)
    return {
      casingFill: isDark ? '#0e1823' : '#ffffff',
      casingStroke: isDark ? '#334155' : '#94a3b8',
      screenFill: isDark ? '#1e293b' : '#f1f5f9',
      standFill: isDark ? '#475569' : '#94a3b8',
      keyboardFill: isDark ? '#0b1118' : '#f8fafc',
      keyboardStroke: isDark ? '#1e293b' : '#cbd5e1',
      ledFill: isDark ? '#10b981' : '#059669',
      ringStroke: 'transparent',
      haloFill: 'transparent',
    };
  }, [isBusy, isSelected, isHovered, readOnly, isDark]);

  return (
    <g
      transform={`translate(${seat.x}, ${seat.y})`}
      role="button"
      tabIndex={isBusy || readOnly ? -1 : 0}
      aria-label={
        isBusy
          ? 'Workstation under repair'
          : isSelected
          ? 'Selected faulty workstation'
          : 'Workstation available. Click to select fault'
      }
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`outline-none select-none ${
        isBusy
          ? 'cursor-not-allowed opacity-85'
          : readOnly
          ? 'cursor-default'
          : 'cursor-pointer'
      }`}
    >
      {/* Generous Clickable Hit Target - perfectly stationary */}
      <rect
        x={-22}
        y={-22}
        width={44}
        height={44}
        fill="transparent"
        pointerEvents="all"
        className="cursor-pointer"
      />

      {/* KEYBOARD FOCUS INDICATOR (WCAG Accessible) */}
      <circle
        cx={0}
        cy={0}
        r={22}
        fill="none"
        stroke={isDark ? '#38bdf8' : '#0284c7'}
        strokeWidth={2}
        strokeDasharray="3 3"
        className="opacity-0 focus:opacity-100 transition-opacity"
      />

      {/* SELECTED BEACON: Calm architectural double-ring and checkmark */}
      {isSelected && (
        <g>
          {/* Outer architectural target ring */}
          <circle
            cx={0}
            cy={0}
            r={19}
            fill="none"
            stroke={styles.ringStroke}
            strokeWidth={1.2}
            strokeDasharray="3 2"
          />
          {/* Defined architectural target ring */}
          <circle
            cx={0}
            cy={0}
            r={16}
            fill={styles.haloFill}
            stroke={styles.ringStroke}
            strokeWidth={1.8}
          />
        </g>
      )}

      {/* HOVER EMPHASIS RING */}
      {isHovered && !isSelected && !isBusy && !readOnly && (
        <circle
          cx={0}
          cy={0}
          r={17}
          fill={styles.haloFill}
          stroke={styles.ringStroke}
          strokeWidth={1.2}
          strokeDasharray="2 2"
        />
      )}

      {/* UNDER REPAIR CAUTION RING */}
      {isBusy && (
        <circle
          cx={0}
          cy={0}
          r={17}
          fill={styles.haloFill}
          stroke={styles.ringStroke}
          strokeWidth={1.2}
          strokeDasharray="3 3"
        />
      )}

      {/* ARCHITECTURAL TOP-VIEW WORKSTATION */}
      {isVertical ? (
        // VERTICAL ORIENTATION (Monitor facing left/right)
        <g>
          {/* Desk Keyboard Silhouette */}
          <rect
            x={-12}
            y={-9}
            width={5}
            height={18}
            rx={1}
            fill={styles.keyboardFill}
            stroke={styles.keyboardStroke}
            strokeWidth={0.8}
          />
          {/* Monitor Screen Silhouette */}
          <rect
            x={-4}
            y={-13}
            width={9}
            height={26}
            rx={2}
            fill={styles.casingFill}
            stroke={styles.casingStroke}
            strokeWidth={1.2}
          />
          {/* Active Screen Surface */}
          <rect
            x={-2.5}
            y={-10.5}
            width={6}
            height={21}
            rx={1}
            fill={styles.screenFill}
          />
          {/* Monitor Neck */}
          <rect
            x={5}
            y={-2}
            width={3}
            height={4}
            fill={styles.standFill}
            rx={0.8}
          />
          {/* Base Plate */}
          <rect
            x={7}
            y={-5}
            width={2.5}
            height={10}
            rx={1}
            fill={styles.standFill}
          />
          {/* Power LED Indicator */}
          <circle
            cx={-0.5}
            cy={-9}
            r={0.9}
            fill={styles.ledFill}
          />
        </g>
      ) : (
        // HORIZONTAL ORIENTATION (Monitor facing front/back)
        <g>
          {/* Desk Keyboard Silhouette */}
          <rect
            x={-9}
            y={8}
            width={18}
            height={5}
            rx={1}
            fill={styles.keyboardFill}
            stroke={styles.keyboardStroke}
            strokeWidth={0.8}
          />
          {/* Monitor Screen Silhouette */}
          <rect
            x={-13}
            y={-4}
            width={26}
            height={9}
            rx={2}
            fill={styles.casingFill}
            stroke={styles.casingStroke}
            strokeWidth={1.2}
          />
          {/* Active Screen Surface */}
          <rect
            x={-10.5}
            y={-2.5}
            width={21}
            height={6}
            rx={1}
            fill={styles.screenFill}
          />
          {/* Monitor Neck */}
          <rect
            x={-2}
            y={5}
            width={4}
            height={3}
            fill={styles.standFill}
            rx={0.8}
          />
          {/* Base Plate */}
          <rect
            x={-5}
            y={7}
            width={10}
            height={2.5}
            rx={1}
            fill={styles.standFill}
          />
          {/* Power LED Indicator */}
          <circle
            cx={-9}
            cy={-0.5}
            r={0.9}
            fill={styles.ledFill}
          />
        </g>
      )}

      {/* SELECTED BADGE: Crisp centered checkmark */}
      {isSelected && (
        <g transform="translate(0, 0)">
          <circle
            cx={0}
            cy={0}
            r={6.5}
            fill={isDark ? '#0284c7' : '#0284c7'}
            stroke="#ffffff"
            strokeWidth={1}
          />
          <path
            d="M -2.8 0 L -1 1.8 L 2.8 -1.8"
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* UNDER REPAIR BADGE: Mini caution indicator */}
      {isBusy && (
        <g transform="translate(0, 0)">
          <circle
            cx={0}
            cy={0}
            r={5.5}
            fill={isDark ? '#b45309' : '#d97706'}
            stroke={isDark ? '#fef3c7' : '#ffffff'}
            strokeWidth={0.8}
          />
          <path
            d="M 0 -2.5 L 0 0.5 M 0 2 L 0 2.5"
            stroke="#ffffff"
            strokeWidth={1.1}
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  );
};

export const LabInteractiveMap: React.FC<LabInteractiveMapProps> = ({
  mapData,
  selectedComputerId,
  highlightComputerId,
  onSelectComputer,
  readOnly = false,
  className = '',
}) => {
  const { isDark } = useTheme();

  // Zoom & Pan state for comfortable floor plan navigation
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.2, 1.8));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.2, 0.9));
  const handleResetZoom = () => setZoomLevel(1);

  // Resolve Reconstructed SVG Layout based on room number or code
  const roomIdentifier = mapData?.roomNumber || mapData?.code?.replace(/^LAB-/, '') || '';
  const layout = useMemo(
    () => (roomIdentifier ? getReconstructedRoomLayout(roomIdentifier) : null),
    [roomIdentifier]
  );

  // Pre-sort computers by label number (PC-01, PC-02...) to match seat indices 1..N
  const sortedComputers = useMemo(() => {
    if (!mapData?.computers) return [];
    return [...mapData.computers].sort((a, b) => {
      const numA = parseInt(a.label.match(/\d+/)?.[0] || '0', 10);
      const numB = parseInt(b.label.match(/\d+/)?.[0] || '0', 10);
      if (numA !== numB) return numA - numB;
      return a.label.localeCompare(b.label);
    });
  }, [mapData?.computers]);

  // Theme-aware architectural palette for the floor plan canvas
  const canvasTheme = useMemo(
    () =>
      isDark
        ? {
            containerBg: 'bg-card',
            containerBorder: 'border-border',
            floorBg: '#090d16',
            gridDot: '#172236',
            wallFill: '#0c121e',
            wallStroke: '#334155',
            wallGuideline: '#1e293b',
            tableFill: '#111726',
            tableStroke: '#253248',
            tableBevel: '#161f31',
            fixtureFill: '#131b2b',
            fixtureStroke: '#334155',
            fixtureLabel: '#94a3b8',
            headingText: '#cbd5e1',
            doorArc: '#475569',
            doorOpening: '#090d16',
          }
        : {
            containerBg: 'bg-card',
            containerBorder: 'border-border',
            floorBg: '#f8fafc',
            gridDot: '#e2e8f0',
            wallFill: '#ffffff',
            wallStroke: '#94a3b8',
            wallGuideline: '#cbd5e1',
            tableFill: '#ffffff',
            tableStroke: '#cbd5e1',
            tableBevel: '#f1f5f9',
            fixtureFill: '#f1f5f9',
            fixtureStroke: '#94a3b8',
            fixtureLabel: '#475569',
            headingText: '#1e293b',
            doorArc: '#94a3b8',
            doorOpening: '#f8fafc',
          },
    [isDark]
  );

  if (!mapData) {
    return (
      <div className="p-8 text-center bg-card border border-border rounded-2xl shadow-2xs">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-muted-foreground font-medium">
          Loading architectural floor plan...
        </p>
      </div>
    );
  }

  // Derive inventory and active ticket statistics from real backend data
  const totalCount = mapData.computers?.length || layout?.seats.length || 0;
  const busyCount = mapData.computers?.filter((c) => Boolean(c.activeTicket)).length || 0;
  const availableCount = Math.max(0, totalCount - busyCount);

  // Fallback: When a laboratory does not yet have an architectural floor plan
  if (!layout) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Fallback Notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-foreground">
              Floor Plan Draft Pending for {mapData.roomName} ({mapData.code})
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              An architectural top-view layout is currently being surveyed for this room.
              Please select your workstation from the inventory below.
            </p>
          </div>
        </div>

        {/* Workstation Fallback List */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {mapData.computers.map((pc) => {
            const isBusy = Boolean(pc.activeTicket);
            const isSelected = selectedComputerId === pc._id || highlightComputerId === pc._id;

            return (
              <button
                key={pc._id}
                type="button"
                disabled={isBusy || readOnly}
                onClick={() => {
                  if (!isBusy && !readOnly && onSelectComputer) {
                    onSelectComputer(pc);
                  }
                }}
                className={`p-3 rounded-2xl border text-left transition select-none flex flex-col justify-between ${
                  isBusy
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200 cursor-not-allowed opacity-90'
                    : isSelected
                    ? 'bg-primary/10 border-primary ring-2 ring-primary/20 shadow-soft cursor-pointer'
                    : readOnly
                    ? 'bg-card border-border cursor-default'
                    : 'bg-card border-border hover:border-primary/50 hover:bg-muted/40 cursor-pointer shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-sm text-foreground truncate">
                    {pc.label}
                  </span>
                  {isBusy ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white uppercase tracking-wider">
                      Reported
                    </span>
                  ) : (
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-primary animate-pulse' : 'bg-emerald-500'
                      }`}
                    />
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mt-1">
                  {pc.assetTag}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ARCHITECTURAL HEADER: STATUS, LEGEND & ZOOM CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-border shadow-2xs transition-colors">
        {/* Status Legend (No PC numbers shown) */}
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
            <span className="font-medium text-foreground">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-sky-500/30" />
            <span className="font-semibold text-sky-600 dark:text-sky-400">Selected Fault</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-2xs" />
            <span className="font-medium">Under Repair</span>
          </div>
        </div>

        {/* Counter & Zoom Controls */}
        <div className="flex items-center gap-3">
          {/* Inventory Count */}
          <div className="text-xs font-mono text-muted-foreground flex items-center gap-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {availableCount}
            </span>
            <span>Available / {totalCount} Total</span>
          </div>

          {/* Floor Plan Zoom Buttons */}
          <div className="hidden sm:flex items-center gap-0.5 bg-muted/80 p-0.5 rounded-xl border border-border/70 text-muted-foreground">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.9}
              className="p-1 rounded-lg hover:bg-card hover:text-foreground disabled:opacity-40 transition"
              title="Zoom out floor plan"
              aria-label="Zoom out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-lg hover:bg-card hover:text-foreground transition"
              title="Reset floor plan zoom"
              aria-label="Reset zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 1.8}
              className="p-1 rounded-lg hover:bg-card hover:text-foreground disabled:opacity-40 transition"
              title="Zoom in floor plan"
              aria-label="Zoom in"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1 rounded-lg hover:bg-card hover:text-foreground text-primary transition"
                title="Fit to width"
                aria-label="Fit to width"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ARCHITECTURAL FLOOR PLAN CONTAINER */}
      <div
        ref={containerRef}
        className={`relative rounded-2xl border ${canvasTheme.containerBorder} ${canvasTheme.containerBg} p-2.5 sm:p-4 shadow-sm overflow-hidden transition-colors`}
      >
        {/* Title Bar & Architectural Identifier */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2.5 px-1 pb-2 border-b border-border/50">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Compass className="w-4 h-4 text-primary shrink-0" />
            <span className="font-bold tracking-tight">{layout.roomName}</span>
            <span className="text-[11px] font-mono text-muted-foreground">
              (Floor Plan)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider border border-border/60">
              Room {layout.roomNumber}
            </span>
          </div>
        </div>

        {/* Scalable SVG Room Canvas */}
        <div
          className="relative w-full rounded-xl overflow-hidden select-none border border-border/60 transition-transform duration-200 origin-top"
          style={{
            transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined,
            transformOrigin: '50% 0%',
          }}
        >
          <svg
            viewBox={`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`}
            className="w-full h-auto block select-none"
            preserveAspectRatio="xMidYMid meet"
            role="region"
            aria-label={`${layout.roomName} Architectural Floor Plan`}
          >
            {/* SVG DEFINITIONS */}
            <defs>
              {/* Subtle Architectural Grid Pattern */}
              <pattern
                id={`floor-grid-${isDark ? 'dark' : 'light'}`}
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="1" cy="1" r="0.8" fill={canvasTheme.gridDot} />
              </pattern>
            </defs>

            {/* Room Floor Background */}
            <rect
              x={layout.outerWall.x}
              y={layout.outerWall.y}
              width={layout.outerWall.width}
              height={layout.outerWall.height}
              rx={layout.outerWall.rx}
              fill={canvasTheme.floorBg}
            />
            <rect
              x={layout.outerWall.x}
              y={layout.outerWall.y}
              width={layout.outerWall.width}
              height={layout.outerWall.height}
              rx={layout.outerWall.rx}
              fill={`url(#floor-grid-${isDark ? 'dark' : 'light'})`}
            />

            {/* Architectural Outer Wall Double Outline (Crisp structural wall) */}
            <rect
              x={layout.outerWall.x}
              y={layout.outerWall.y}
              width={layout.outerWall.width}
              height={layout.outerWall.height}
              rx={layout.outerWall.rx}
              fill="none"
              stroke={canvasTheme.wallStroke}
              strokeWidth={2.2}
            />
            <rect
              x={layout.outerWall.x + 3}
              y={layout.outerWall.y + 3}
              width={layout.outerWall.width - 6}
              height={layout.outerWall.height - 6}
              rx={Math.max(2, layout.outerWall.rx - 2)}
              fill="none"
              stroke={canvasTheme.wallGuideline}
              strokeWidth={0.8}
              strokeDasharray="4 4"
              opacity={0.7}
            />

            {/* ARCHITECTURAL ROOM FIXTURES */}
            {layout.fixtures.map((fixture) => {
              if (fixture.type === 'door') {
                return (
                  <g key={fixture.id}>
                    {/* Door Threshold Gap */}
                    <rect
                      x={fixture.x}
                      y={fixture.y}
                      width={fixture.width}
                      height={fixture.height}
                      fill={canvasTheme.doorOpening}
                      stroke={canvasTheme.wallStroke}
                      strokeWidth={1.2}
                      strokeDasharray="4 3"
                    />
                    {/* Door Swing Arc */}
                    {fixture.extraPath && (
                      <path
                        d={fixture.extraPath}
                        fill="none"
                        stroke={canvasTheme.doorArc}
                        strokeWidth={1.4}
                        strokeDasharray="4 4"
                      />
                    )}
                    {/* Door Label */}
                    <text
                      x={fixture.x + fixture.width / 2}
                      y={fixture.y - 10}
                      fill={canvasTheme.fixtureLabel}
                      fontSize="11"
                      fontFamily="Inter, sans-serif"
                      fontWeight="500"
                      textAnchor="middle"
                    >
                      {fixture.label || 'Door'}
                    </text>
                  </g>
                );
              }

              if (fixture.type === 'whiteboard') {
                return (
                  <g key={fixture.id}>
                    <rect
                      x={fixture.x}
                      y={fixture.y}
                      width={fixture.width}
                      height={fixture.height}
                      rx={fixture.rx || 2}
                      fill={isDark ? '#1a2234' : '#ffffff'}
                      stroke={canvasTheme.fixtureStroke}
                      strokeWidth={1.4}
                    />
                    <text
                      x={fixture.x + fixture.width / 2}
                      y={fixture.y - 10}
                      fill={canvasTheme.fixtureLabel}
                      fontSize="11"
                      fontFamily="Inter, sans-serif"
                      fontWeight="500"
                      textAnchor="middle"
                    >
                      {fixture.label || 'Whiteboard'}
                    </text>
                  </g>
                );
              }

              if (fixture.type === 'projector') {
                return (
                  <g key={fixture.id}>
                    <rect
                      x={fixture.x}
                      y={fixture.y}
                      width={fixture.width}
                      height={fixture.height}
                      rx={fixture.rx || 2}
                      fill={isDark ? '#1a2234' : '#f1f5f9'}
                      stroke={canvasTheme.fixtureStroke}
                      strokeWidth={1.4}
                    />
                    <text
                      x={fixture.x + fixture.width / 2}
                      y={fixture.y - 12}
                      fill={canvasTheme.fixtureLabel}
                      fontSize="11"
                      fontFamily="Inter, sans-serif"
                      fontWeight="500"
                      textAnchor="middle"
                    >
                      {fixture.label || 'Projector Screen'}
                    </text>
                  </g>
                );
              }

              if (fixture.type === 'teaching_stand') {
                return (
                  <g key={fixture.id}>
                    <rect
                      x={fixture.x}
                      y={fixture.y}
                      width={fixture.width}
                      height={fixture.height}
                      rx={fixture.rx || 10}
                      fill={canvasTheme.fixtureFill}
                      stroke={canvasTheme.fixtureStroke}
                      strokeWidth={1.4}
                    />
                    {/* Architectural inner inset */}
                    <rect
                      x={fixture.x + 3}
                      y={fixture.y + 3}
                      width={fixture.width - 6}
                      height={fixture.height - 6}
                      rx={Math.max(2, (fixture.rx || 10) - 2)}
                      fill="none"
                      stroke={canvasTheme.wallGuideline}
                      strokeWidth={0.8}
                    />
                    <text
                      x={fixture.x + fixture.width / 2}
                      y={fixture.y + fixture.height / 2 + 4.5}
                      fill={canvasTheme.headingText}
                      fontSize="12"
                      fontFamily="Inter, sans-serif"
                      fontWeight="600"
                      letterSpacing="0.02em"
                      textAnchor="middle"
                    >
                      {fixture.label || 'Teaching Stand'}
                    </text>
                  </g>
                );
              }

              if (fixture.type === 'cabinet') {
                return (
                  <g key={fixture.id}>
                    <rect
                      x={fixture.x}
                      y={fixture.y}
                      width={fixture.width}
                      height={fixture.height}
                      rx={fixture.rx || 6}
                      fill={canvasTheme.fixtureFill}
                      stroke={canvasTheme.fixtureStroke}
                      strokeWidth={1.4}
                    />
                    {/* Divider line for storage cabinet */}
                    <line
                      x1={fixture.x + 10}
                      y1={fixture.y + fixture.height / 2}
                      x2={fixture.x + fixture.width - 10}
                      y2={fixture.y + fixture.height / 2}
                      stroke={canvasTheme.wallGuideline}
                      strokeWidth={1}
                      strokeDasharray="6 4"
                    />
                    <text
                      x={fixture.x + fixture.width / 2}
                      y={fixture.y + fixture.height / 2 + 4}
                      fill={canvasTheme.fixtureLabel}
                      fontSize="11"
                      fontFamily="Inter, sans-serif"
                      fontWeight="500"
                      textAnchor="middle"
                    >
                      {fixture.label || 'Cabinet'}
                    </text>
                  </g>
                );
              }

              if (fixture.type === 'table') {
                return (
                  <g key={fixture.id}>
                    <rect
                      x={fixture.x}
                      y={fixture.y}
                      width={fixture.width}
                      height={fixture.height}
                      rx={fixture.rx || 10}
                      fill={canvasTheme.fixtureFill}
                      stroke={canvasTheme.fixtureStroke}
                      strokeWidth={1.4}
                    />
                    <text
                      x={fixture.x + fixture.width / 2}
                      y={fixture.y + fixture.height / 2 + 5}
                      fill={canvasTheme.headingText}
                      fontSize="12"
                      fontFamily="Inter, sans-serif"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {fixture.label || 'Table'}
                    </text>
                  </g>
                );
              }

              if (fixture.type === 'bag_rack') {
                return (
                  <g key={fixture.id}>
                    <rect
                      x={fixture.x}
                      y={fixture.y}
                      width={fixture.width}
                      height={fixture.height}
                      rx={fixture.rx || 8}
                      fill={canvasTheme.fixtureFill}
                      stroke={canvasTheme.fixtureStroke}
                      strokeWidth={1.4}
                    />
                    <text
                      x={fixture.x + fixture.width / 2}
                      y={fixture.y + fixture.height / 2 - 4}
                      fill={canvasTheme.fixtureLabel}
                      fontSize="10"
                      fontFamily="Inter, sans-serif"
                      fontWeight="500"
                      textAnchor="middle"
                    >
                      Bag
                    </text>
                    <text
                      x={fixture.x + fixture.width / 2}
                      y={fixture.y + fixture.height / 2 + 9}
                      fill={canvasTheme.fixtureLabel}
                      fontSize="10"
                      fontFamily="Inter, sans-serif"
                      fontWeight="500"
                      textAnchor="middle"
                    >
                      Rack
                    </text>
                  </g>
                );
              }

              if (fixture.type === 'chair') {
                return (
                  <g key={fixture.id}>
                    <circle
                      cx={fixture.x + fixture.width / 2}
                      cy={fixture.y + fixture.height / 2}
                      r={fixture.width / 2}
                      fill={canvasTheme.fixtureFill}
                      stroke={canvasTheme.fixtureStroke}
                      strokeWidth={1.4}
                    />
                    <text
                      x={fixture.x + fixture.width / 2}
                      y={fixture.y + fixture.height / 2 + 3.5}
                      fill={canvasTheme.fixtureLabel}
                      fontSize="9"
                      fontFamily="Inter, sans-serif"
                      fontWeight="500"
                      textAnchor="middle"
                    >
                      Chair
                    </text>
                  </g>
                );
              }

              // Default Fixture (Desk, booth, etc.)
              return (
                <g key={fixture.id}>
                  <rect
                    x={fixture.x}
                    y={fixture.y}
                    width={fixture.width}
                    height={fixture.height}
                    rx={fixture.rx || 8}
                    fill={canvasTheme.fixtureFill}
                    stroke={canvasTheme.fixtureStroke}
                    strokeWidth={1.4}
                  />
                  {fixture.label && (
                    <text
                      x={fixture.x + fixture.width / 2}
                      y={fixture.y + fixture.height / 2 + 4}
                      fill={canvasTheme.fixtureLabel}
                      fontSize="11"
                      fontFamily="Inter, sans-serif"
                      fontWeight="500"
                      textAnchor="middle"
                    >
                      {fixture.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* WORKSTATION DESKS / BENCHES */}
            {layout.tables.map((table) => (
              <g key={table.id}>
                {/* Desk Surface with Architectural Outline */}
                <rect
                  x={table.x}
                  y={table.y}
                  width={table.width}
                  height={table.height}
                  rx={table.rx || 8}
                  fill={canvasTheme.tableFill}
                  stroke={canvasTheme.tableStroke}
                  strokeWidth={1.5}
                />
                {/* Subtle Inner Bevel Line */}
                <rect
                  x={table.x + 2}
                  y={table.y + 2}
                  width={table.width - 4}
                  height={table.height - 4}
                  rx={Math.max(2, (table.rx || 8) - 2)}
                  fill="none"
                  stroke={canvasTheme.tableBevel}
                  strokeWidth={1}
                />
              </g>
            ))}

            {/* INDIVIDUAL WORKSTATION PCS */}
            {layout.seats.map((seat) => {
              // Bind seat to real database computer from sorted inventory
              const computer =
                sortedComputers[seat.seatIndex - 1] ||
                sortedComputers.find((c) => {
                  const num = parseInt(c.label.match(/\d+/)?.[0] || '0', 10);
                  return num === seat.seatIndex;
                });

              const isBusy = Boolean(computer?.activeTicket);
              const isSelected =
                Boolean(computer) &&
                (selectedComputerId === computer?._id ||
                  highlightComputerId === computer?._id);

              return (
                <WorkstationElement
                  key={`seat-${seat.seatIndex}`}
                  seat={seat}
                  computer={computer}
                  isSelected={isSelected}
                  isBusy={isBusy}
                  readOnly={readOnly}
                  isDark={isDark}
                  onSelect={onSelectComputer}
                />
              );
            })}
          </svg>
        </div>

        {/* Informational Guidance Footer */}
        <div className="mt-2.5 text-center text-muted-foreground text-[11px]">
          {readOnly ? (
            <p className="flex items-center justify-center gap-1.5">
              <span>📍</span>
              <span>Reported workstation location is highlighted with an active beacon ring.</span>
            </p>
          ) : (
            <p className="flex items-center justify-center gap-1.5">
              <span>💡</span>
              <span>Click on the faulty computer in the floor plan to select it. No need to look up PC numbers.</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabInteractiveMap;
