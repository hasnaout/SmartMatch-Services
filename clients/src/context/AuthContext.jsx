import useAuthStore from "../store/useAuthStore";

export function useAuth() {
  const { user, token, isLoading, setAuth, logout } = useAuthStore();

  return {
    user,
    token,
    loading: isLoading,
    logout,
    login: ({ user: nextUser, token: nextToken }) => setAuth({ user: nextUser, token: nextToken }),
    register: ({ user: nextUser, token: nextToken }) => setAuth({ user: nextUser, token: nextToken }),
  };
}
