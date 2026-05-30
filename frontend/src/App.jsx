import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import Layout from "./components/layout/Layout";
import { useAuthStore } from "./stores/authStore";
import LandingPage from "./landing/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import PlaygroundPage from "./pages/playground/PlaygroundPage";
import RAGPage from "./pages/rag/RAGPage";
import ExperimentsPage from "./pages/experiments/ExperimentsPage";
import MonitorPage from "./pages/monitor/MonitorPage";
import RegistryPage from "./pages/registry/RegistryPage";
import TasksPage from "./pages/tasks/TasksPage";
import DatasetsPage from "./pages/datasets/DatasetsPage";
import EvaluationsPage from "./pages/evaluations/EvaluationsPage";
import AnalyticsPage from "./pages/analytics/AnalyticsPage";
import SettingsPage from "./pages/settings/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/app/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="playground" element={<PlaygroundPage />} />
            <Route path="rag" element={<RAGPage />} />
            <Route path="experiments" element={<ExperimentsPage />} />
            <Route path="monitor" element={<MonitorPage />} />
            <Route path="registry" element={<RegistryPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="datasets" element={<DatasetsPage />} />
            <Route path="evaluations" element={<EvaluationsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
