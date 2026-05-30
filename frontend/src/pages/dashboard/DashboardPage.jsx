import React from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Users,
  FolderKanban,
  Beaker,
  Activity,
  Database,
  BrainCircuit,
  PlusCircle,
  FlaskConical,
  Upload,
  Play,
} from "lucide-react"
import { Card } from "../../components/ui/Card"
import MetricsLineChart from "../../components/charts/MetricsLineChart"
import BarChart from "../../components/charts/BarChart"
import DonutChart from "../../components/charts/DonutChart"
import api from "../../api/axios"

const kpiConfig = [
  { key: "total_users", label: "Total Users", icon: Users },
  { key: "total_projects", label: "Projects", icon: FolderKanban },
  { key: "total_experiments", label: "Experiments", icon: Beaker },
  { key: "total_services", label: "Services", icon: Activity },
  { key: "total_datasets", label: "Datasets", icon: Database },
  { key: "total_evaluations", label: "Evaluations", icon: BrainCircuit },
]

const quickActions = [
  { label: "New Project", icon: PlusCircle },
  { label: "New Experiment", icon: FlaskConical },
  { label: "Upload Document", icon: Upload },
  { label: "Run Evaluation", icon: Play },
]

function KpiSkeleton() {
  return (
    <div className="animate-pulse p-5 rounded-xl" style={{ backgroundColor: "#13151C" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-16 rounded" style={{ backgroundColor: "#1F2937" }} />
        <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: "#1F2937" }} />
      </div>
      <div className="h-8 w-20 rounded mb-1" style={{ backgroundColor: "#1F2937" }} />
      <div className="h-3 w-24 rounded" style={{ backgroundColor: "#1F2937" }} />
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="animate-pulse p-5 rounded-xl" style={{ backgroundColor: "#13151C" }}>
      <div className="h-4 w-32 rounded mb-4" style={{ backgroundColor: "#1F2937" }} />
      <div className="h-48 rounded" style={{ backgroundColor: "#1F2937" }} />
    </div>
  )
}

export default function DashboardPage() {
  console.log("DashboardPage rendering");
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await api.get("/api/analytics/dashboard")
      return res.data
    },
  })

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0B0F" }}>
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">Failed to load dashboard</p>
          <p className="text-gray-400 text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "#0A0B0F" }}>
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-6">
        <motion.div variants={item}>
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-gray-400 text-sm">Overview of your NeuralOps platform</p>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)
            : kpiConfig.map((kpi) => {
                const Icon = kpi.icon
                return (
                  <Card key={kpi.key} className="p-5" style={{ backgroundColor: "#13151C" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#6366F1" }}>
                        {kpi.label}
                      </span>
                      <Icon className="w-5 h-5" style={{ color: "#6366F1" }} />
                    </div>
                    <p className="text-3xl font-bold text-white">{data?.stats?.[kpi.key] ?? 0}</p>
                  </Card>
                )
              })}
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {isLoading ? (
            <>
              <ChartSkeleton />
              <ChartSkeleton />
            </>
          ) : (
            <>
              <Card className="p-5" style={{ backgroundColor: "#13151C" }}>
                <h3 className="text-sm font-medium text-gray-300 mb-4">Model Performance</h3>
                <MetricsLineChart data={data?.model_performance || []} />
              </Card>
              <Card className="p-5" style={{ backgroundColor: "#13151C" }}>
                <h3 className="text-sm font-medium text-gray-300 mb-4">Dataset Growth</h3>
                <BarChart data={data?.dataset_growth || []} />
              </Card>
            </>
          )}
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-5 lg:col-span-1" style={{ backgroundColor: "#13151C" }}>
            <h3 className="text-sm font-medium text-gray-300 mb-4">Model Distribution</h3>
            {isLoading ? (
              <div className="h-48 animate-pulse rounded" style={{ backgroundColor: "#1F2937" }} />
            ) : (
              <DonutChart data={data?.model_pie ?? []} />
            )}
          </Card>

          <Card className="p-5 lg:col-span-1" style={{ backgroundColor: "#13151C" }}>
            <h3 className="text-sm font-medium text-gray-300 mb-4">Service Health</h3>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded" style={{ backgroundColor: "#1F2937" }} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.service_health ?? []).map((service, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-300">{service.name}</span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        service.is_healthy
                          ? "text-green-400 bg-green-400/10"
                          : "text-red-400 bg-red-400/10"
                      }`}
                    >
                      {service.is_healthy ? "Healthy" : "Unhealthy"}
                    </span>
                  </div>
                ))}
                {(data?.service_health ?? []).length === 0 && (
                  <p className="text-gray-500 text-sm">No services monitored</p>
                )}
              </div>
            )}
          </Card>

          <Card className="p-5 lg:col-span-1" style={{ backgroundColor: "#13151C" }}>
            <h3 className="text-sm font-medium text-gray-300 mb-4">Recent Activity</h3>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded" style={{ backgroundColor: "#1F2937" }} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.recent_activity ?? []).map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-800 last:border-0">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: "#6366F1" }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-200 truncate">{activity.type}</p>
                      <p className="text-xs text-gray-500">{activity.created_at}</p>
                    </div>
                  </div>
                ))}

                {(data?.recent_activity ?? []).length === 0 && (
                  <p className="text-gray-500 text-sm">No recent activity</p>
                )}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <h3 className="text-sm font-medium text-gray-300 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                  <button
                  key={action.label}
                  className="flex flex-row items-center justify-start gap-2 py-3 px-4 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90 whitespace-nowrap"
                  style={{ backgroundColor: "#13151C" }}
                >
                  <Icon className="w-4 h-4 shrink-0" style={{ color: "#6366F1" }} />
                  {action.label}
                </button>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
