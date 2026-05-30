import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, BrainCircuit, Timer, AlertTriangle, DollarSign, Server } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Table } from "../../components/ui/Table";
import MetricsLineChart from "../../components/charts/MetricsLineChart";
import DonutChart from "../../components/charts/DonutChart";
import { getUsageMetrics } from "../../api/analytics";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const KPI_CARDS = [
  { key: "total_api_calls", label: "Total API Calls", icon: Activity, format: (v) => v?.toLocaleString() ?? "0" },
  { key: "total_tokens", label: "Total Tokens", icon: BrainCircuit, format: (v) => v?.toLocaleString() ?? "0" },
  { key: "avg_latency_ms", label: "Avg Latency (ms)", icon: Timer, format: (v) => v?.toFixed(2) ?? "0" },
  { key: "error_rate", label: "Error Rate (%)", icon: AlertTriangle, format: (v) => (v ?? 0).toFixed(2) },
  { key: "cost_estimate", label: "Cost Estimate ($)", icon: DollarSign, format: (v) => (v ?? 0).toFixed(2) },
  { key: "active_services", label: "Active Services", icon: Server, format: (v) => v?.toLocaleString() ?? "0" },
];

const DONUT_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4"];

const DEFAULT_COSTS = [
  { name: "GPT-4", value: 45.2 },
  { name: "GPT-3.5", value: 28.7 },
  { name: "Claude", value: 18.3 },
  { name: "Embeddings", value: 7.8 },
];

const summaryColumns = [
  { key: "metric", label: "Metric" },
  { key: "value", label: "Value" },
  { key: "change", label: "Change" },
];

const summaryData = [
  { metric: "Daily Active Users", value: "1,234", change: "+12%", id: 1 },
  { metric: "Avg Session Duration", value: "14.2m", change: "-3%", id: 2 },
  { metric: "Total Requests Today", value: "8,901", change: "+8%", id: 3 },
  { metric: "Cache Hit Rate", value: "87%", change: "+5%", id: 4 },
  { metric: "P95 Latency", value: "412ms", change: "-15%", id: 5 },
];

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", "usage"],
    queryFn: getUsageMetrics,
    select: (res) => res.data,
  });

  const metrics = data ?? {};
  const usageOverTime = metrics.usage_over_time ?? [];
  const costsByService = metrics.costs_by_service ?? DEFAULT_COSTS;

  return (
    <div className="space-y-6 bg-[#0A0B0F] min-h-screen">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Usage metrics and cost breakdown</p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {KPI_CARDS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.key} variants={item}>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs text-gray-400 truncate">{kpi.label}</p>
                    <p className="text-lg font-semibold text-white">
                      {isLoading ? (
                        <span className="inline-block w-16 h-5 bg-[#1A1D2E] rounded animate-pulse" />
                      ) : (
                        kpi.format(metrics[kpi.key])
                      )}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Usage Over Time</h3>
            <MetricsLineChart
              data={usageOverTime}
              xKey="date"
              lines={[{ dataKey: "count", name: "Requests", color: "#6366F1" }]}
            />
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Costs by Service</h3>
            <DonutChart data={costsByService} colors={DONUT_COLORS} />
          </Card>
        </div>
      </div>

      <Card>
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Key Metrics Summary</h3>
        <Table columns={summaryColumns} data={summaryData} />
      </Card>
    </div>
  );
}
