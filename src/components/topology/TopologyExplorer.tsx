import React, { useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertOctagon,
  ArrowDownRight,
  ArrowRight,
  Clock,
  Compass,
  Cpu,
  Database,
  ExternalLink,
  Eye,
  Filter,
  HardDrive,
  Layers,
  Maximize2,
  Minus,
  Network,
  Plus,
  RefreshCw,
  RotateCcw,
  Server,
  Shield,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HealthState, ServiceId, ServiceNode } from '../../types';

interface NodePosition {
  x: number;
  y: number;
  tier: number;
}

// Optimized, spacious coordinates ensuring generous separation and clear hierarchical tiers
const NODE_COORDINATES: Record<ServiceId, NodePosition> = {
  'api-gateway': { x: 550, y: 80, tier: 0 },
  'auth-service': { x: 220, y: 250, tier: 1 },
  'orders-service': { x: 550, y: 250, tier: 1 },
  'inventory-service': { x: 880, y: 250, tier: 1 },
  'payment-service': { x: 390, y: 410, tier: 1 },
  'postgres-db': { x: 600, y: 570, tier: 2 },
  'redis-cache': { x: 130, y: 410, tier: 2 },
  'message-queue': { x: 880, y: 410, tier: 2 },
  'notification-service': { x: 880, y: 590, tier: 3 },
};

const NODE_WIDTH = 184;
const NODE_HEIGHT = 86;

export const TopologyExplorer: React.FC = () => {
  const {
    services,
    edges,
    logs,
    selectedServiceId,
    setSelectedServiceId,
    activeIncident,
    setActiveTab,
  } = useApp();

  const [healthFilter, setHealthFilter] = useState<'ALL' | HealthState>('ALL');

  // Interactive Pan and Zoom State
  const [scale, setScale] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartDistRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedService = selectedServiceId ? services[selectedServiceId] : null;

  // Calculate upstream and downstream for selected service
  const upstreamServices = useMemo(() => {
    if (!selectedService) return [];
    return selectedService.upstream.map((id) => services[id]).filter(Boolean);
  }, [selectedService, services]);

  const downstreamServices = useMemo(() => {
    if (!selectedService) return [];
    return selectedService.downstream.map((id) => services[id]).filter(Boolean);
  }, [selectedService, services]);

  const serviceLogs = useMemo(() => {
    if (!selectedServiceId) return [];
    return logs.filter((l) => l.service === selectedServiceId).slice(0, 8);
  }, [selectedServiceId, logs]);

  const getStatusColor = (state: HealthState) => {
    switch (state) {
      case 'Critical':
        return '#EF4444';
      case 'Degraded':
        return '#F59E0B';
      case 'At Risk':
        return '#F97316';
      case 'Recovering':
        return '#22D3EE';
      default:
        return '#22C55E';
    }
  };

  const isNodeFiltered = (state: HealthState) => {
    if (healthFilter === 'ALL') return false;
    return healthFilter !== state;
  };

  // Zoom & Pan Navigation Functions
  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.2, Number((prev + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.5, Number((prev - 0.15).toFixed(2))));
  };

  const handleResetView = () => {
    setScale(1.0);
    setPan({ x: 0, y: 0 });
  };

  const handleFitView = () => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      const scaleX = clientWidth / 1120;
      const scaleY = clientHeight / 720;
      const fitScale = Math.min(scaleX, scaleY, 1.1);
      setScale(Math.max(0.55, Number(fitScale.toFixed(2))));
      setPan({ x: 0, y: 0 });
    } else {
      setScale(0.9);
      setPan({ x: 0, y: 0 });
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.08 : -0.08;
    setScale((prev) => Math.min(2.2, Math.max(0.5, Number((prev + zoomFactor).toFixed(2)))));
  };

  // Mouse drag panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.service-node-card')) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch event handlers for mobile/tablet pinch and pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      };
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    } else if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const scaleDelta = (currentDist - touchStartDistRef.current) * 0.005;
      setScale((prev) => Math.min(2.2, Math.max(0.5, Number((prev + scaleDelta).toFixed(2)))));
      touchStartDistRef.current = currentDist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartDistRef.current = null;
  };

  // Edge styling
  const getEdgeStyle = (sourceId: ServiceId, targetId: ServiceId, status: string) => {
    const isPath =
      activeIncident?.propagationPath.includes(sourceId) &&
      activeIncident?.propagationPath.includes(targetId);

    const isConnectedToSelected =
      selectedServiceId && (sourceId === selectedServiceId || targetId === selectedServiceId);

    if (status === 'SEVERED' || (isPath && activeIncident)) {
      return {
        stroke: '#EF4444',
        strokeWidth: 3.2,
        strokeDasharray: '6 6',
        className: 'animate-flow-line-fast',
        opacity: 1,
      };
    }
    if (status === 'DEGRADED') {
      return {
        stroke: '#F59E0B',
        strokeWidth: 2.6,
        strokeDasharray: '6 6',
        className: 'animate-flow-line',
        opacity: 0.95,
      };
    }
    if (isConnectedToSelected) {
      return {
        stroke: '#8B5CF6',
        strokeWidth: 2.8,
        opacity: 1,
      };
    }
    return {
      stroke: '#334155',
      strokeWidth: 1.8,
      opacity: 0.75,
    };
  };

  return (
    <div className="p-3 sm:p-6 space-y-3 max-w-7xl mx-auto h-[calc(100vh-4.5rem)] flex flex-col">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
            <span>Service Topology Map</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              9 Services · 11 Edges
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Interactive directed microservice graph with live blast-radius propagation tracking.
          </p>
        </div>

        {/* Health Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center space-x-1 bg-[#111827] border border-[#263244] p-1 rounded-lg text-xs shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
            {(['ALL', 'Healthy', 'At Risk', 'Degraded', 'Critical'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setHealthFilter(filter)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  healthFilter === filter
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {selectedServiceId && (
            <button
              onClick={() => setSelectedServiceId(null)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-[#161D2B] hover:bg-[#1E2638] text-slate-300 border border-[#263244] flex items-center space-x-1 shrink-0"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span className="hidden sm:inline">Reset Selection</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Graph Container */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex-1 min-h-[380px] bg-[#0A0E17] border border-[#263244] rounded-2xl relative overflow-hidden flex shadow-2xl ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Floating Graph Navigation Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-1 bg-[#111827]/90 backdrop-blur-md border border-[#263244] p-1.5 rounded-xl shadow-xl select-none">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-[#1E2638] text-slate-300 hover:text-white transition-colors"
            title="Zoom In (+)"
            aria-label="Zoom in"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-[#1E2638] text-slate-300 hover:text-white transition-colors"
            title="Zoom Out (−)"
            aria-label="Zoom out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="px-2 py-0.5 text-[11px] font-mono font-bold text-purple-300 border-x border-[#263244]">
            {Math.round(scale * 100)}%
          </div>
          <button
            onClick={handleFitView}
            className="p-1.5 rounded-lg hover:bg-[#1E2638] text-slate-300 hover:text-white transition-colors"
            title="Fit View"
            aria-label="Fit View to container"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 rounded-lg hover:bg-[#1E2638] text-slate-300 hover:text-white transition-colors"
            title="Reset View"
            aria-label="Reset viewport view"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* SVG Canvas */}
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <svg
            viewBox="0 0 1100 700"
            className="w-full h-full select-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <defs>
              {/* Arrowheads */}
              <marker id="arrow-normal" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                <polygon points="0 1, 8 4.5, 0 8" fill="#475569" />
              </marker>
              <marker id="arrow-critical" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                <polygon points="0 1, 8 4.5, 0 8" fill="#EF4444" />
              </marker>
              <marker id="arrow-degraded" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                <polygon points="0 1, 8 4.5, 0 8" fill="#F59E0B" />
              </marker>
              <marker id="arrow-selected" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
                <polygon points="0 1, 8 4.5, 0 8" fill="#8B5CF6" />
              </marker>

              {/* Glow filter */}
              <filter id="glow-purple-lg" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#8B5CF6" floodOpacity="0.8" />
              </filter>
              <filter id="glow-red-lg" x="-30%" y="-30%" width="160%" height="160%">
                <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#EF4444" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* Architecture Tier Reference Grid */}
            <g opacity="0.18">
              <line x1="30" y1="165" x2="1070" y2="165" stroke="#64748B" strokeDasharray="5 5" />
              <text x="40" y="155" fill="#94A3B8" fontSize="11" fontWeight="bold" letterSpacing="0.05em">
                TIER 0 : INGRESS ROUTER
              </text>
              <line x1="30" y1="340" x2="1070" y2="340" stroke="#64748B" strokeDasharray="5 5" />
              <text x="40" y="330" fill="#94A3B8" fontSize="11" fontWeight="bold" letterSpacing="0.05em">
                TIER 1 : SYNCHRONOUS BUSINESS DOMAINS
              </text>
              <text x="40" y="500" fill="#94A3B8" fontSize="11" fontWeight="bold" letterSpacing="0.05em">
                TIER 2 : DATA STORAGE & EVENT BROKERS
              </text>
            </g>

            {/* Dependency Edges */}
            <g>
              {edges.map((edge) => {
                const src = NODE_COORDINATES[edge.source];
                const tgt = NODE_COORDINATES[edge.target];
                if (!src || !tgt) return null;

                const style = getEdgeStyle(edge.source, edge.target, edge.status);
                const markerId =
                  style.stroke === '#EF4444'
                    ? 'url(#arrow-critical)'
                    : style.stroke === '#F59E0B'
                    ? 'url(#arrow-degraded)'
                    : style.stroke === '#8B5CF6'
                    ? 'url(#arrow-selected)'
                    : 'url(#arrow-normal)';

                // Calculate edge curve
                const dx = tgt.x - src.x;
                const dy = tgt.y - src.y;
                const midX = (src.x + tgt.x) / 2;
                const midY = (src.y + tgt.y) / 2;

                const startY = src.y + NODE_HEIGHT / 2;
                const endY = tgt.y - NODE_HEIGHT / 2;
                const pathData = `M ${src.x} ${startY} Q ${midX} ${midY} ${tgt.x} ${endY}`;

                return (
                  <g key={edge.id}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={style.stroke}
                      strokeWidth={style.strokeWidth}
                      strokeDasharray={style.strokeDasharray}
                      className={style.className}
                      opacity={style.opacity}
                      markerEnd={markerId}
                    />
                    {/* Protocol Pill */}
                    <rect
                      x={midX - 25}
                      y={midY - 9}
                      width={50}
                      height={18}
                      rx={4}
                      fill="#0A0E17"
                      stroke={style.stroke}
                      strokeWidth="1"
                      opacity="0.95"
                    />
                    <text
                      x={midX}
                      y={midY + 3.5}
                      fill="#CBD5E1"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                    >
                      {edge.protocol}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Service Nodes */}
            <g>
              {Object.values(services).map((node) => {
                const pos = NODE_COORDINATES[node.id];
                if (!pos) return null;

                const isSelected = selectedServiceId === node.id;
                const isFiltered = isNodeFiltered(node.state);
                const isRoot = activeIncident?.rootService === node.id;
                const isAffected = activeIncident?.affectedServices.includes(node.id);
                const nodeColor = getStatusColor(node.state);

                const halfW = NODE_WIDTH / 2;
                const halfH = NODE_HEIGHT / 2;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x - halfW}, ${pos.y - halfH})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedServiceId(node.id);
                    }}
                    className="service-node-card cursor-pointer transition-transform hover:scale-105"
                    opacity={isFiltered ? 0.25 : 1}
                    filter={isSelected ? 'url(#glow-purple-lg)' : isRoot ? 'url(#glow-red-lg)' : undefined}
                  >
                    {/* Node Card Base Surface */}
                    <rect
                      width={NODE_WIDTH}
                      height={NODE_HEIGHT}
                      rx="12"
                      fill="#111827"
                      stroke={isSelected ? '#8B5CF6' : isRoot ? '#EF4444' : isAffected ? '#F59E0B' : '#263244'}
                      strokeWidth={isSelected || isRoot ? 2.8 : 1.5}
                    />

                    {/* Top colored status indicator stripe */}
                    <rect
                      width={NODE_WIDTH}
                      height="5"
                      rx="2.5"
                      fill={nodeColor}
                    />

                    {/* Service Name */}
                    <text
                      x="12"
                      y="26"
                      fill="#FFFFFF"
                      fontSize="12.5"
                      fontWeight="bold"
                      fontFamily="Inter, sans-serif"
                    >
                      {node.name.length > 20 ? node.name.substring(0, 19) + '…' : node.name}
                    </text>

                    {/* Category Badge */}
                    <rect
                      x="12"
                      y="34"
                      width="64"
                      height="16"
                      rx="4"
                      fill="#161D2B"
                    />
                    <text
                      x="44"
                      y="45.5"
                      fill="#94A3B8"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="uppercase"
                    >
                      {node.category}
                    </text>

                    {/* Risk Score Pill */}
                    <rect
                      x={NODE_WIDTH - 48}
                      y="14"
                      width="38"
                      height="20"
                      rx="6"
                      fill={
                        node.riskScore >= 80
                          ? 'rgba(239,68,68,0.25)'
                          : node.riskScore >= 60
                          ? 'rgba(245,158,11,0.25)'
                          : 'rgba(34,197,94,0.2)'
                      }
                      stroke={nodeColor}
                      strokeWidth="1.2"
                    />
                    <text
                      x={NODE_WIDTH - 29}
                      y="28"
                      fill={nodeColor}
                      fontSize="11"
                      fontWeight="800"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="middle"
                    >
                      {node.riskScore}
                    </text>

                    {/* Divider line */}
                    <line
                      x1="12"
                      y1="56"
                      x2={NODE_WIDTH - 12}
                      y2="56"
                      stroke="#1E293B"
                      strokeWidth="1"
                    />

                    {/* Bottom Metrics: Latency, Error Rate, Replicas */}
                    <text
                      x="12"
                      y="73"
                      fill="#CBD5E1"
                      fontSize="10.5"
                      fontWeight="600"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {Math.round(node.latency)}ms
                    </text>

                    <text
                      x={NODE_WIDTH - 12}
                      y="73"
                      fill={node.errorRate > 1 ? '#EF4444' : '#94A3B8'}
                      fontSize="10"
                      fontWeight={node.errorRate > 1 ? '800' : '500'}
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="end"
                    >
                      {node.errorRate.toFixed(1)}% err
                    </text>

                    {/* Root Cause Alert Ping Beacon */}
                    {isRoot && (
                      <g transform={`translate(${NODE_WIDTH - 6}, -4)`}>
                        <circle cx="0" cy="0" r="10" fill="#EF4444" className="animate-ping" />
                        <circle cx="0" cy="0" r="7" fill="#EF4444" />
                        <text x="0" y="3.5" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle">
                          !
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Legend in corner */}
        <div className="hidden sm:block absolute bottom-3 left-3 bg-[#111827]/90 backdrop-blur border border-[#263244] p-2.5 rounded-xl text-xs space-y-1.5 shadow-xl pointer-events-none z-10">
          <div className="text-[10px] uppercase font-bold text-slate-400">Node Status</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Healthy</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-slate-300">At Risk</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-300">Degraded</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-slate-300">Critical</span>
            </span>
          </div>
        </div>

        {/* Selected Service Detail Drawer (Responsive: Drawer on desktop, Modal/BottomSheet on mobile/tablet) */}
        {selectedService && (
          <div className="fixed inset-y-0 right-0 z-50 lg:static w-full sm:w-96 bg-[#0D111B] border-l border-[#263244] flex flex-col h-full shrink-0 shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#263244] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: getStatusColor(selectedService.state) }}
                />
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{selectedService.name}</h3>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    {selectedService.category} · Tier {selectedService.tier}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedServiceId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-[#161D2B]"
                aria-label="Close service details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <p className="text-xs text-slate-300 leading-relaxed bg-[#111827] p-2.5 rounded-lg border border-[#263244]">
                {selectedService.description}
              </p>

              {/* Live Score & Status */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#161D2B] border border-[#263244]">
                  <span className="text-[10px] text-slate-400 block font-medium">Risk Score</span>
                  <div className="text-xl font-bold mt-0.5" style={{ color: getStatusColor(selectedService.state) }}>
                    {selectedService.riskScore}
                    <span className="text-xs text-slate-400 font-normal"> / 100</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{selectedService.state} State</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#161D2B] border border-[#263244]">
                  <span className="text-[10px] text-slate-400 block font-medium">Response Latency</span>
                  <div className="text-xl font-bold text-white mt-0.5">
                    {Math.round(selectedService.latency)}
                    <span className="text-xs text-slate-400 font-normal"> ms</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Error: {selectedService.errorRate.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Resource Saturation */}
              <div className="p-3 rounded-lg bg-[#111827] border border-[#263244] space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Host Resource Saturation</span>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-slate-400">CPU Usage</span>
                      <span className="text-white font-mono">{selectedService.cpu}%</span>
                    </div>
                    <div className="w-full bg-[#161D2B] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${selectedService.cpu > 80 ? 'bg-red-500' : 'bg-indigo-500'}`}
                        style={{ width: `${selectedService.cpu}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-slate-400">Memory Usage</span>
                      <span className="text-white font-mono">{selectedService.memory}%</span>
                    </div>
                    <div className="w-full bg-[#161D2B] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${selectedService.memory > 80 ? 'bg-red-500' : 'bg-cyan-500'}`}
                        style={{ width: `${selectedService.memory}%` }}
                      />
                    </div>
                  </div>

                  {selectedService.connectionPoolUtil !== undefined && (
                    <div>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-slate-400">DB Connection Pool</span>
                        <span className="text-white font-mono">{selectedService.connectionPoolUtil}%</span>
                      </div>
                      <div className="w-full bg-[#161D2B] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${selectedService.connectionPoolUtil > 80 ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${selectedService.connectionPoolUtil}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Risk Factors Breakdown */}
              <div className="p-3 rounded-lg bg-[#111827] border border-[#263244] space-y-1.5">
                <span className="text-xs font-semibold text-slate-300 block">Contributing Risk Factors</span>
                <ul className="space-y-1 text-xs">
                  {selectedService.riskFactors.map((f, i) => (
                    <li key={i} className="flex items-start space-x-1.5 text-slate-300">
                      <span className="text-purple-400 text-xs mt-0.5">•</span>
                      <span className="text-[11px] leading-tight">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Dependency Links */}
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-slate-300 block">Upstream Callers ({upstreamServices.length})</span>
                {upstreamServices.length === 0 ? (
                  <span className="text-slate-400 text-[11px]">No callers (Edge Ingress)</span>
                ) : (
                  <div className="space-y-1">
                    {upstreamServices.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedServiceId(u.id)}
                        className="p-1.5 rounded bg-[#161D2B] hover:bg-[#1E2638] cursor-pointer flex items-center justify-between text-[11px]"
                      >
                        <span className="text-slate-200">{u.name}</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(u.state) }} />
                      </div>
                    ))}
                  </div>
                )}

                <span className="font-semibold text-slate-300 block mt-2">
                  Downstream Callee Targets ({downstreamServices.length})
                </span>
                {downstreamServices.length === 0 ? (
                  <span className="text-slate-400 text-[11px]">No downstream targets (Storage / Worker)</span>
                ) : (
                  <div className="space-y-1">
                    {downstreamServices.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => setSelectedServiceId(d.id)}
                        className="p-1.5 rounded bg-[#161D2B] hover:bg-[#1E2638] cursor-pointer flex items-center justify-between text-[11px]"
                      >
                        <span className="text-slate-200">{d.name}</span>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(d.state) }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Logs for this service */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Recent Telemetry Events</span>
                  <button
                    onClick={() => setActiveTab('logs')}
                    className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    View in Logs →
                  </button>
                </div>
                <div className="space-y-1.5 font-mono text-[10px] max-h-36 overflow-y-auto">
                  {serviceLogs.length === 0 ? (
                    <p className="text-slate-400 text-xs">No active logs</p>
                  ) : (
                    serviceLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-1.5 rounded border ${
                          log.severity === 'FATAL' || log.severity === 'ERROR'
                            ? 'bg-red-950/20 border-red-500/30 text-red-300'
                            : log.severity === 'WARN'
                            ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
                            : 'bg-[#161D2B] border-[#263244] text-slate-300'
                        }`}
                      >
                        <span className="text-slate-400 mr-1">[{log.timestamp}]</span>
                        <span>{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
