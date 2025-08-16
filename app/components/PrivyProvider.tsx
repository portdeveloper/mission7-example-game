"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethodsAndOrder: {
          // Don't forget to enable Monad Games ID support in:
          // Global Wallet > Integrations > Monad Games ID (click on the slide to enable)
          primary: ["privy:cmd8euall0037le0my79qpz42"],
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
