import { QueryClient } from "@tanstack/react-query";

export function getApiUrl(): string {
  // Render backend URL (sabit – Play Store uyumlu)
  return "https://meetwalk-backed.onrender.com";
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});