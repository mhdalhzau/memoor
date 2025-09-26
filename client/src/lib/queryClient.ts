import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    let errorMessage = res.statusText;
    
    try {
      if (contentType && contentType.includes('application/json')) {
        const jsonError = await res.json();
        errorMessage = jsonError.message || jsonError.error || res.statusText;
      } else {
        const textError = await res.text();
        // Check if we got HTML instead of JSON (common server error)
        if (textError.includes('<!DOCTYPE') || textError.includes('<html')) {
          errorMessage = `Server error (${res.status}): Received HTML instead of JSON. This usually indicates a server-side error.`;
        } else {
          errorMessage = textError || res.statusText;
        }
      }
    } catch (parseError) {
      // If we can't parse the error response, use the status text
      errorMessage = `Server error (${res.status}): ${res.statusText}`;
    }
    
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const [baseUrl, params] = queryKey;
    let url = baseUrl as string;
    
    // If second element is an object, convert it to query parameters
    if (params && typeof params === 'object' && !Array.isArray(params)) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    // Ensure we're getting JSON response
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        throw new Error('Server returned HTML instead of JSON. This indicates a server-side error.');
      }
      return text; // Return as text if not JSON
    }
    
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
