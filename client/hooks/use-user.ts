import { useQuery } from "@tanstack/react-query";
import { ApiError, User, api } from "../lib/api";
export function useUser() {
  return useQuery<User | null>({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await api<User>("/auth/me");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    retry: false,
  });
}
