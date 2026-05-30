import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import { login as loginApi, register as registerApi, getMe } from "../api/auth";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: loginApi,
    onSuccess: async (res) => {
      const { access_token, refresh_token } = res.data;
      setAuth(null, access_token, refresh_token);
      const me = await getMe();
      setAuth(me.data, access_token, refresh_token);
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: registerApi,
    onSuccess: async (res) => {
      const { access_token, refresh_token } = res.data;
      setAuth(null, access_token, refresh_token);
      const me = await getMe();
      setAuth(me.data, access_token, refresh_token);
    },
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  return () => {
    logout();
    window.location.href = "/login";
  };
}
