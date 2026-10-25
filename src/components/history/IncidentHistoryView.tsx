import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  AlertOctagon,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  FileDown,
  FileText,
  History,
  Printer,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { IncidentRecord, ServiceId } from '../../types';

export const IncidentHistoryView: React.FC = () => {
  const { incidentHistory, clearHistory, startSimulation, setActiveTab } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(() => {
    return incidentHistory.length > 0 ? incidentHistory[0] : null;
  });
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  const filteredIncidents = incidentHistory.filter((inc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.id.toLowerCase().includes(q) ||
      inc.scenarioTitle.toLowerCase().includes(q) ||
      inc.rootServiceName.toLowerCase().includes(q) ||
      inc.probableRootCause.toLowerCase().includes(q)
    );
  });

  const handleReplay = (incident: IncidentRecord) => {
    startSimulation(incident.scenarioId, incident.severity);
    setActiveTab('simulator');
  };

  // 1. Export as JSON
  const handleExportJSON = (incident: IncidentRecord) => {
    try {
      const payload = {
        exportVersion: '1.0.0',
        platform: 'FaultLens AI Observability Engine',
        exportedAt: new Date().toISOString(),
        incident: {
          id: incident.id,
          scenarioId: incident.scenarioId,
          scenarioTitle: incident.scenarioTitle,
          rootService: incident.rootService,
          rootServiceName: incident.rootServiceName,
          severity: incident.severity,
          status: incident.status,
          startedAt: incident.startedAt,
          resolvedAt: incident.resolvedAt || 'N/A',
          availabilityDipPercentage: incident.availabilityDip,
          peakRiskScore: incident.riskScorePeak,
          probableRootCause: incident.probableRootCause,
          selectedRecoveryStrategy: incident.selectedRecoveryStrategy || 'N/A',
          affectedServices: incident.affectedServices,
          propagationPath: incident.propagationPath,
        },
        rootCauseAnalysis: incident.rcaSummary || null,
        telemetryState: {
          beforeMitigation: incident.beforeState,
          afterMitigation: incident.afterState || null,
        },
      };

      const jsonStr = JSON.stringify(payload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${incident.id}-postmortem.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccessMsg(`Exported ${incident.id}-postmortem.json successfully!`);
      setTimeout(() => setExportSuccessMsg(null), 3000);
    } catch (e) {
      console.error('Failed to export JSON:', e);
    }
  };

  // 2. Export as PDF using jsPDF
  const handleExportPDF = (incident: IncidentRecord) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 40;

      // Header Banner
      doc.setFillColor(13, 17, 27); // #0D111B
      doc.rect(0, 0, pageWidth, 75, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('FaultLens AI — Incident Post-Mortem Report', 30, 36);

      doc.setTextColor(148, 163, 184); // #94A3B8
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Automated AIOps Incident Diagnosis & Root Cause Forensic Telemetry', 30, 52);

      const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
      doc.text(`Generated: ${dateStr}`, pageWidth - 30, 52, { align: 'right' });

      y = 100;

      // Section 1: Incident Identity Table
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('1. Incident Overview', 30, y);
      y += 18;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      const meta = [
        ['Incident ID:', incident.id, 'Severity:', incident.severity],
        ['Scenario Title:', incident.scenarioTitle, 'Status:', incident.status],
        ['Originating Service:', incident.rootServiceName, 'Peak Risk Score:', `${incident.riskScorePeak} / 100`],
        ['Started At:', new Date(incident.startedAt).toLocaleString(), 'Availability Dip:', `-${incident.availabilityDip.toFixed(1)}%`],
        ['Resolved At:', incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : 'N/A', 'Mitigation:', incident.selectedRecoveryStrategy || 'N/A'],
      ];

      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);

      meta.forEach((row) => {
        doc.rect(30, y - 11, pageWidth - 60, 16, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text(row[0], 36, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(row[1], 140, y);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text(row[2], 340, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(row[3], 440, y);

        y += 18;
      });

      y += 15;

      // Section 2: Blast Radius & Propagation
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Cascading Propagation & Blast Radius', 30, y);
      y += 18;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Affected Services (${incident.affectedServices.length}): ${incident.affectedServices.join(', ')}`, 30, y);
      y += 15;
      doc.text(`Inferred Propagation Path: ${incident.propagationPath.join(' -> ')}`, 30, y);
      y += 25;

      // Section 3: Root Cause Analysis & Empirical Evidence
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('3. Root Cause Analysis & Forensic Hypotheses', 30, y);
      y += 18;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Suspected Root Cause: ${incident.probableRootCause}`, 30, y);
      y += 16;

      if (incident.rcaSummary) {
        doc.setFont('helvetica', 'normal');
        doc.text(`Confidence Rating: ${incident.rcaSummary.confidence}% (${incident.rcaSummary.uncertaintyLevel} Uncertainty)`, 30, y);
        y += 16;

        doc.setFont('helvetica', 'bold');
        doc.text('Empirical Telemetry Observations:', 30, y);
        y += 14;
        doc.setFont('helvetica', 'normal');
        incident.rcaSummary.observations.slice(0, 3).forEach((obs) => {
          doc.text(`• ${obs}`, 40, y);
          y += 13;
        });

        y += 6;
        doc.setFont('helvetica', 'bold');
        doc.text('Triangulated Supporting Evidence:', 30, y);
        y += 14;
        doc.setFont('helvetica', 'normal');
        incident.rcaSummary.supportingEvidence.slice(0, 3).forEach((ev) => {
          doc.text(`• [${ev.type}] ${ev.title}: ${ev.description.substring(0, 85)}...`, 40, y);
          y += 13;
        });
      }

      y += 20;

      // Section 4: Before vs After Telemetry
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('4. Before vs After Mitigation State Comparison', 30, y);
      y += 16;

      // Table Header
      doc.setFillColor(226, 232, 240);
      doc.rect(30, y - 11, pageWidth - 60, 16, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text('SERVICE', 36, y);
      doc.text('PRE-RISK', 180, y);
      doc.text('PRE-LATENCY', 260, y);
      doc.text('POST-RISK', 360, y);
      doc.text('POST-LATENCY', 440, y);
      y += 18;

      doc.setFont('helvetica', 'normal');
      if (incident.beforeState && incident.afterState) {
        Object.keys(incident.beforeState).slice(0, 7).forEach((sId) => {
          const b = incident.beforeState[sId as ServiceId];
          const a = incident.afterState?.[sId as ServiceId];
          if (!a) return;

          doc.text(sId, 36, y);
          doc.text(`${b.riskScore}`, 180, y);
          doc.text(`${Math.round(b.latency)}ms`, 260, y);
          doc.text(`${a.riskScore}`, 360, y);
          doc.text(`${Math.round(a.latency)}ms`, 440, y);
          y += 15;
        });
      }

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 25;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('CONFIDENTIAL — Internal SRE Post-Mortem. Generated deterministically by FaultLens AI.', 30, footerY);
      doc.text('Page 1 of 1', pageWidth - 30, footerY, { align: 'right' });

      doc.save(`${incident.id}-postmortem.pdf`);

      setExportSuccessMsg(`Exported ${incident.id}-postmortem.pdf successfully!`);
      setTimeout(() => setExportSuccessMsg(null), 3000);
    } catch (e) {
      console.error('Failed to export PDF:', e);
    }
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <History className="w-5 sm:w-6 h-5 sm:h-6 text-purple-400" />
            <span>Incident Postmortem History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Archived incident timeline, forensic root cause evidence, and historical mitigation outcomes persisted in localStorage.
          </p>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {incidentHistory.length > 0 && (
            <button
              onClick={() => setShowConfirmClear(true)}
              className="flex items-center space-x-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Export Toast Banner */}
      {exportSuccessMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between shadow-lg animate-in fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-emerald-200 font-medium">{exportSuccessMsg}</span>
          </div>
          <button
            onClick={() => setExportSuccessMsg(null)}
            className="text-slate-400 hover:text-white text-xs p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#263244] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Clear Incident History?</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to erase all archived simulated incidents and postmortem telemetry from browser storage?
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="px-3 py-1.5 rounded-lg bg-[#161D2B] text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearHistory();
                  setShowConfirmClear(false);
                  setSelectedIncident(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs"
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {incidentHistory.length === 0 ? (
        <div className="bg-[#111827] border border-[#263244] rounded-2xl p-8 sm:p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center mx-auto">
            <History className="w-7 h-7 text-purple-400" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">No Incidents Recorded Yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Simulate an outage and execute a recovery plan to automatically generate and persist an incident postmortem record.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('simulator')}
            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Launch Failure Simulator
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incident List */}
          <div className="bg-[#111827] border border-[#263244] rounded-xl p-4 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search incident ID, scenario, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#161D2B] border border-[#263244] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredIncidents.map((incident) => {
                const isSelected = selectedIncident?.id === incident.id;
                return (
                  <div
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-950/20 border-purple-500 shadow-md'
                        : 'bg-[#161D2B] border-[#263244] hover:bg-[#1E2638]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-purple-300 font-bold">{incident.id}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                        {incident.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white mt-1 leading-snug">{incident.scenarioTitle}</h4>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                      <span>Origin: {incident.rootServiceName}</span>
                      <span>{new Date(incident.startedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Incident Detail Inspector with Export Suite */}
          <div className="bg-[#111827] border border-[#263244] rounded-xl p-4 sm:p-6 shadow-sm lg:col-span-2">
            {selectedIncident ? (
              <div className="space-y-5">
                {/* Header with Title and Export Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#263244] pb-4">
                  <div>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-mono text-purple-400 font-bold">{selectedIncident.id}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">
                        {new Date(selectedIncident.startedAt).toLocaleString()}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white mt-1 leading-tight">
                      {selectedIncident.scenarioTitle}
                    </h2>
                  </div>

                  {/* Export & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Export JSON Button */}
                    <button
                      onClick={() => handleExportJSON(selectedIncident)}
                      className="flex items-center space-x-1.5 bg-[#161D2B] hover:bg-[#1E2638] text-slate-200 border border-[#263244] text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors shadow-sm"
                      title="Download formatted JSON post-mortem"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Export JSON</span>
                    </button>

                    {/* Export PDF Button */}
                    <button
                      onClick={() => handleExportPDF(selectedIncident)}
                      className="flex items-center space-x-1.5 bg-[#161D2B] hover:bg-[#1E2638] text-slate-200 border border-[#263244] text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors shadow-sm"
                      title="Download SRE PDF post-mortem report"
                    >
                      <FileDown className="w-3.5 h-3.5 text-purple-400" />
                      <span>Export PDF</span>
                    </button>

                    {/* Replay Button */}
                    <button
                      onClick={() => handleReplay(selectedIncident)}
                      className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Replay</span>
                    </button>
                  </div>
                </div>

                {/* Key Metrics Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#161D2B] border border-[#263244]">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Severity</span>
                    <span className="text-sm font-bold text-red-400 font-mono mt-0.5 block">
                      {selectedIncident.severity}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#161D2B] border border-[#263244]">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Peak Risk Score</span>
                    <span className="text-sm font-bold text-purple-300 font-mono mt-0.5 block">
                      {selectedIncident.riskScorePeak} / 100
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#161D2B] border border-[#263244]">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Availability Dip</span>
                    <span className="text-sm font-bold text-amber-400 font-mono mt-0.5 block">
                      -{selectedIncident.availabilityDip.toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#161D2B] border border-[#263244]">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Resolution Status</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                      {selectedIncident.status}
                    </span>
                  </div>
                </div>

                {/* Root Cause & Strategy Used */}
                <div className="p-4 rounded-xl bg-[#161D2B] border border-[#263244] space-y-2">
                  <span className="text-xs font-bold text-slate-300 uppercase block">Root Cause Summary</span>
                  <p className="text-xs text-slate-200">{selectedIncident.probableRootCause}</p>
                  {selectedIncident.selectedRecoveryStrategy && (
                    <div className="mt-2 pt-2 border-t border-[#263244] flex items-center space-x-2 text-xs">
                      <span className="text-slate-400">Executed Strategy:</span>
                      <strong className="text-emerald-400">{selectedIncident.selectedRecoveryStrategy}</strong>
                    </div>
                  )}
                </div>

                {/* Affected Services & Blast Radius */}
                <div>
                  <span className="text-xs font-semibold text-slate-300 block mb-2">
                    Affected Services in Propagation Path ({selectedIncident.affectedServices.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedIncident.affectedServices.map((srvId) => (
                      <span
                        key={srvId}
                        className="text-xs px-2.5 py-1 rounded bg-[#161D2B] text-slate-300 border border-[#263244]"
                      >
                        {srvId}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Before vs After Telemetry Comparison */}
                {selectedIncident.beforeState && selectedIncident.afterState && (
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-300 block">
                      Before vs After Mitigation Telemetry
                    </span>
                    <div className="overflow-x-auto border border-[#263244] rounded-lg">
                      <table className="w-full text-left text-xs min-w-[500px]">
                        <thead className="bg-[#161D2B] text-slate-400 text-[10px] uppercase">
                          <tr>
                            <th className="p-2">Service</th>
                            <th className="p-2">Before Risk</th>
                            <th className="p-2">Before Latency</th>
                            <th className="p-2">After Risk</th>
                            <th className="p-2">After Latency</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#263244] text-[11px] font-mono">
                          {Object.keys(selectedIncident.beforeState).map((sId) => {
                            const b = selectedIncident.beforeState[sId as ServiceId];
                            const a = selectedIncident.afterState?.[sId as ServiceId];
                            if (!a) return null;
                            return (
                              <tr key={sId} className="hover:bg-[#161D2B]/40">
                                <td className="p-2 font-sans font-medium text-white">{sId}</td>
                                <td className="p-2 text-red-400">{b.riskScore}</td>
                                <td className="p-2 text-slate-300">{Math.round(b.latency)}ms</td>
                                <td className="p-2 text-emerald-400 font-bold">{a.riskScore}</td>
                                <td className="p-2 text-emerald-300">{Math.round(a.latency)}ms</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-slate-400 text-xs">
                Select an incident from the list to inspect forensic details and telemetry comparison.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
