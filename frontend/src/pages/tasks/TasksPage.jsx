import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, X, Calendar, Clock, User, ListTodo, Circle } from "lucide-react";

const PRIORITIES = [
  { value: "critical", label: "Critical", color: "bg-red-500/10 text-red-400" },
  { value: "high", label: "High", color: "bg-orange-500/10 text-orange-400" },
  { value: "medium", label: "Medium", color: "bg-yellow-500/10 text-yellow-400" },
  { value: "low", label: "Low", color: "bg-gray-500/10 text-gray-400" },
];

const STATUSES = ["backlog", "todo", "in_progress", "in_review", "done"];

const STATUS_LABELS = {
  backlog: "Backlog", todo: "Todo", in_progress: "In Progress",
  in_review: "In Review", done: "Done",
};

const api = {
  listTasks: () => fetch("/api/tasks/").then(r => r.json()),
  createTask: (data) => fetch("/api/tasks/", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
  }).then(r => r.json()),
  updateTask: ({ id, data }) => fetch(`/api/tasks/${id}`, {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
  }).then(r => r.json()),
  batchUpdate: (data) => fetch("/api/tasks/batch/update", {
    method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
  }).then(r => r.json()),
  listUsers: () => fetch("/api/users/").then(r => r.json()),
};

function getPriorityColor(value) {
  const p = PRIORITIES.find(x => x.value === value);
  return p ? p.color : "bg-gray-500/10 text-gray-400";
}

function getInitials(name) {
  if (!name) return "??";
  return name.split(" ").map(s => s[0]).join("").toUpperCase().slice(0, 2);
}

function TaskCard({ task, onEdit }) {
  return (
    <Draggable draggableId={String(task.id)} index={task._index || 0}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onEdit(task)}
          className={`bg-[#1A1D2E] rounded-lg border border-white/5 p-3 space-y-2 cursor-pointer transition-all ${
            snapshot.isDragging ? "border-indigo-500/50 shadow-lg shadow-indigo-500/10 rotate-[2deg]" : "hover:border-white/10"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-white leading-snug">{task.title}</p>
            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {task.assignee && (
              <span className="flex items-center gap-1">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-medium">
                  {getInitials(task.assignee.name)}
                </span>
              </span>
            )}
            {task.due_date && (
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
          {(task.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map(t => (
                <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-500/10 text-slate-400">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

function TaskModal({ task, onClose }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || "medium",
    status: task?.status || "todo",
    assignee_id: task?.assignee_id || "",
    due_date: task?.due_date ? task.due_date.slice(0, 10) : "",
    estimated_hours: task?.estimated_hours || "",
    tags: (task?.tags || []).join(", "),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: api.listUsers,
  });

  const createMutation = useMutation({
    mutationFn: api.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: api.updateTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onClose();
    },
  });

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const handleSubmit = () => {
    const payload = {
      ...form,
      estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
      due_date: form.due_date || null,
      assignee_id: form.assignee_id || null,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
    };
    if (task) {
      updateMutation.mutate({ id: task.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

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
          <h3 className="text-lg font-semibold text-white">{task ? "Edit Task" : "Create Task"}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Title</label>
          <input
            value={form.title} onChange={set("title")}
            className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Description</label>
          <textarea
            value={form.description} onChange={set("description")}
            rows={3}
            className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Priority</label>
            <select
              value={form.priority} onChange={set("priority")}
              className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Status</label>
            <select
              value={form.status} onChange={set("status")}
              className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Assignee</label>
            <select
              value={form.assignee_id} onChange={set("assignee_id")}
              className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Unassigned</option>
              {(users.data || users || []).map(u => (
                <option key={u.id} value={u.id}>{u.name || u.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Due Date</label>
            <input
              type="date"
              value={form.due_date} onChange={set("due_date")}
              className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Est. Hours</label>
            <input
              type="number" min="0" step="0.5"
              value={form.estimated_hours} onChange={set("estimated_hours")}
              className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Tags (comma separated)</label>
          <input
            value={form.tags} onChange={set("tags")}
            className="w-full bg-[#0A0B0F] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors text-sm">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!form.title.trim() || isPending}
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors text-sm disabled:opacity-50"
          >
            {isPending ? "Saving..." : task ? "Update Task" : "Create Task"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function KanbanColumn({ status, tasks, onEditTask }) {
  const columnTasks = tasks
    .filter(t => t.status === status)
    .map((t, i) => ({ ...t, _index: i }));

  return (
    <div className="flex flex-col w-[280px] min-w-[280px] shrink-0">
      <div className="flex items-center justify-between px-3 py-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{STATUS_LABELS[status]}</h3>
        </div>
        <span className="text-xs text-slate-500 bg-[#1A1D2E] px-2 py-0.5 rounded-full">{columnTasks.length}</span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-2 p-2 rounded-xl min-h-[200px] transition-colors ${
              snapshot.isDraggingOver ? "bg-indigo-500/5 border border-dashed border-indigo-500/20" : "bg-[#13151C]/50 border border-transparent"
            }`}
          >
            {columnTasks.map((task, index) => (
              <TaskCard key={task.id} task={{ ...task, _index: index }} onEdit={onEditTask} />
            ))}
            {provided.placeholder}
            {columnTasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Circle size={24} className="text-slate-700 mb-2" />
                <p className="text-xs text-slate-600">No tasks</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState(null);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: api.listTasks,
  });

  const tasks = Array.isArray(tasksData) ? tasksData : (tasksData?.data || []);

  const batchMutation = useMutation({
    mutationFn: api.batchUpdate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;
    if (newStatus === tasks.find(t => String(t.id) === draggableId)?.status) return;
    batchMutation.mutate({ task_ids: [Number(draggableId)], new_status: newStatus });
  };

  const handleEdit = (task) => setEditTask(task);

  const stats = STATUSES.reduce((acc, s) => {
    acc[s] = tasks.filter(t => t.status === s).length;
    return acc;
  }, {});

  return (
    <div className="flex-1 p-6 overflow-hidden bg-[#0A0B0F] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-white">Tasks</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition-colors"
        >
          <Plus size={16} /> Create Task
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {STATUSES.map(s => (
          <div key={s} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#13151C] border border-white/5">
            <span className="text-xs text-slate-400">{STATUS_LABELS[s]}</span>
            <span className="text-sm font-semibold text-white">{stats[s] || 0}</span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <ListTodo size={48} className="text-slate-700 mb-4" />
          <p className="text-slate-400 text-sm mb-4">No tasks yet</p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition-colors"
          >
            <Plus size={16} /> Create your first task
          </button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto flex-1 pb-4">
            {STATUSES.map(s => (
              <KanbanColumn key={s} status={s} tasks={tasks} onEditTask={handleEdit} />
            ))}
          </div>
        </DragDropContext>
      )}

      <AnimatePresence>
        {showCreate && <TaskModal onClose={() => setShowCreate(false)} />}
        {editTask && <TaskModal task={editTask} onClose={() => setEditTask(null)} />}
      </AnimatePresence>
    </div>
  );
}
