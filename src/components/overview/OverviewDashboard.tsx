import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Database,
  Flame,
  Play,
  RotateCcw,
  Server,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ServiceId } from '../../types';

export const OverviewDashboard: React.FC = () => {
  const {
    services,
    activeIncident,
    simulationState,
    setActiveTab,
    startSimulation,
    runPresetDemo,
    resetAllToBaseline,
    setSelectedServiceId,
  } = useApp();

  const serviceList = Object.values(services);
  const totalServices = serviceList.length;
  const healthyServices = serviceList.filter((s) => s.state === 'Healthy').length;
  const atRiskServices = serviceList.filter((s) => s.state === 'At Risk' || s.state === 'Degraded').length;
  const criticalServices = serviceList.filter((s) => s.state === 'Critical').length;

  // Derive cluster-wide availability from edge gateway and core services
  const gateway = services['api-gateway'];
  const orders = services['orders-service'];
  const avgErrorRate = (gateway.errorRate * 0.6 + orders.errorRate * 0.4);
  const clusterAvailability = Math.max(74.2, Math.min(99.99, Number((100 - avgErrorRate).toFixed(2))));

  // Prepare chart data for latency and error rate over time
  const timeLabels = ['10:00', '10:05', '10:10', '10:15', 'Current'];
  const latencyData = timeLabels.map((t, idx) => {
    if (idx < 4) {
      return {
        time: t,
        gateway: gateway.metricsHistory[idx]?.latency || 18,
        orders: orders.metricsHistory[idx]?.latency || 42,
        database: services['postgres-db'].metricsHistory[idx]?.latency || 4,
      };
    }
    return {
      time: 'Now',
      gateway: Math.round(gateway.latency),
      orders: Math.round(orders.latency),
      database: Math.round(services['postgres-db'].latency),
    };
  });

  const errorData = timeLabels.map((t, idx) => {
    if (idx < 4) {
      return {
        time: t,
        gateway: gateway.metricsHistory[idx]?.errorRate || 0.04,
        orders: orders.metricsHistory[idx]?.errorRate || 0.12,
      };
    }
    return {
      time: 'Now',
      gateway: Number(gateway.errorRate.toFixed(2)),
      orders: Number(orders.errorRate.toFixed(2)),
    };
  });

  // Resource consumption data
  const resourceData = serviceList.map((s) => ({
    name: s.name.replace(' Service', '').replace(' Database', ' DB'),
    cpu: s.cpu,
    memory: s.memory,
    risk: s.riskScore,
    state: s.state,
  }));

  // Risk distribution for horizontal bar
  const rankedByRisk = [...serviceList].sort((a, b) => b.riskScore - a.riskScore);

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'Critical':
        return '#EF4444';
      case 'Degraded':
        return '#F59E0B';
      case 'At Risk':
        return '#F97316';
      default:
        return '#22C55E';
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Heading */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight flex flex-wrap items-center gap-2">
            <span>Cluster Observability & Failure Intelligence</span>
            {criticalServices > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse font-semibold">
                INCIDENT ACTIVE
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time dependency telemetry, rule-based cascading risk assessment, and predictive recovery planning.
          </p>
        </div>

        {/* Quick action bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('rca');
            }}
            className="flex items-center space-x-1.5 bg-[#161D2B] hover:bg-[#1E2638] text-slate-200 border border-[#263244] px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>RCA Analysis</span>
          </button>

          <button
            onClick={() => setActiveTab('simulator')}
            className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-purple-900/30 transition-all hover:scale-[1.02]"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Launch Simulator</span>
          </button>

          <button
            onClick={resetAllToBaseline}
            className="flex items-center space-x-1 bg-[#161D2B] hover:bg-[#1F293D] text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg text-xs border border-[#263244] transition-colors"
            title="Reset system to clean baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        <div className="bg-[#111827] border border-[#263244] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Services</span>
            <Server className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{totalServices}</div>
          <div className="text-[10px] text-slate-400 mt-1">3 Architectural Tiers</div>
        </div>

        <div className="bg-[#111827] border border-[#263244] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Healthy</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{healthyServices}</div>
          <div className="text-[10px] text-slate-400 mt-1">Within SLA envelope</div>
        </div>

        <div className="bg-[#111827] border border-[#263244] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">At-Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">{atRiskServices}</div>
          <div className="text-[10px] text-slate-400 mt-1">Elevated risk scores</div>
        </div>

        <div className="bg-[#111827] border border-[#263244] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Critical</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 tracking-tight">{criticalServices}</div>
          <div className="text-[10px] text-slate-400 mt-1">{criticalServices > 0 ? 'Urgent action required' : 'Nominal state'}</div>
        </div>

        <div className="bg-[#111827] border border-[#263244] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Sim Incidents</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 tracking-tight">{activeIncident ? 1 : 0}</div>
          <div className="text-[10px] text-slate-400 mt-1">{activeIncident ? activeIncident.severity : 'None active'}</div>
        </div>

        <div className="bg-[#111827] border border-[#263244] rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-medium uppercase tracking-wider">Availability</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className={`text-2xl font-bold tracking-tight ${clusterAvailability < 95 ? 'text-red-400' : 'text-cyan-300'}`}>
            {clusterAvailability}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Target SLA: 99.95%</div>
        </div>
      </div>

      {/* Active Incident Callout Banner (if incident is running/active) */}
      {activeIncident && (
        <div className="bg-gradient-to-r from-red-950/40 via-[#161D2B] to-[#111827] border border-red-500/40 rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5">
              <AlertOctagon className="w-5 h-5 text-red-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wide">
                  Active Simulated Incident: {activeIncident.id}
                </span>
                <span className="text-[10px] bg-red-500/30 text-red-300 px-2 py-0.2 rounded font-semibold border border-red-500/40">
                  {activeIncident.severity}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">{activeIncident.scenarioTitle}</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                Blast radius affects {activeIncident.affectedServices.length} services ({activeIncident.affectedServices.join(', ')}). Ingress availability is degraded by {activeIncident.availabilityDip.toFixed(1)}%.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('rca')}
              className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow transition-all hover:scale-[1.02]"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Inspect Root Cause</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => setActiveTab('recovery')}
              className="flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow transition-all hover:scale-[1.02]"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Plan Recovery</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Over Time Chart */}
        <div className="bg-[#111827] border border-[#263244] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Request Latency Trajectory</h3>
              <p className="text-[11px] text-slate-400">Response duration (ms) across ingress and storage layers</p>
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="flex items-center space-x-1 text-purple-400">
                <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                <span>API Gateway</span>
              </span>
              <span className="flex items-center space-x-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                <span>Orders Service</span>
              </span>
              <span className="flex items-center space-x-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                <span>PostgreSQL DB</span>
              </span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latencyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGateway" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#263244" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} unit="ms" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161D2B', borderColor: '#263244', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="gateway" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorGateway)" name="API Gateway" />
                <Area type="monotone" dataKey="orders" stroke="#22D3EE" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" name="Orders Service" />
                <Area type="monotone" dataKey="database" stroke="#22C55E" strokeWidth={2} fill="transparent" name="PostgreSQL DB" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error Rate Over Time Chart */}
        <div className="bg-[#111827] border border-[#263244] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Error Rate Anomaly</h3>
              <p className="text-[11px] text-slate-400">Failed request percentage (HTTP 5xx & connection timeouts)</p>
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="flex items-center space-x-1 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                <span>API Gateway (5xx)</span>
              </span>
              <span className="flex items-center space-x-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span>Orders Service</span>
              </span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={errorData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorErr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#263244" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161D2B', borderColor: '#263244', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="gateway" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorErr)" name="API Gateway 5xx" />
                <Area type="monotone" dataKey="orders" stroke="#F59E0B" strokeWidth={2} fill="transparent" name="Orders Service Errors" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row: Service Health Breakdown & Resource Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Highest-Risk Services List */}
        <div className="bg-[#111827] border border-[#263244] rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Risk Leaderboard</h3>
              <span className="text-[11px] text-slate-400">Score / 100</span>
            </div>
            <div className="space-y-2.5">
              {rankedByRisk.slice(0, 5).map((srv) => (
                <div
                  key={srv.id}
                  onClick={() => {
                    setSelectedServiceId(srv.id);
                    setActiveTab('topology');
                  }}
                  className="p-2.5 rounded-lg bg-[#161D2B] hover:bg-[#1E2638] border border-[#263244] cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: getStatusColor(srv.state) }}
                    />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white truncate">{srv.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{srv.riskFactors[0]}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        srv.riskScore >= 80
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : srv.riskScore >= 60
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : srv.riskScore >= 30
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {srv.riskScore}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setActiveTab('topology')}
            className="w-full mt-3 py-2 text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/30 flex items-center justify-center space-x-1.5 transition-colors"
          >
            <span>Explore Full Topology Graph</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* CPU & Memory Utilization Across Services */}
        <div className="bg-[#111827] border border-[#263244] rounded-xl p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Cluster Resource Saturation</h3>
              <p className="text-[11px] text-slate-400">CPU and memory consumption across the 9 microservices</p>
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="flex items-center space-x-1 text-indigo-400">
                <span className="w-2 h-2 rounded bg-indigo-500 inline-block" />
                <span>CPU %</span>
              </span>
              <span className="flex items-center space-x-1 text-cyan-400">
                <span className="w-2 h-2 rounded bg-cyan-500 inline-block" />
                <span>Memory %</span>
              </span>
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resourceData} margin={{ top: 5, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263244" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} angle={-25} textAnchor="end" />
                <YAxis stroke="#64748B" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161D2B', borderColor: '#263244', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="cpu" fill="#6366F1" radius={[3, 3, 0, 0]} name="CPU %" />
                <Bar dataKey="memory" fill="#06B6D4" radius={[3, 3, 0, 0]} name="Memory %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
