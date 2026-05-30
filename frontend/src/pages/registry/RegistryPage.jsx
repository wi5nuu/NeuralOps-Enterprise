import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Trash2, Copy, X, Package, FileText, Tag } from "lucide-react";

const PROVIDERS = [
  { value: "anthropic", label: "Anthropic" },
  { value: "openai", label: "OpenAI" },
  { value: "azure", label: "Azure" },
];

const api = {
  listModels: () => fetch("/api/registry/models").then(r => r.json()),
  registerModel: (data) => fetch("/api/registry/models", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
  }).then(r => r.json()),
  deleteModel: (id) => fetch(`/api/registry/models/${id}`, { method: "DELETE" }).then(r => r.json()),
  listPrompts: () => fetch("/api/playground/prompts").then(r => r.json()),
};

function ModelRegisterModal({ onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "", provider: "anthropic", model_id: "", version: "1.0",
    use_case: "", tags: "", notes: "", parameters: "{}",
  });

  const mutation = useMutation({
    mutationFn: api.registerModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registry-models"] });
      onClose();
    },
  });

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-[#13151C] rounded-2xl border border-white/10 p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Register Model</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        {[
          { key: "name", label: "Name", type: "text" },
          { key: "provider", label: "Provider", type: "select", options: PROVIDERS },
          { key: "model_id", label: "Model ID", type: "text" },
          { key: "version", label: "Version", type: "text" },
          { key: "use_case", label: "Use Case", type: "text" },
          { key: "tags", label: "Tags (comma separated)", type: "text" },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-sm text-slate-400 mb-1">{f.label}</label>
            {f.type === "select" ? (
              <select
                value={form[f.key]} onChange={set(f.key)}
                className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : (
              <input
                value={form[f.key]} onChange={set(f.key)}
                className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>
        ))}
        <div>
          <label className="block text-sm text-slate-400 mb-1">Notes</label>
          <textarea
            value={form.notes} onChange={set("notes")}
            rows={3}
            className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Parameters (JSON)</label>
          <textarea
            value={form.parameters} onChange={set("parameters")}
            rows={4}
            className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm">Cancel</button>
          <button
            onClick={() => mutation.mutate({ ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean) })}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors text-sm disabled:opacity-50"
          >
            {mutation.isPending ? "Registering..." : "Register"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ConfirmDeleteModal({ onClose, onConfirm, name }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-[#13151C] rounded-2xl border border-white/10 p-6 w-full max-w-sm space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-white">Delete Model</h3>
        <p className="text-sm text-slate-400">Are you sure you want to delete <span className="text-white font-medium">{name}</span>?</p>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors text-sm">Delete</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ModelsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["registry-models"],
    queryFn: api.listModels,
  });
  const models = Array.isArray(data) ? data : [];

  const deleteMutation = useMutation({
    mutationFn: api.deleteModel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registry-models"] });
      setDeleteTarget(null);
    },
  });

  const filtered = models.filter(m =>
    [m.name, m.provider, m.model_id, m.use_case, m.tags?.join(" ")]
      .filter(Boolean).some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const cols = ["name", "provider", "model_id", "version", "use_case", "tags", "created_at"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search models..."
            className="w-full bg-[#13151C] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <button
          onClick={() => setShowRegister(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition-colors"
        >
          <Plus size={16} /> Register Model
        </button>
      </div>

      <div className="bg-[#13151C] rounded-xl border border-white/5 overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package size={40} className="text-slate-600 mb-3" />
            <p className="text-slate-400 text-sm">No models found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {cols.map(c => (
                  <th key={c} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {c.replace("_", " ")}
                  </th>
                ))}
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <motion.tr
                  key={m.id} layout
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3 text-white font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-slate-300">{m.provider}</td>
                  <td className="px-4 py-3"><code className="text-xs text-slate-400 bg-[#0A0B0F] px-1.5 py-0.5 rounded">{m.model_id}</code></td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/10 text-indigo-400">{m.version}</span></td>
                  <td className="px-4 py-3 text-slate-300">{m.use_case || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(m.tags || []).slice(0, 3).map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-500/10 text-slate-400">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(m.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDeleteTarget(m)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {showRegister && <ModelRegisterModal onClose={() => setShowRegister(false)} />}
        {deleteTarget && (
          <ConfirmDeleteModal
            name={deleteTarget.name}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PromptsTab() {
  const [search, setSearch] = useState("");

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ["prompts"],
    queryFn: api.listPrompts,
  });

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const filtered = prompts.filter(p =>
    [p.name, p.content, p.model_id, p.tags?.join(" ")]
      .filter(Boolean).some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search prompts..."
          className="w-full bg-[#13151C] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText size={40} className="text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">No prompts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <motion.div
              key={p.id} layout
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-[#13151C] rounded-xl border border-white/5 p-4 space-y-3 hover:border-indigo-500/20 transition-colors group"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-white truncate">{p.name}</h4>
                <button
                  onClick={() => copyToClipboard(p.content)}
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 transition-all"
                >
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{p.content}</p>
              <div className="flex items-center justify-between text-xs">
                <code className="text-slate-500 bg-[#0A0B0F] px-1.5 py-0.5 rounded">{p.model_id}</code>
                {p.temperature != null && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                    T: {p.temperature}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {(p.tags || []).slice(0, 3).map(t => (
                    <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-500/10 text-slate-400 flex items-center gap-0.5">
                      <Tag size={10} />{t}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-slate-600">v{p.version || "1.0"}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RegistryPage() {
  console.log("RegistryPage rendering");
  const [activeTab, setActiveTab] = useState("models");

  const tabs = [
    { key: "models", label: "Models", icon: Package },
    { key: "prompts", label: "Prompts", icon: FileText },
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto bg-[#0A0B0F]">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "models" ? <ModelsTab /> : <PromptsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
