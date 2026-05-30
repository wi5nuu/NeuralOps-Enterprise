import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Database, FileText, Search, Settings as SettingsIcon, Trash2, Upload, BookOpen, Layers, ExternalLink, ChevronRight } from "lucide-react";
import { useToast } from "../../hooks/useToast";
import { listCollections, createCollection, getCollection, updateCollection, deleteCollection, listDocuments, uploadDocument, queryRag } from "../../api/rag";
import { Tabs } from "../../components/ui/Tabs";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Table } from "../../components/ui/Table";
import { Slider } from "../../components/ui/Slider";
import { Spinner } from "../../components/ui/Spinner";
import { FileDropzone } from "../../components/ui/FileDropzone";

const TABS = [
  { key: "collections", label: "Collections" },
  { key: "documents", label: "Documents" },
  { key: "query", label: "Query" },
  { key: "settings", label: "Settings" },
];

const FILE_TYPE_ICONS = {
  pdf: "PDF",
  txt: "TXT",
  md: "MD",
  csv: "CSV",
  json: "JSON",
  docx: "DOCX",
};

function getFileType(filename) {
  const ext = filename?.split(".").pop()?.toLowerCase();
  return FILE_TYPE_ICONS[ext] || ext?.toUpperCase() || "FILE";
}

function getStatusVariant(status) {
  const map = { processed: "success", processing: "warning", failed: "error", pending: "gray" };
  return map[status] || "gray";
}

export default function RAGPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("collections");
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [newCollection, setNewCollection] = useState({ name: "", description: "", chunk_size: 512, chunk_overlap: 64 });
  const [selectedFile, setSelectedFile] = useState(null);
  const [queryText, setQueryText] = useState("");
  const [queryTopK, setQueryTopK] = useState(5);
  const [queryThreshold, setQueryThreshold] = useState(0.7);
  const [queryResults, setQueryResults] = useState(null);
  const [editData, setEditData] = useState({ name: "", description: "", chunk_size: 512, chunk_overlap: 64 });

  const { data: collectionsData, isLoading: collectionsLoading } = useQuery({
    queryKey: ["rag-collections"],
    queryFn: listCollections,
    select: (res) => res.data,
  });

  const collections = collectionsData || [];

  const { data: collectionDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["rag-collection", selectedCollectionId],
    queryFn: () => getCollection(selectedCollectionId),
    enabled: !!selectedCollectionId && (activeTab === "documents" || activeTab === "settings"),
    select: (res) => res.data,
  });

  const { data: documentsData, isLoading: docsLoading } = useQuery({
    queryKey: ["rag-documents", selectedCollectionId],
    queryFn: () => listDocuments(selectedCollectionId),
    enabled: !!selectedCollectionId && activeTab === "documents",
    select: (res) => res.data,
  });

  const documents = documentsData || [];

  const createCollectionMutation = useMutation({
    mutationFn: (data) => createCollection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag-collections"] });
      setShowNewCollection(false);
      setNewCollection({ name: "", description: "", chunk_size: 512, chunk_overlap: 64 });
      toast.success("Collection created");
    },
    onError: () => toast.error("Failed to create collection"),
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: (id) => deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag-collections"] });
      if (selectedCollectionId) setSelectedCollectionId(null);
      toast.success("Collection deleted");
    },
    onError: () => toast.error("Failed to delete collection"),
  });

  const updateCollectionMutation = useMutation({
    mutationFn: ({ id, data }) => updateCollection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag-collections"] });
      queryClient.invalidateQueries({ queryKey: ["rag-collection", selectedCollectionId] });
      toast.success("Collection updated");
    },
    onError: () => toast.error("Failed to update collection"),
  });

  const uploadDocMutation = useMutation({
    mutationFn: (file) => uploadDocument(selectedCollectionId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rag-documents", selectedCollectionId] });
      setShowUpload(false);
      setSelectedFile(null);
      toast.success("Document uploaded");
    },
    onError: () => toast.error("Failed to upload document"),
  });

  const queryMutation = useMutation({
    mutationFn: (data) => queryRag(data),
    onSuccess: (res) => {
      setQueryResults(res.data);
      toast.success("Query completed");
    },
    onError: () => toast.error("Query failed"),
  });

  const handleCreateCollection = () => {
    if (!newCollection.name.trim()) return;
    createCollectionMutation.mutate(newCollection);
  };

  const handleUpdateCollection = () => {
    if (!editData.name.trim() || !selectedCollectionId) return;
    updateCollectionMutation.mutate({ id: selectedCollectionId, data: editData });
  };

  const handleUpload = () => {
    if (!selectedFile || !selectedCollectionId) return;
    uploadDocMutation.mutate(selectedFile);
  };

  const handleQuery = () => {
    if (!queryText.trim()) return;
    queryMutation.mutate({
      collection_id: selectedCollectionId,
      query: queryText.trim(),
      top_k: queryTopK,
      threshold: queryThreshold,
    });
  };

  const handleSelectCollection = (id) => {
    setSelectedCollectionId(id);
    const col = collections.find((c) => c.id === id);
    if (col) {
      setEditData({
        name: col.name || "",
        description: col.description || "",
        chunk_size: col.chunk_size || 512,
        chunk_overlap: col.chunk_overlap || 64,
      });
    }
    setQueryResults(null);
  };

  const docColumns = [
    { key: "filename", label: "Filename", render: (val) => (
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-gray-500" />
        <span className="text-gray-200">{val}</span>
      </div>
    )},
    { key: "type", label: "Type", render: (val) => (
      <Badge variant="gray">{getFileType(val)}</Badge>
    )},
    { key: "size", label: "Size", render: (val) => {
      if (!val) return "-";
      const bytes = parseInt(val);
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }},
    { key: "status", label: "Status", render: (val) => (
      <Badge variant={getStatusVariant(val)}>{val || "unknown"}</Badge>
    )},
    { key: "created_at", label: "Created", render: (val) => val ? new Date(val).toLocaleDateString() : "-" },
  ];

  return (
    <div className="h-screen flex flex-col bg-[#0A0B0F] overflow-hidden">
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-[#13151C] shrink-0">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-indigo-400" />
          <h1 className="text-lg font-semibold text-white">RAG</h1>
          {selectedCollectionId && collections.find((c) => c.id === selectedCollectionId) && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-400">
                {collections.find((c) => c.id === selectedCollectionId)?.name}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "collections" && (
            <Button size="sm" onClick={() => setShowNewCollection(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              New Collection
            </Button>
          )}
          {activeTab === "documents" && selectedCollectionId && (
            <Button size="sm" onClick={() => setShowUpload(true)}>
              <Upload className="w-4 h-4 mr-1.5" />
              Upload Document
            </Button>
          )}
        </div>
      </header>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="px-6 shrink-0" />

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "collections" && (
          <div>
            {collectionsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : collections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Database className="w-16 h-16 text-gray-700 mb-4" />
                <h2 className="text-xl font-semibold text-gray-300 mb-2">No collections yet</h2>
                <p className="text-gray-500 text-sm max-w-md mb-6">
                  Create your first collection to start uploading documents and querying them.
                </p>
                <Button onClick={() => setShowNewCollection(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Collection
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {collections.map((col) => (
                    <motion.div
                      key={col.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card
                        hover
                        onClick={() => handleSelectCollection(col.id)}
                        className={`cursor-pointer ${
                          selectedCollectionId === col.id ? "border-indigo-500/50 ring-1 ring-indigo-500/30" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-400" />
                            <h3 className="font-semibold text-white">{col.name}</h3>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteCollectionMutation.mutate(col.id); }}
                            className="p-1.5 rounded-md hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {col.description && (
                          <p className="text-sm text-gray-400 mb-4 line-clamp-2">{col.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{col.document_count ?? 0} documents</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5" />
                            <span>{col.chunk_count ?? 0} chunks</span>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div>
            {!selectedCollectionId ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText className="w-16 h-16 text-gray-700 mb-4" />
                <h2 className="text-xl font-semibold text-gray-300 mb-2">Select a collection</h2>
                <p className="text-gray-500 text-sm max-w-md">
                  Choose a collection from the Collections tab to view its documents.
                </p>
              </div>
            ) : docsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : (
              <Table
                columns={docColumns}
                data={documents}
                isLoading={false}
              />
            )}
          </div>
        )}

        {activeTab === "query" && (
          <div className="max-w-4xl mx-auto space-y-6">
            {!selectedCollectionId ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="w-16 h-16 text-gray-700 mb-4" />
                <h2 className="text-xl font-semibold text-gray-300 mb-2">Select a collection</h2>
                <p className="text-gray-500 text-sm max-w-md">
                  Choose a collection from the Collections tab to query against.
                </p>
              </div>
            ) : (
              <>
                <Card>
                  <h3 className="text-base font-semibold text-white mb-4">Query</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Query Text</label>
                      <textarea
                        value={queryText}
                        onChange={(e) => setQueryText(e.target.value)}
                        rows={3}
                        placeholder="Enter your query..."
                        className="w-full bg-[#1A1D2E] border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <Slider
                        label={`Top K: ${queryTopK}`}
                        min={1}
                        max={20}
                        step={1}
                        value={queryTopK}
                        onChange={setQueryTopK}
                      />
                      <Slider
                        label={`Threshold: ${queryThreshold.toFixed(2)}`}
                        min={0}
                        max={1}
                        step={0.05}
                        value={queryThreshold}
                        onChange={setQueryThreshold}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleQuery} disabled={!queryText.trim() || queryMutation.isPending}>
                        {queryMutation.isPending ? <Spinner size="sm" /> : <Search className="w-4 h-4 mr-1.5" />}
                        Search
                      </Button>
                    </div>
                  </div>
                </Card>

                {queryMutation.isPending && (
                  <div className="flex items-center justify-center py-12">
                    <Spinner size="lg" />
                  </div>
                )}

                {queryResults && !queryMutation.isPending && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {queryResults.answer && (
                      <Card>
                        <h3 className="text-base font-semibold text-white mb-3">Answer</h3>
                        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{queryResults.answer}</p>
                      </Card>
                    )}

                    {queryResults.sources && queryResults.sources.length > 0 && (
                      <div>
                        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-indigo-400" />
                          Sources ({queryResults.sources.length})
                        </h3>
                        <div className="space-y-3">
                          <AnimatePresence>
                            {queryResults.sources.map((source, i) => (
                              <motion.div
                                key={source.id || i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                              >
                                <Card>
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium text-gray-200">
                                        {source.filename || `Source ${i + 1}`}
                                      </span>
                                    </div>
                                    <Badge variant="indigo">
                                      {(source.score * 100).toFixed(1)}%
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-400 leading-relaxed">{source.content}</p>
                                </Card>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto">
            {!selectedCollectionId ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <SettingsIcon className="w-16 h-16 text-gray-700 mb-4" />
                <h2 className="text-xl font-semibold text-gray-300 mb-2">Select a collection</h2>
                <p className="text-gray-500 text-sm max-w-md">
                  Choose a collection from the Collections tab to edit its settings.
                </p>
              </div>
            ) : detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <Spinner size="lg" />
              </div>
            ) : (
              <Card>
                <h3 className="text-base font-semibold text-white mb-6">Collection Settings</h3>
                <div className="space-y-4">
                  <Input
                    label="Name"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    placeholder="Collection name"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={3}
                      placeholder="Collection description"
                      className="w-full bg-[#1A1D2E] border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <Slider
                    label={`Chunk Size: ${editData.chunk_size}`}
                    min={128}
                    max={2048}
                    step={64}
                    value={editData.chunk_size}
                    onChange={(val) => setEditData({ ...editData, chunk_size: val })}
                  />
                  <Slider
                    label={`Chunk Overlap: ${editData.chunk_overlap}`}
                    min={0}
                    max={512}
                    step={16}
                    value={editData.chunk_overlap}
                    onChange={(val) => setEditData({ ...editData, chunk_overlap: val })}
                  />
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleUpdateCollection} disabled={!editData.name.trim()}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showNewCollection} onClose={() => setShowNewCollection(false)} title="New Collection" size="md">
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="Collection name..."
            value={newCollection.name}
            onChange={(e) => setNewCollection({ ...newCollection, name: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={newCollection.description}
              onChange={(e) => setNewCollection({ ...newCollection, description: e.target.value })}
              rows={3}
              placeholder="Optional description..."
              className="w-full bg-[#1A1D2E] border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <Slider
            label={`Chunk Size: ${newCollection.chunk_size}`}
            min={128}
            max={2048}
            step={64}
            value={newCollection.chunk_size}
            onChange={(val) => setNewCollection({ ...newCollection, chunk_size: val })}
          />
          <Slider
            label={`Chunk Overlap: ${newCollection.chunk_overlap}`}
            min={0}
            max={512}
            step={16}
            value={newCollection.chunk_overlap}
            onChange={(val) => setNewCollection({ ...newCollection, chunk_overlap: val })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowNewCollection(false)}>Cancel</Button>
            <Button onClick={handleCreateCollection} disabled={!newCollection.name.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showUpload} onClose={() => { setShowUpload(false); setSelectedFile(null); }} title="Upload Document" size="md">
        <div className="space-y-4">
          <FileDropzone
            onDrop={(file) => setSelectedFile(file)}
            accept=".pdf,.txt,.md,.csv,.json,.docx"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowUpload(false); setSelectedFile(null); }}>Cancel</Button>
            <Button onClick={handleUpload} disabled={!selectedFile}>
              {uploadDocMutation.isPending ? <Spinner size="sm" /> : <Upload className="w-4 h-4 mr-1.5" />}
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
