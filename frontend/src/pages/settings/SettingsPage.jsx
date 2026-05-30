import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, CheckCircle, Circle } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Table } from "../../components/ui/Table";
import { Tabs } from "../../components/ui/Tabs";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { useAuthStore } from "../../stores/authStore";
import { useToast } from "../../hooks/useToast";
import { updateMe, listUsers, updateUser, getOrganization, updateOrganization } from "../../api/auth";
import api from "../../api/axios";

const SETTINGS_TABS = [
  { key: "profile", label: "Profile" },
  { key: "organization", label: "Organization" },
  { key: "api-keys", label: "API Keys" },
  { key: "team", label: "Team" },
  { key: "notifications", label: "Notifications" },
];

const PROVIDERS = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "google", label: "Google" },
  { value: "azure", label: "Azure" },
  { value: "custom", label: "Custom" },
];

const PLANS = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

const SEED_API_KEYS = [
  { id: 1, name: "Production", provider: "openai", masked_key: "sk-****1a2b", created_at: "2025-01-15T10:00:00Z" },
  { id: 2, name: "Development", provider: "anthropic", masked_key: "sk-ant-****3c4d", created_at: "2025-02-20T14:30:00Z" },
  { id: 3, name: "Staging", provider: "google", masked_key: "AIza****5e6f", created_at: "2025-03-10T08:15:00Z" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const queryClient = useQueryClient();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");

  const [orgName, setOrgName] = useState("");
  const [orgPlan, setOrgPlan] = useState("free");
  const [orgActive, setOrgActive] = useState(true);

  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyProvider, setNewKeyProvider] = useState("openai");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [apiKeys, setApiKeys] = useState(SEED_API_KEYS);

  useEffect(() => {
    if (user) {
      setProfileName(user.name ?? "");
      setProfileEmail(user.email ?? "");
    }
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: (res) => {
      setUser(res.data);
      toast.success("Profile updated");
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const { data: orgData } = useQuery({
    queryKey: ["organization"],
    queryFn: getOrganization,
    select: (res) => res.data,
  });

  useEffect(() => {
    if (orgData) {
      setOrgName(orgData.name ?? "");
      setOrgPlan(orgData.plan ?? "free");
      setOrgActive(orgData.is_active ?? true);
    }
  }, [orgData]);

  const orgMutation = useMutation({
    mutationFn: updateOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast.success("Organization updated");
    },
    onError: () => toast.error("Failed to update organization"),
  });

  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
    select: (res) => res.data,
  });

  const teamMutation = useMutation({
    mutationFn: ({ id, data }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated");
    },
    onError: () => toast.error("Failed to update user"),
  });

  const { data: notifData, isLoading: notifLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get("/api/notifications/"),
    select: (res) => res.data,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.put("/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  const handleSaveProfile = (e) => {
    e.preventDefault();
    profileMutation.mutate({ name: profileName, email: profileEmail });
  };

  const handleSaveOrg = (e) => {
    e.preventDefault();
    orgMutation.mutate({ name: orgName, plan: orgPlan, is_active: orgActive });
  };

  const handleAddKey = () => {
    const key = {
      id: Date.now(),
      name: newKeyName,
      provider: newKeyProvider,
      masked_key: `sk-****${newKeyValue.slice(-4)}`,
      created_at: new Date().toISOString(),
    };
    setApiKeys((prev) => [...prev, key]);
    setShowAddKey(false);
    setNewKeyName("");
    setNewKeyValue("");
    setNewKeyProvider("openai");
    toast.success("API key added");
  };

  const handleToggleActive = (targetUser) => {
    teamMutation.mutate({
      id: targetUser.id,
      data: { is_active: !targetUser.is_active },
    });
  };

  const handleRoleChange = (targetUser, newRole) => {
    teamMutation.mutate({
      id: targetUser.id,
      data: { role: newRole },
    });
  };

  const notifications = Array.isArray(notifData) ? notifData : [];

  const apiKeyColumns = [
    { key: "name", label: "Name" },
    {
      key: "provider",
      label: "Provider",
      render: (val) => (
        <Badge variant={
          val === "openai" ? "success" :
          val === "anthropic" ? "indigo" :
          val === "google" ? "info" : "gray"
        }>
          {val}
        </Badge>
      ),
    },
    { key: "masked_key", label: "Key" },
    { key: "created_at", label: "Created", render: (val) => val ? new Date(val).toLocaleDateString() : "-" },
  ];

  const teamColumns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      sortable: false,
      render: (val, row) => (
        <select
          value={val}
          onChange={(e) => handleRoleChange(row, e.target.value)}
          className="bg-[#1A1D2E] border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ),
    },
    {
      key: "is_active",
      label: "Active",
      sortable: false,
      render: (val, row) => (
        <button
          type="button"
          onClick={() => handleToggleActive(row)}
          className={`w-8 h-5 rounded-full transition-colors relative ${val ? "bg-indigo-500" : "bg-gray-600"}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${val ? "translate-x-3" : "translate-x-0"}`} />
        </button>
      ),
    },
    { key: "created_at", label: "Joined", render: (val) => val ? new Date(val).toLocaleDateString() : "-" },
  ];

  const notifColumns = [
    {
      key: "read",
      label: "",
      sortable: false,
      render: (val) => val
        ? <CheckCircle className="w-4 h-4 text-indigo-400" />
        : <Circle className="w-4 h-4 text-gray-500" />,
    },
    { key: "title", label: "Title", render: (val, row) => (
      <span className={row.read ? "text-gray-400" : "text-white font-medium"}>{val}</span>
    )},
    { key: "message", label: "Message", render: (val) => (
      <span className="text-gray-400 text-xs">{val}</span>
    )},
    {
      key: "type",
      label: "Type",
      render: (val) => (
        <Badge variant={
          val === "error" ? "error" :
          val === "warning" ? "warning" :
          val === "success" ? "success" : "info"
        }>
          {val ?? "info"}
        </Badge>
      ),
    },
    { key: "created_at", label: "Date", render: (val) => val ? new Date(val).toLocaleDateString() : "-" },
  ];

  return (
    <div className="space-y-6 bg-[#0A0B0F] min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account and organization</p>
      </div>

      <Tabs tabs={SETTINGS_TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "profile" && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveProfile}
          className="max-w-xl space-y-4"
        >
          <Card>
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Profile Information</h3>
            <div className="space-y-4">
              <Input label="Name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
              <Input label="Email" type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Card>
        </motion.form>
      )}

      {activeTab === "organization" && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSaveOrg}
          className="max-w-xl space-y-4"
        >
          <Card>
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Organization Settings</h3>
            <div className="space-y-4">
              <Input label="Organization Name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
              <Select label="Plan" options={PLANS} value={orgPlan} onChange={(e) => setOrgPlan(e.target.value)} />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOrgActive(!orgActive)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${orgActive ? "bg-indigo-500" : "bg-gray-600"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${orgActive ? "translate-x-4" : "translate-x-0"}`} />
                </button>
                <span className="text-sm text-gray-300">Active</span>
              </div>
              <Button type="submit" disabled={orgMutation.isPending}>
                {orgMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </Card>
        </motion.form>
      )}

      {activeTab === "api-keys" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex justify-end">
            <Button onClick={() => setShowAddKey(true)} className="flex items-center">
              <Plus className="w-4 h-4 mr-1.5" /> Add Key
            </Button>
          </div>
          <Card>
            <h3 className="text-sm font-semibold text-gray-300 mb-4">API Keys</h3>
            <Table columns={apiKeyColumns} data={apiKeys} />
          </Card>

          <Modal isOpen={showAddKey} onClose={() => setShowAddKey(false)} title="Add API Key">
            <div className="space-y-4">
              <Input label="Key Name" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production" />
              <Select label="Provider" options={PROVIDERS} value={newKeyProvider} onChange={(e) => setNewKeyProvider(e.target.value)} />
              <Input label="API Key" type="text" value={newKeyValue} onChange={(e) => setNewKeyValue(e.target.value)} placeholder="sk-..." />
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowAddKey(false)}>Cancel</Button>
                <Button onClick={handleAddKey} disabled={!newKeyName || !newKeyValue}>Add Key</Button>
              </div>
            </div>
          </Modal>
        </motion.div>
      )}

      {activeTab === "team" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card>
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Team Members</h3>
            <Table columns={teamColumns} data={Array.isArray(teamData) ? teamData : []} isLoading={teamLoading} />
          </Card>
        </motion.div>
      )}

      {activeTab === "notifications" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              Mark All Read
            </Button>
          </div>
          <Card>
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Notifications</h3>
            <Table columns={notifColumns} data={notifications} isLoading={notifLoading} />
          </Card>
        </motion.div>
      )}
    </div>
  );
}
