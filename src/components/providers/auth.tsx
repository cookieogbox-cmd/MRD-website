import { ClerkProvider } from "@clerk/clerk-react";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const proxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={publishableKey ?? ""} proxyUrl={proxyUrl}>
      {children}
    </ClerkProvider>
  );
}
