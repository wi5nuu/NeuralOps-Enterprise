import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Clock, AlertTriangle, CheckCircle, XCircle, Plus,
  Eye, EyeOff, Server, Cpu, Layers, Brain, FileText
} from 'lucide-react';

const api = {
  services: {
    list: () => fetch('/api/services/').then(r => r.json()),
    create: (data) => fetch('/api/services/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    }).then(r => r.json()),
    healthCheck: (id) => fetch(`/api/services/${id}/health-check`, { method: 'POST' }).then(r => r.json()),
    logs: (id) => fetch(`/api/services/${id}/logs`).then(r => r.json()),
  },
};

const serviceTypeIcons = { LLM: Brain, RAG: Layers, Classifier: Cpu, 'ML Model': Server };
const serviceTypeColors = { LLM: 'text-violet-400', RAG: 'text-emerald-400', Classifier: 'text-amber-400', 'ML Model': 'text-cyan-400' };
const envColors = { prod: 'bg-red-500/20 text-red-400', staging: 'bg-amber-500/20 text-amber-400', dev: 'bg-blue-500/20 text-blue-400' };

function HealthGauge({ score }) {
  const color = score >= 95 ? 'text-emerald-400' : score >= 80 ? 'text-amber-400' : 'text-red-400';
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="absolute inset-0" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="3"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className={color} transform="rotate(-90 20 20)" />
      </svg>
      <span className={`text-xs font-bold ${color}`}>{score}</span>
    </div>
  );
}

function ServiceCard({ service, onHealthCheck, onToggleLogs, showLogs }) {
  const isHealthy = service.health_status === 'healthy';
  const TypeIcon = serviceTypeIcons[service.service_type] || Activity;

  return (
    <motion.div
      layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#13151C] rounded-xl border border-white/5 p-4 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {isHealthy ? <CheckCircle size={16} className="text-emerald-400" /> : <XCircle size={16} className="text-red-400" />}
          <div>
            <h3 className="text-sm font-medium text-white">{service.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`flex items-center gap-1 text-xs ${serviceTypeColors[service.service_type] || 'text-slate-400'}`}>
                <TypeIcon size={12} />{service.service_type}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${envColors[service.environment] || 'bg-slate-500/20 text-slate-400'}`}>
                {service.environment}
              </span>
            </div>
          </div>
        </div>
        <HealthGauge score={service.health_score ?? 0} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-[#0A0B0F] rounded-lg p-2 space-y-1">
          <span className="text-slate-500">Latency</span>
          <p className="text-white font-medium">{service.avg_latency_ms ?? '-'} ms</p>
        </div>
        <div className="bg-[#0A0B0F] rounded-lg p-2 space-y-1">
          <span className="text-slate-500">SLA Target</span>
          <p className="text-white font-medium">{service.sla_target_ms ?? '-'} ms</p>
        </div>
        <div className="bg-[#0A0B0F] rounded-lg p-2 space-y-1">
          <span className="text-slate-500">Error Rate</span>
          <p className={`font-medium ${(service.error_rate ?? 0) > 5 ? 'text-red-400' : 'text-emerald-400'}`}>
            {service.error_rate ?? 0}%
          </p>
        </div>
        <div className="bg-[#0A0B0F] rounded-lg p-2 space-y-1">
          <span className="text-slate-500">Uptime</span>
          <p className="text-white font-medium">{service.uptime ?? 0}%</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onHealthCheck(service.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-400 text-xs hover:bg-indigo-600/30 transition-colors"
        >
          <Activity size={12} /> Health Check
        </button>
        <button
          onClick={() => onToggleLogs(service.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${showLogs ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
        >
          {showLogs ? <EyeOff size={12} /> : <Eye size={12} />} View Logs
        </button>
      </div>
    </motion.div>
  );
}

function LogsTable({ serviceId }) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['logs', serviceId],
    queryFn: () => api.services.logs(serviceId),
    enabled: !!serviceId,
  });

  if (isLoading) return <div className="text-sm text-slate-500 py-4 text-center">Loading logs...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/5 text-slate-500">
            <th className="text-left py-2 px-3 font-medium">Timestamp</th>
            <th className="text-left py-2 px-3 font-medium">Endpoint</th>
            <th className="text-right py-2 px-3 font-medium">Latency (ms)</th>
            <th className="text-center py-2 px-3 font-medium">Status</th>
            <th className="text-left py-2 px-3 font-medium">Error</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-8 text-slate-500">No logs found</td></tr>
          ) : logs.map((log, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <td className="py-2 px-3 text-slate-300 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
              <td className="py-2 px-3 text-slate-300 font-mono">{log.endpoint}</td>
              <td className="py-2 px-3 text-right text-slate-300">{log.latency_ms}</td>
              <td className="py-2 px-3 text-center">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${(log.status_code ?? 0) >= 400 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {log.status_code}
                </span>
              </td>
              <td className="py-2 px-3 text-slate-400 max-w-[200px] truncate">{log.error_message || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddServiceModal({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '', service_type: 'LLM', environment: 'dev', cloud: 'aws', endpoint_url: '', sla_target_ms: '',
  });
  const mutation = useMutation({
    mutationFn: api.services.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); onClose(); },
  });

  const fields = [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'service_type', label: 'Service Type', type: 'select', options: ['LLM', 'RAG', 'Classifier', 'ML Model'] },
    { key: 'environment', label: 'Environment', type: 'select', options: ['prod', 'staging', 'dev'] },
    { key: 'cloud', label: 'Cloud', type: 'select', options: ['aws', 'gcp', 'azure'] },
    { key: 'endpoint_url', label: 'Endpoint URL', type: 'text' },
    { key: 'sla_target_ms', label: 'SLA Target (ms)', type: 'number' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-[#13151C] rounded-2xl border border-white/10 p-6 w-full max-w-lg space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white">Add Service</h3>
        {fields.map(f => (
          <div key={f.key}>
            <label className="block text-sm text-slate-400 mb-1">{f.label}</label>
            {f.type === 'select' ? (
              <select
                value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                type={f.type} value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm">Cancel</button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors text-sm disabled:opacity-50"
          >
            {mutation.isPending ? 'Adding...' : 'Add Service'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function MonitorPage() {
  const queryClient = useQueryClient();
  const [logsServiceId, setLogsServiceId] = useState(null);
  const [showAddService, setShowAddService] = useState(false);

  const { data } = useQuery({ queryKey: ['services'], queryFn: api.services.list });
  const services = Array.isArray(data) ? data : [];

  const healthCheckMutation = useMutation({
    mutationFn: api.services.healthCheck,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); },
  });

  const toggleLogs = (id) => {
    setLogsServiceId(prev => prev === id ? null : id);
  };

  return (
    <div className="p-6 bg-[#0A0B0F] text-white min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Service Monitor</h1>
        <button
          onClick={() => setShowAddService(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition-colors"
        >
          <Plus size={16} /> Add Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.map(service => (
          <div key={service.id} className="space-y-3">
            <ServiceCard
              service={service}
              onHealthCheck={(id) => healthCheckMutation.mutate(id)}
              onToggleLogs={toggleLogs}
              showLogs={logsServiceId === service.id}
            />
            <AnimatePresence>
              {logsServiceId === service.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#13151C] rounded-xl border border-white/5 overflow-hidden"
                >
                  <div className="p-3 border-b border-white/5 flex items-center gap-2">
                    <FileText size={14} className="text-slate-400" />
                    <span className="text-xs font-medium text-slate-400">Service Logs</span>
                  </div>
                  <div className="p-3">
                    <LogsTable serviceId={service.id} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <AnimatePresence>{showAddService && <AddServiceModal onClose={() => setShowAddService(false)} />}</AnimatePresence>
    </div>
  );
}
