import React, { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Trash2, Send, Copy, Settings, MessageSquare, ChevronLeft, ChevronRight, User, Bot, X } from "lucide-react";
import { useStreaming } from "../../hooks/useStreaming";
import { useDebounce } from "../../hooks/useDebounce";
import { useToast } from "../../hooks/useToast";
import { listConversations, createConversation, getConversation, deleteConversation, sendMessage, getStreamUrl } from "../../api/playground";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Slider } from "../../components/ui/Slider";
import { Spinner } from "../../components/ui/Spinner";

const MODELS = [
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { value: "claude-2", label: "Claude 2" },
  { value: "claude-instant", label: "Claude Instant" },
];

export default function PlaygroundPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeConvId, setActiveConvId] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [selectedModel, setSelectedModel] = useState(MODELS[0].value);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showNewConv, setShowNewConv] = useState(false);
  const [newConvTitle, setNewConvTitle] = useState("");
  const [newConvModel, setNewConvModel] = useState(MODELS[0].value);
  const [showLeftPanel, setShowLeftPanel] = useState(true);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: conversationsData, isLoading: convsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
    select: (res) => res.data,
  });

  const conversations = conversationsData || [];
  const filteredConvs = conversations.filter((c) =>
    c.title?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const { data: activeConv, isLoading: convLoading } = useQuery({
    queryKey: ["conversation", activeConvId],
    queryFn: () => getConversation(activeConvId),
    enabled: !!activeConvId,
    select: (res) => res.data,
  });

  const createConvMutation = useMutation({
    mutationFn: (data) => createConversation(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setActiveConvId(res.data.id);
      setShowNewConv(false);
      setNewConvTitle("");
      toast.success("Conversation created");
    },
    onError: () => toast.error("Failed to create conversation"),
  });

  const deleteConvMutation = useMutation({
    mutationFn: (id) => deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (activeConvId) setActiveConvId(null);
      toast.success("Conversation deleted");
    },
    onError: () => toast.error("Failed to delete conversation"),
  });

  const sendMsgMutation = useMutation({
    mutationFn: (data) => sendMessage(activeConvId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation", activeConvId] });
    },
    onError: () => toast.error("Failed to send message"),
  });

  const { streamingContent, isStreaming, startStream, stopStream } = useStreaming();

  const handleSend = useCallback(() => {
    if (!messageInput.trim() || !activeConvId) return;
    const content = messageInput.trim();
    setMessageInput("");
    sendMsgMutation.mutate({
      content,
      model: selectedModel,
      temperature,
      max_tokens: maxTokens,
    });
    startStream(getStreamUrl(activeConvId, content));
  }, [messageInput, activeConvId, sendMsgMutation, startStream, selectedModel, temperature, maxTokens]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateConv = () => {
    if (!newConvTitle.trim()) return;
    createConvMutation.mutate({ title: newConvTitle.trim(), model_id: newConvModel });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const countTokens = (text) => Math.ceil((text?.length || 0) / 4);

  const allMessages = activeConv?.messages || [];
  const displayMessages = streamingContent
    ? [...allMessages, { id: "streaming", role: "assistant", content: streamingContent }]
    : allMessages;

  return (
    <div className="flex bg-[#0A0B0F] h-[calc(100vh-theme(spacing.16)-theme(spacing.16))] lg:h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {showLeftPanel && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className={`fixed lg:relative z-40 h-full border-r border-gray-800 flex flex-col bg-[#13151C] ${showLeftPanel ? 'block' : 'hidden'}`}
          >
            <div className="p-4 space-y-4 border-b border-gray-800">
              <Button onClick={() => setShowNewConv(true)} className="w-full flex items-center justify-center gap-2" size="sm">
                <Plus className="w-4 h-4" />
                New Conversation
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1A1D2E] border border-gray-700 rounded-lg pl-10 pr-3 py-2 text-sm text-gray-200"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pt-4 space-y-1">
              {convsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner />
                </div>
              ) : filteredConvs.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-8">No convs</p>
              ) : (
                filteredConvs.map((conv) => (
                  <motion.div
                    key={conv.id}
                    layout
                    className={`group relative flex items-start gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      activeConvId === conv.id
                        ? "bg-indigo-500/10 border border-indigo-500/30"
                        : "hover:bg-[#1A1D2E] border border-transparent"
                    }`}
                    onClick={() => { setActiveConvId(conv.id); if (window.innerWidth < 1024) setShowLeftPanel(false); }}
                  >
                    <MessageSquare className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{conv.title || "Untitled"}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <button
        onClick={() => setShowLeftPanel(!showLeftPanel)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#13151C] border border-gray-800 rounded-r-lg p-1.5 text-gray-400 hover:text-white transition-colors"
      >
        {showLeftPanel ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-[#13151C]">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-white">Playground</h1>
            {activeConv && (
              <span className="text-sm text-gray-400">/ {activeConv.title || "Untitled"}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-[#1A1D2E] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowSettings(true)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings ? "bg-indigo-500/20 text-indigo-400" : "text-gray-400 hover:text-white hover:bg-[#1A1D2E]"
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {!activeConvId ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-16 h-16 text-gray-700 mb-4" />
              <h2 className="text-xl font-semibold text-gray-300 mb-2">Select a conversation</h2>
              <p className="text-gray-500 text-sm max-w-md">
                Choose a conversation from the left panel or create a new one to start chatting.
              </p>
              <Button onClick={() => setShowNewConv(true)} className="mt-6">
                <Plus className="w-4 h-4 mr-2" />
                Create Conversation
              </Button>
            </div>
          ) : convLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner size="lg" />
            </div>
          ) : displayMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-16 h-16 text-gray-700 mb-4" />
              <h2 className="text-xl font-semibold text-gray-300 mb-2">Start a conversation</h2>
              <p className="text-gray-500 text-sm max-w-md">
                Type a message below to begin chatting with the AI.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {displayMessages.map((msg) => (
                <motion.div
                  key={msg.id || msg.timestamp || Math.random()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-indigo-500/20 border border-indigo-500/30 text-gray-100"
                        : "bg-[#1A1D2E] border border-gray-700/50 text-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {msg.role === "user" ? (
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                      ) : (
                        <Bot className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {msg.role === "user" ? "You" : "Assistant"}
                      </span>
                      {msg.id !== "streaming" && (
                        <button
                          onClick={() => copyToClipboard(msg.content)}
                          className="ml-auto p-1 rounded hover:bg-[#0A0B0F] text-gray-500 hover:text-gray-300 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {msg.content}
                      {msg.id === "streaming" && isStreaming && (
                        <span className="inline-block w-2 h-4 bg-indigo-400 ml-1 animate-pulse" />
                      )}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="border-t border-gray-800 bg-[#13151C] px-4 py-4">
          {activeConvId && (
            <div className="flex items-start gap-3">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Shift+Enter for new line)"
                rows={2}
                className="flex-1 bg-[#1A1D2E] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <div className="flex flex-col items-center gap-2">
                <Button onClick={handleSend} disabled={!messageInput.trim() || isStreaming} size="md" className="rounded-xl">
                  {isStreaming ? (
                    <button onClick={stopStream} className="flex items-center gap-1.5 text-white">
                      <X className="w-4 h-4" />
                      Stop
                    </button>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
                <span className="text-xs text-gray-500">{countTokens(messageInput)} tokens</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Playground Settings" size="lg">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={6}
              placeholder="Enter a system prompt to set the behavior of the assistant..."
              className="w-full bg-[#1A1D2E] border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="space-y-4">
            <Slider
              label={`Temperature: ${temperature.toFixed(1)}`}
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={setTemperature}
            />
            <Slider
              label={`Max Tokens: ${maxTokens}`}
              min={64}
              max={4096}
              step={64}
              value={maxTokens}
              onChange={setMaxTokens}
            />
          </div>
        </div>
      </Modal>

      <Modal isOpen={showNewConv} onClose={() => setShowNewConv(false)} title="New Conversation" size="md">
        <div className="space-y-4">
          <Input
            label="Title"
            placeholder="Conversation title..."
            value={newConvTitle}
            onChange={(e) => setNewConvTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateConv()}
          />
          <Select
            label="Model"
            options={MODELS}
            value={newConvModel}
            onChange={(e) => setNewConvModel(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowNewConv(false)}>Cancel</Button>
            <Button onClick={handleCreateConv} disabled={!newConvTitle.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
