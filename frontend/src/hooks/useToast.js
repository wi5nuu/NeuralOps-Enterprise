import { toast } from "react-hot-toast";

export function useToast() {
  return {
    success: (msg) => toast.success(msg, { style: { background: "#13151C", color: "#E2E8F0", border: "1px solid #22C55E" } }),
    error: (msg) => toast.error(msg, { style: { background: "#13151C", color: "#E2E8F0", border: "1px solid #EF4444" } }),
    info: (msg) => toast(msg, { icon: "ℹ️", style: { background: "#13151C", color: "#E2E8F0", border: "1px solid #6366F1" } }),
  };
}
