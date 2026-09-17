import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, useState } from "react";
export function DataProvider({ children }: PropsWithChildren) { const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } })); return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
