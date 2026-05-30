import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Trash2, Star, X, CheckSquare, Square,
  Beaker, Clock, Calendar, Activity
} from 'lucide-react';
import MetricsLineChart from '../../components/charts/MetricsLineChart';

const api = {
  experiments: {
    list: () => fetch('/api/experiments/').then(r => r.json()),
    update: ({ id, data }) => fetch(`/api/experiments/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    }).then(r => r.json()),
    delete: (id) => fetch(`/api/experiments/${id}`, { method: 'DELETE' }),
  },
  runs: {
    list: (expId) => fetch(`/api/experiments/${expId}/runs`).then(r => r.json()),
    markBest: ({ expId, runId }) => fetch(`/api/experiments/${expId}/runs/${runId}/best`, {
      method: 'PUT'
    }).then(r => r.json()),
    create: ({ expId, data }) => fetch(`/api/experiments/${expId}/runs`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
    }).then(r => r.json()),
  },
};

const statusColors = { active: 'bg-emerald-500/20 text-emerald-400', completed: 'bg-blue-500/20 text-blue-400', failed: 'bg-red-500/20 text-red-400' };
const runStatusColors = { running: 'bg-amber-500/20 text-amber-400', completed: 'bg-emerald-500/20 text-emerald-400', failed: 'bg-red-500/20 text-red-400', pending: 'bg-slate-500/20 text-slate-400' };

function StatusBadge({ status, colors }) {
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.active}`}>{status}</span>;
}

function RunCard({ run, expId, onMarkBest, onToggleCompare, isCompareSelected, compareDisabled }) {
  return (
    <motion.div
      layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#13151C] rounded-xl border border-white/5 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">{run.model_name}</span>
          {run.is_best && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 uppercase">Best</span>}
        </div>
        <button
          onClick={() => onToggleCompare(run.id)}
          disabled={compareDisabled && !isCompareSelected}
          className={`p-1 rounded transition-colors ${isCompareSelected ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {isCompareSelected ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>
      </div>
      <StatusBadge status={run.status} colors={runStatusColors} />
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1"><Clock size={12} />{run.duration}s</span>
        <span className="flex items-center gap-1"><Calendar size={12} />{new Date(run.created_at).toLocaleDateString()}</span>
      </div>
      {run.metrics && <div className="h-16"><MetricsLineChart data={run.metrics} /></div>}
      <button
        onClick={() => onMarkBest({ expId, runId: run.id })}
        className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <Star size={12} /> Mark as Best
      </button>
    </motion.div>
  );
}

function AddRunModal({ expId, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ model_name: '', framework: '', hyperparameters: '' });
  const mutation = useMutation({
    mutationFn: (data) => api.runs.create({ expId, data }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['runs', expId] }); onClose(); },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-[#13151C] rounded-2xl border border-white/10 p-6 w-full max-w-md space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white">Add Run</h3>
        {[{ key: 'model_name', label: 'Model Name' }, { key: 'framework', label: 'Framework' }, { key: 'hyperparameters', label: 'Hyperparameters (JSON)' }].map(f => (
          <div key={f.key}>
            <label className="block text-sm text-slate-400 mb-1">{f.label}</label>
            {f.key === 'hyperparameters' ? (
              <textarea
                value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 h-20"
              />
            ) : (
              <input
                value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
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
            {mutation.isPending ? 'Creating...' : 'Create Run'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ExperimentsPage() {
  console.log("ExperimentsPage rendering");
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingName, setEditingName] = useState('');
  const [editingDesc, setEditingDesc] = useState('');
  const [showAddRun, setShowAddRun] = useState(false);
  const [compareIds, setCompareIds] = useState([]);

  const { data } = useQuery({ queryKey: ['experiments'], queryFn: api.experiments.list });
  const experiments = Array.isArray(data) ? data : [];
  const { data: runs = [] } = useQuery({ queryKey: ['runs', selectedId], queryFn: () => api.runs.list(selectedId), enabled: !!selectedId });

  const updateMutation = useMutation({
    mutationFn: api.experiments.update,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['experiments'] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: api.experiments.delete,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['experiments'] }); setSelectedId(null); },
  });
  const markBestMutation = useMutation({
    mutationFn: api.runs.markBest,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['runs', selectedId] }); },
  });

  const selected = experiments.find(e => e.id === selectedId);
  const filtered = experiments.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleCompare = (runId) => {
    setCompareIds(prev => prev.includes(runId) ? prev.filter(id => id !== runId) : prev.length < 2 ? [...prev, runId] : prev);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#0A0B0F] text-white">
      <div className="w-[320px] min-w-[320px] border-r border-white/5 flex flex-col">
        <div className="p-4 space-y-3 border-b border-white/5">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search experiments..."
              className="w-full bg-[#13151C] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="bg-[#13151C] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs hover:bg-indigo-500 transition-colors ml-auto">
              <Plus size={14} /> New
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <AnimatePresence>
            {filtered.map(exp => (
              <motion.button
                key={exp.id} layout
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                onClick={() => { setSelectedId(exp.id); setEditingName(exp.name); setEditingDesc(exp.description || ''); }}
                className={`w-full text-left p-3 rounded-xl transition-colors ${selectedId === exp.id ? 'bg-indigo-500/10 border border-indigo-500/30' : 'hover:bg-white/5 border border-transparent'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white truncate">{exp.name}</span>
                  <StatusBadge status={exp.status} colors={statusColors} />
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Activity size={12} />{exp.run_count} runs</span>
                  <span className="flex items-center gap-1"><Calendar size={12} />{new Date(exp.created_at).toLocaleDateString()}</span>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {selected ? (
          <div className="space-y-6 max-w-4xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <input
                  value={editingName} onChange={e => setEditingName(e.target.value)}
                  onBlur={() => { if (editingName !== selected.name) updateMutation.mutate({ id: selected.id, data: { name: editingName } }); }}
                  className="text-2xl font-bold bg-transparent text-white border-b border-transparent focus:border-indigo-500 focus:outline-none px-1"
                />
                <button
                  onClick={() => { deleteMutation.mutate(selected.id); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
              <textarea
                value={editingDesc} onChange={e => setEditingDesc(e.target.value)}
                onBlur={() => { if (editingDesc !== selected.description) updateMutation.mutate({ id: selected.id, data: { description: editingDesc } }); }}
                className="w-full bg-transparent text-sm text-slate-400 border border-transparent focus:border-indigo-500/30 rounded-lg px-2 py-1 focus:outline-none resize-none"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Runs</h3>
              <button
                onClick={() => setShowAddRun(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition-colors"
              >
                <Plus size={16} /> Add Run
              </button>
            </div>

            {compareIds.length === 2 ? (
              <div className="grid grid-cols-2 gap-4">
                {compareIds.map(id => {
                  const run = runs.find(r => r.id === id);
                  if (!run) return null;
                  return (
                    <div key={id} className="bg-[#13151C] rounded-xl border border-indigo-500/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{run.model_name}</span>
                        {run.is_best && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 uppercase">Best</span>}
                      </div>
                      <StatusBadge status={run.status} colors={runStatusColors} />
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Clock size={12} />{run.duration}s</span>
                        <span className="flex items-center gap-1"><Calendar size={12} />{new Date(run.created_at).toLocaleDateString()}</span>
                      </div>
                      {run.metrics && <div className="h-24"><MetricsLineChart data={run.metrics} /></div>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {runs.map(run => (
                  <RunCard
                    key={run.id} run={run} expId={selected.id}
                    onMarkBest={markBestMutation.mutate}
                    onToggleCompare={toggleCompare}
                    isCompareSelected={compareIds.includes(run.id)}
                    compareDisabled={compareIds.length >= 2}
                  />
                ))}
              </div>
            )}

            <AnimatePresence>{showAddRun && <AddRunModal expId={selected.id} onClose={() => setShowAddRun(false)} />}</AnimatePresence>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <Beaker size={48} className="mx-auto text-slate-600" />
              <p className="text-lg text-slate-500">Select an experiment</p>
              <p className="text-sm text-slate-600">Choose from the list on the left</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
