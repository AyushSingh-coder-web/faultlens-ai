import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  Copy,
  ExternalLink,
  FileText,
  Filter,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LogEntry, ServiceId } from '../../types';

export const LogExplorer: React.FC = () => {
  const { logs, services, setActiveTab, setSelectedServiceId } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedService, setSelectedService] = useState<string>('ALL');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter logs according to user controls
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedSeverity !== 'ALL' && log.severity !== selectedSeverity) {
        return false;
      }
      if (selectedService !== 'ALL' && log.service !== selectedService) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesMsg = log.message.toLowerCase().includes(query);
        const matchesCorr = log.correlationId.toLowerCase().includes(query);
        const matchesSrv = log.serviceName.toLowerCase().includes(query);
        const matchesCode = log.errorCode?.toLowerCase().includes(query);
        if (!matchesMsg && !matchesCorr && !matchesSrv && !matchesCode) {
          return false;
        }
      }
      return true;
    });
  }, [logs, selectedSeverity, selectedService, searchQuery]);

  const toggleSelectLog = (id: string) => {
    setSelectedLogIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'FATAL':
        return 'bg-purple-950 text-red-400 border border-red-500/50 font-bold';
      case 'ERROR':
        return 'bg-red-500/20 text-red-400 border border-red-500/30 font-semibold';
      case 'WARN':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold';
      default:
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-3 sm:space-y-4 max-w-7xl mx-auto h-[calc(100vh-4.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Distributed Log Explorer</span>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {filteredLogs.length} events
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Coherent multi-service log telemetry with correlation IDs, latency stamps, and RCA evidence linking.
          </p>
        </div>

        {/* Selected Log Actions */}
        {selectedLogIds.length > 0 && (
          <div className="flex items-center space-x-2 bg-purple-950/40 border border-purple-500/40 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-purple-300 font-medium">
              {selectedLogIds.length} logs tagged for investigation
            </span>
            <button
              onClick={() => setActiveTab('rca')}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-2.5 py-1 rounded flex items-center space-x-1"
            >
              <Compass className="w-3 h-3" />
              <span>Correlate in RCA</span>
            </button>
            <button
              onClick={() => setSelectedLogIds([])}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111827] border border-[#263244] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by keyword, error code, or correlation ID (e.g. HikariPool, ERR_DB_TIMEOUT)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#161D2B] border border-[#263244] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-[#161D2B]"
            >
              Clear
            </button>
          )}
        </div>

        {/* Severity Filter Chips */}
        <div className="flex items-center space-x-1 bg-[#161D2B] p-1 rounded-lg border border-[#263244] text-xs">
          {(['ALL', 'FATAL', 'ERROR', 'WARN', 'INFO'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSelectedSeverity(sev)}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                selectedSeverity === sev
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Service Dropdown */}
        <div className="flex items-center space-x-1">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="bg-[#161D2B] border border-[#263244] text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Services (9)</option>
            {Object.values(services).map((srv) => (
              <option key={srv.id} value={srv.id}>
                {srv.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="flex-1 min-h-0 bg-[#0D111B] border border-[#263244] rounded-xl overflow-hidden flex flex-col shadow-inner">
        <div className="flex-1 overflow-x-auto flex flex-col min-h-0">
          <div className="min-w-[680px] flex flex-col flex-1">
            {/* Table Header */}
            <div className="bg-[#111827] border-b border-[#263244] px-4 py-2 text-[10px] uppercase font-bold text-slate-400 flex items-center select-none shrink-0">
              <div className="w-8">Tag</div>
              <div className="w-20">Time</div>
              <div className="w-18">Severity</div>
              <div className="w-44">Service</div>
              <div className="flex-1">Message</div>
              <div className="w-36 text-right">Correlation ID</div>
            </div>

            {/* Table Rows */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#263244]/40 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No logs found matching current filters.
                </div>
              ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const isSelected = selectedLogIds.includes(log.id);

              return (
                <div key={log.id} className="hover:bg-[#161D2B]/60 transition-colors">
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="px-4 py-2.5 flex items-center cursor-pointer space-x-2"
                  >
                    <div className="w-8 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectLog(log.id)}
                        className="rounded border-slate-700 text-purple-600 focus:ring-0 cursor-pointer"
                      />
                    </div>

                    <div className="w-20 text-[11px] text-slate-400 shrink-0">{log.timestamp}</div>

                    <div className="w-18 shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${getSeverityBadge(log.severity)}`}>
                        {log.severity}
                      </span>
                    </div>

                    <div
                      className="w-44 truncate text-[11px] font-semibold text-slate-200 shrink-0 hover:text-purple-400"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedServiceId(log.service);
                        setActiveTab('topology');
                      }}
                      title="Inspect service in topology"
                    >
                      {log.serviceName}
                    </div>

                    <div className="flex-1 text-[11px] text-slate-300 truncate pr-4">
                      {log.isAnomaly && (
                        <span className="text-red-400 font-bold mr-1.5">● ANOMALY</span>
                      )}
                      <span>{log.message}</span>
                    </div>

                    <div className="w-36 text-right text-[10px] text-slate-400 shrink-0 font-mono flex items-center justify-end space-x-1">
                      <span>{log.correlationId}</span>
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Log Inspector */}
                  {isExpanded && (
                    <div className="p-4 bg-[#080B12] border-t border-[#263244] text-xs space-y-3 font-sans">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 uppercase">
                          Structured Telemetry Payload
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(log, null, 2), log.id)}
                            className="px-2 py-1 rounded bg-[#161D2B] hover:bg-[#1E2638] text-[10px] text-slate-300 flex items-center space-x-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedId === log.id ? 'Copied!' : 'Copy JSON'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 rounded bg-[#111827] border border-[#263244]">
                          <span className="text-[10px] text-slate-400 block">Service ID</span>
                          <span className="font-mono text-white text-[11px]">{log.service}</span>
                        </div>
                        <div className="p-2 rounded bg-[#111827] border border-[#263244]">
                          <span className="text-[10px] text-slate-400 block">Correlation UUID</span>
                          <span className="font-mono text-purple-300 text-[11px]">{log.correlationId}</span>
                        </div>
                        <div className="p-2 rounded bg-[#111827] border border-[#263244]">
                          <span className="text-[10px] text-slate-400 block">Observed Latency</span>
                          <span className="font-mono text-white text-[11px]">
                            {log.latencyMs ? `${log.latencyMs}ms` : 'N/A'}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-[#111827] border border-[#263244]">
                          <span className="text-[10px] text-slate-400 block">Error Code</span>
                          <span className="font-mono text-red-400 text-[11px]">
                            {log.errorCode || 'NONE'}
                          </span>
                        </div>
                      </div>

                      <pre className="p-3 rounded-lg bg-[#04060A] text-slate-300 font-mono text-[11px] overflow-x-auto border border-[#263244]/80">
                        {JSON.stringify(
                          {
                            timestamp: log.timestamp,
                            severity: log.severity,
                            service: log.service,
                            serviceName: log.serviceName,
                            message: log.message,
                            correlationId: log.correlationId,
                            latencyMs: log.latencyMs,
                            errorCode: log.errorCode,
                            metadata: log.metadata || {},
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
