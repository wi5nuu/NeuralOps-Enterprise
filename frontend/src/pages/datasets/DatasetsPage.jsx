import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Trash2, Plus, X, ChevronDown, ChevronUp,
  Tag, Layers, Calendar, Table2, Columns
} from 'lucide-react';
import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
  year: 'numeric', month: 'short', day: 'numeric'
});

const variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function DatasetsPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', format: 'CSV', tags: '', split_type: 'train' });
  const [expandedPreview, setExpandedPreview] = useState(false);
  const queryClient = useQueryClient();

  const { data: datasets } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => API.get('/datasets/').then(r => r.data),
  });

  const { data: detail } = useQuery({
    queryKey: ['dataset', selectedId],
    queryFn: () => API.get(`/datasets/${selectedId}`).then(r => r.data),
    enabled: !!selectedId,
  });

  const { data: versions } = useQuery({
    queryKey: ['dataset-versions', selectedId],
    queryFn: () => API.get(`/datasets/${selectedId}/versions`).then(r => r.data),
    enabled: !!selectedId,
  });

  const createMutation = useMutation({
    mutationFn: (body) => API.post('/datasets/', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      setShowModal(false);
      setForm({ name: '', description: '', format: 'CSV', tags: '', split_type: 'train' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => API.delete(`/datasets/${selectedId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      setSelectedId(null);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) });
  };

  return (
    <div className="min-h-screen bg-[#0A0B0F] text-gray-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Datasets</h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6366F1] text-white font-medium hover:bg-[#5558E6] transition-colors"
        >
          <Plus size={18} /> New Dataset
        </motion.button>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            variants={variants} initial="initial" animate="animate" exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              variants={variants} initial="initial" animate="animate" exit="exit"
              className="bg-[#13151C] rounded-xl border border-gray-800 p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Create Dataset</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name</label>
                  <input
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-[#0A0B0F] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <textarea
                    value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-[#0A0B0F] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366F1] transition-colors resize-none"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Format</label>
                    <select
                      value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}
                      className="w-full bg-[#0A0B0F] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
                    >
                      <option>CSV</option>
                      <option>JSON</option>
                      <option>Parquet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Split Type</label>
                    <select
                      value={form.split_type} onChange={(e) => setForm({ ...form, split_type: e.target.value })}
                      className="w-full bg-[#0A0B0F] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
                    >
                      <option>train</option>
                      <option>test</option>
                      <option>validation</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tags (comma separated)</label>
                  <input
                    value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full bg-[#0A0B0F] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
                    placeholder="nlp, sentiment, production"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-2 rounded-lg bg-[#6366F1] text-white font-medium hover:bg-[#5558E6] transition-colors"
                >
                  Create
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasets?.map((ds) => (
          <motion.div
            key={ds.id}
            layoutId={`card-${ds.id}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedId(ds.id)}
            className={`relative rounded-xl border p-4 cursor-pointer transition-colors ${
              selectedId === ds.id
                ? 'border-[#6366F1] bg-[#6366F1]/10'
                : 'border-gray-800 bg-[#13151C] hover:border-gray-700'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-[#6366F1]" />
                <h3 className="font-semibold truncate">{ds.name}</h3>
              </div>
              <div className="flex gap-1">
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#6366F1]/20 text-[#6366F1] font-medium">
                  {ds.format}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-300 font-medium">
                  {ds.split_type}
                </span>
              </div>
            </div>
            {ds.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {ds.tags.map((t, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-gray-700/30 text-gray-400 flex items-center gap-1">
                    <Tag size={10} /> {t}
                  </span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
              <div className="flex items-center gap-1"><Layers size={12} /> {ds.row_count?.toLocaleString()} rows</div>
              <div className="flex items-center gap-1"><Database size={12} /> {ds.size_mb?.toFixed(1)} MB</div>
              <div className="flex items-center gap-1"><Calendar size={12} /> v{ds.version}</div>
            </div>
            <div className="mt-2 text-xs text-gray-500">{formatDate(ds.created_at)}</div>
          </motion.div>
        ))}
      </div>

      {selectedId && detail && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Table2 size={20} className="text-[#6366F1]" /> {detail.name}
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (window.confirm('Delete this dataset? This cannot be undone.')) deleteMutation.mutate();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={16} /> Delete
            </motion.button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-[#13151C] rounded-xl border border-gray-800 p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Columns3 size={16} /> Column Schema</h3>
              <div className="space-y-1.5">
                {detail.schema?.map((col, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-800/50 last:border-0">
                    <span className="text-gray-200">{col.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-700/40 text-gray-400 font-mono">{col.type}</span>
                  </div>
                ))}
              </div>
            </div>

            {detail.profile && (
              <div className="lg:col-span-2 bg-[#13151C] rounded-xl border border-gray-800 p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Profile Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(detail.profile).map(([key, val]) => (
                    <div key={key} className="bg-[#0A0B0F] rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-0.5">{key}</div>
                      <div className="text-sm font-medium truncate">{typeof val === 'number' ? val.toLocaleString() : String(val)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {detail.preview_data?.length > 0 && (
            <div className="bg-[#13151C] rounded-xl border border-gray-800 p-4">
              <button
                onClick={() => setExpandedPreview(!expandedPreview)}
                className="flex items-center gap-2 text-sm font-medium text-gray-400 mb-3 hover:text-gray-200 transition-colors"
              >
                {expandedPreview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Preview Data ({detail.preview_data.length} rows)
              </button>
              {expandedPreview && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        {Object.keys(detail.preview_data[0]).map((col) => (
                          <th key={col} className="text-left px-3 py-2 text-gray-400 font-medium">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.preview_data.map((row, i) => (
                        <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-3 py-2 text-gray-300">{val ?? <span className="text-gray-600 italic">null</span>}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="bg-[#13151C] rounded-xl border border-gray-800 p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2"><Layers size={16} /> Version History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-left">
                    <th className="px-3 py-2 text-gray-400 font-medium">Version</th>
                    <th className="px-3 py-2 text-gray-400 font-medium">Changelog</th>
                    <th className="px-3 py-2 text-gray-400 font-medium">Rows</th>
                    <th className="px-3 py-2 text-gray-400 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {versions?.map((v, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                      <td className="px-3 py-2 font-mono text-[#6366F1]">v{v.version}</td>
                      <td className="px-3 py-2 text-gray-300">{v.changelog || <span className="text-gray-600 italic">—</span>}</td>
                      <td className="px-3 py-2 text-gray-300">{v.row_count?.toLocaleString()}</td>
                      <td className="px-3 py-2 text-gray-400">{formatDate(v.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
