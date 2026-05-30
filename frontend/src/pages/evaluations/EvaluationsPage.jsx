import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, History, BarChart3, CheckCircle, XCircle,
  Search, AlertTriangle, Lightbulb, ChevronRight, X, Sliders
} from 'lucide-react';
import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
});

const tabs = [
  { id: 'run', label: 'Run Evaluation', icon: Play },
  { id: 'history', label: 'History', icon: History },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
];

const evalTypes = ['hallucination', 'relevance', 'safety', 'bias', 'faithfulness', 'custom'];

function DonutChart({ data }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (!total) return null;
  const colors = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  let cumulative = 0;
  const segments = Object.entries(data).map(([key, val], i) => {
    const pct = (val / total) * 100;
    const start = cumulative;
    cumulative += pct;
    return { key, val, pct, start, color: colors[i % colors.length] };
  });
  const r = 40;
  const cx = 50;
  const cy = 50;
  const segs = segments.map((s) => {
    const a1 = (s.start / 100) * 360 - 90;
    const a2 = ((s.start + s.pct) / 100) * 360 - 90;
    const x1 = cx + r * Math.cos((a1 * Math.PI) / 180);
    const y1 = cy + r * Math.sin((a1 * Math.PI) / 180);
    const x2 = cx + r * Math.cos((a2 * Math.PI) / 180);
    const y2 = cy + r * Math.sin((a2 * Math.PI) / 180);
    const large = s.pct > 50 ? 1 : 0;
    return { ...s, path: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z` };
  });
  return (
    <svg viewBox="0 0 100 100" className="w-32 h-32">
      {segs.map((s, i) => (
        <motion.path
          key={s.key} d={s.path} fill={s.color}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.08 }}
        />
      ))}
      <circle cx={cx} cy={cy} r="18" fill="#13151C" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="10" fontWeight="bold">
        {total}
      </text>
    </svg>
  );
}

export default function EvaluationsPage() {
  const [activeTab, setActiveTab] = useState('run');
  const [form, setForm] = useState({
    eval_name: '', eval_type: 'hallucination', model_output: '',
    context: '', ground_truth: '', custom_criteria: '', threshold: 0.7,
  });
  const [search, setSearch] = useState('');
  const [selectedEval, setSelectedEval] = useState(null);
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();

  const { data: evaluations } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => API.get('/evaluations/').then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['evaluation-stats'],
    queryFn: () => API.get('/evaluations/stats').then(r => r.data),
  });

  const runMutation = useMutation({
    mutationFn: (body) => API.post('/evaluations/', body),
    onSuccess: (res) => {
      setResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-stats'] });
    },
  });

  const handleRun = (e) => {
    e.preventDefault();
    const body = { ...form, threshold: parseFloat(form.threshold) };
    if (body.eval_type !== 'custom') delete body.custom_criteria;
    runMutation.mutate(body);
  };

  const filtered = evaluations?.filter((ev) =>
    ev.eval_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-gray-100 p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Evaluations</h1>

      <div className="flex gap-1 bg-[#13151C] rounded-xl p-1 border border-gray-800 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-[#6366F1] text-white shadow-lg' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'run' && (
          <motion.div
            key="run" variants={{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }}
            initial="initial" animate="animate" exit="exit"
            className="space-y-6"
          >
            <form onSubmit={handleRun} className="bg-[#13151C] rounded-xl border border-gray-800 p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Evaluation Name</label>
                  <input
                    value={form.eval_name} onChange={(e) => setForm({ ...form, eval_name: e.target.value })}
                    className="w-full bg-[#0A0B0F] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Evaluation Type</label>
                  <select
                    value={form.eval_type} onChange={(e) => setForm({ ...form, eval_type: e.target.value })}
                    className="w-full bg-[#0A0B0F] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
                  >
                    {evalTypes.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Model Output</label>
                <textarea
                  value={form.model_output} onChange={(e) => setForm({ ...form, model_output: e.target.value })}
                  className="w-full bg-[#0A0B0F] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366F1] transition-colors resize-none font-mono"
                  rows={6}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Context</label>
                  <textarea
                    value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })}
                    className="w-full bg-[#0A0B0F] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366F1] transition-colors resize-none font-mono"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Ground Truth</label>
                  <textarea
                    value={form.ground_truth} onChange={(e) => setForm({ ...form, ground_truth: e.target.value })}
                    className="w-full bg-[#0A0B0F] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366F1] transition-colors resize-none font-mono"
                    rows={4}
                  />
                </div>
              </div>
              <AnimatePresence>
                {form.eval_type === 'custom' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="block text-sm text-gray-400 mb-1">Custom Criteria</label>
                    <textarea
                      value={form.custom_criteria} onChange={(e) => setForm({ ...form, custom_criteria: e.target.value })}
                      className="w-full bg-[#0A0B0F] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366F1] transition-colors resize-none"
                      rows={3}
                      placeholder="Define your custom evaluation criteria..."
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <div>
                <label className="block text-sm text-gray-400 mb-1 flex items-center gap-2">
                  <Sliders size={14} /> Threshold: <span className="text-[#6366F1] font-semibold">{form.threshold}</span>
                </label>
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-700 accent-[#6366F1]"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span><span>0.5</span><span>1.0</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={runMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#6366F1] text-white font-medium hover:bg-[#5558E6] transition-colors disabled:opacity-50"
              >
                <Play size={18} /> {runMutation.isPending ? 'Running...' : 'Run Evaluation'}
              </motion.button>
            </form>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-[#13151C] rounded-xl border border-gray-800 p-6 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 120, damping: 12 }}
                        className="text-5xl font-bold text-[#6366F1]"
                      >
                        {(result.score * 100).toFixed(0)}
                        <span className="text-lg text-gray-400">%</span>
                      </motion.div>
                      <div>
                        <div className="flex items-center gap-2">
                          {result.passed ? (
                            <span className="flex items-center gap-1 text-green-400 font-medium"><CheckCircle size={16} /> Passed</span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-400 font-medium"><XCircle size={16} /> Failed</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400">Threshold: {result.threshold}</div>
                      </div>
                    </div>
                  </div>

                  {result.explanation && (
                    <div className="bg-[#0A0B0F] rounded-lg p-3 text-sm text-gray-300">
                      {result.explanation}
                    </div>
                  )}

                  {result.issues?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
                        <AlertTriangle size={14} /> Issues ({result.issues.length})
                      </h4>
                      <ul className="space-y-1">
                        {result.issues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-300 bg-red-500/5 rounded-lg px-3 py-2">
                            <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" /> {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.suggestions?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-1">
                        <Lightbulb size={14} /> Suggestions
                      </h4>
                      <ul className="space-y-1">
                        {result.suggestions.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-300 bg-[#6366F1]/5 rounded-lg px-3 py-2">
                            <Lightbulb size={14} className="text-[#6366F1] mt-0.5 shrink-0" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history" variants={{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }}
            initial="initial" animate="animate" exit="exit"
            className="space-y-4"
          >
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-sm bg-[#13151C] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
                placeholder="Search by name..."
              />
            </div>
            <div className="bg-[#13151C] rounded-xl border border-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-left">
                    <th className="px-4 py-3 text-gray-400 font-medium">Name</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Type</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Score</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Status</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Threshold</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Date</th>
                    <th className="px-4 py-3 text-gray-400 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered?.map((ev) => (
                    <tr
                      key={ev.id}
                      onClick={() => setSelectedEval(ev)}
                      className="border-b border-gray-800/50 hover:bg-gray-800/20 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium">{ev.eval_name}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/40 text-gray-300">
                          {ev.eval_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={ev.score >= ev.threshold ? 'text-green-400' : 'text-red-400'}>
                          {(ev.score * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {ev.passed ? (
                          <CheckCircle size={18} className="text-green-400" />
                        ) : (
                          <XCircle size={18} className="text-red-400" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{ev.threshold}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(ev.created_at)}</td>
                      <td className="px-4 py-3"><ChevronRight size={16} className="text-gray-500" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AnimatePresence>
              {selectedEval && (
                <motion.div
                  variants={{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }}
                  initial="initial" animate="animate" exit="exit"
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                  onClick={() => setSelectedEval(null)}
                >
                  <motion.div
                    variants={{ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } }}
                    initial="initial" animate="animate" exit="exit"
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#13151C] rounded-xl border border-gray-800 p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold">{selectedEval.eval_name}</h2>
                      <button onClick={() => setSelectedEval(null)} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-[#0A0B0F] rounded-lg p-3">
                        <div className="text-xs text-gray-500">Type</div>
                        <div className="text-sm font-medium">{selectedEval.eval_type}</div>
                      </div>
                      <div className="bg-[#0A0B0F] rounded-lg p-3">
                        <div className="text-xs text-gray-500">Score</div>
                        <div className={`text-lg font-bold ${selectedEval.passed ? 'text-green-400' : 'text-red-400'}`}>
                          {(selectedEval.score * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="bg-[#0A0B0F] rounded-lg p-3">
                        <div className="text-xs text-gray-500">Threshold</div>
                        <div className="text-sm font-medium">{selectedEval.threshold}</div>
                      </div>
                      <div className="bg-[#0A0B0F] rounded-lg p-3">
                        <div className="text-xs text-gray-500">Status</div>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          {selectedEval.passed ? (
                            <><CheckCircle size={16} className="text-green-400" /> Passed</>
                          ) : (
                            <><XCircle size={16} className="text-red-400" /> Failed</>
                          )}
                        </div>
                      </div>
                    </div>
                    {selectedEval.explanation && (
                      <div className="bg-[#0A0B0F] rounded-lg p-3 mb-4">
                        <div className="text-xs text-gray-500 mb-1">Explanation</div>
                        <div className="text-sm text-gray-300">{selectedEval.explanation}</div>
                      </div>
                    )}
                    {selectedEval.issues?.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-2">Issues</div>
                        <ul className="space-y-1">
                          {selectedEval.issues.map((issue, i) => (
                            <li key={i} className="text-sm text-gray-300 bg-red-500/5 rounded-lg px-3 py-2 flex items-start gap-2">
                              <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" /> {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedEval.suggestions?.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Suggestions</div>
                        <ul className="space-y-1">
                          {selectedEval.suggestions.map((s, i) => (
                            <li key={i} className="text-sm text-gray-300 bg-[#6366F1]/5 rounded-lg px-3 py-2 flex items-start gap-2">
                              <Lightbulb size={14} className="text-[#6366F1] mt-0.5 shrink-0" /> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === 'stats' && (
          <motion.div
            key="stats" variants={{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }}
            initial="initial" animate="animate" exit="exit"
            className="space-y-6"
          >
            {stats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                    className="bg-[#13151C] rounded-xl border border-gray-800 p-5"
                  >
                    <div className="text-sm text-gray-400 mb-1">Total Evaluations</div>
                    <div className="text-3xl font-bold text-white">{stats.total || 0}</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#13151C] rounded-xl border border-gray-800 p-5"
                  >
                    <div className="text-sm text-gray-400 mb-1">Passed</div>
                    <div className="text-3xl font-bold text-green-400">{stats.passed || 0}</div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#13151C] rounded-xl border border-gray-800 p-5"
                  >
                    <div className="text-sm text-gray-400 mb-1">Average Score</div>
                    <div className="text-3xl font-bold text-[#6366F1]">
                      {stats.average_score != null ? `${(stats.average_score * 100).toFixed(0)}%` : '—'}
                    </div>
                  </motion.div>
                </div>
                {stats.by_type && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#13151C] rounded-xl border border-gray-800 p-5"
                  >
                    <h3 className="text-sm font-medium text-gray-400 mb-4">By Type</h3>
                    <div className="flex items-center gap-8">
                      <DonutChart data={stats.by_type} />
                      <div className="space-y-2">
                        {Object.entries(stats.by_type).map(([key, val], i) => {
                          const colors = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
                          return (
                            <div key={key} className="flex items-center gap-2 text-sm">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                              <span className="text-gray-300 capitalize">{key}</span>
                              <span className="text-gray-500 ml-auto">{val}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
