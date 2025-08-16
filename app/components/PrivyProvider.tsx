"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethodsAndOrder: {
          primary: ["privy:cmd8euall0037le0my79qpz42"],
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
