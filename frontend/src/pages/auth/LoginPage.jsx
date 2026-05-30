import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { BrainCircuit, Eye, EyeOff } from "lucide-react"
import { useLogin } from "../../hooks/useAuth"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const { mutate, isLoading, error } = useLogin()
  const [showPassword, setShowPassword] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data) => {
    mutate(data, {
      onSuccess: () => {
        navigate("/app/dashboard")
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0A0B0F" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 rounded-2xl shadow-2xl"
        style={{ backgroundColor: "#13151C" }}
      >
        <div className="flex flex-col items-center mb-8">
          <BrainCircuit className="w-12 h-12 mb-3" style={{ color: "#6366F1" }} />
          <h1 className="text-2xl font-bold text-white">NeuralOps</h1>
          <p className="text-sm mt-1" style={{ color: "#6366F1" }}>Enterprise</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input
              type="email"
              {...register("email")}
              className="w-full px-4 py-2.5 rounded-lg border text-white placeholder-gray-500 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: "#0A0B0F",
                borderColor: errors.email ? "#EF4444" : "#1F2937",
                borderWidth: "1px",
              }}
              placeholder="you@company.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="w-full px-4 py-2.5 rounded-lg border text-white placeholder-gray-500 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: "#0A0B0F",
                  borderColor: errors.password ? "#EF4444" : "#1F2937",
                  borderWidth: "1px",
                }}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm text-red-400" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
              {error?.message || "Login failed. Please try again."}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg font-medium text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#6366F1" }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium hover:underline" style={{ color: "#6366F1" }}>
            Register
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
