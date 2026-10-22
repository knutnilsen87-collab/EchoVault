import type { Metadata } from "next";
import { PlayerProvider } from "@/components/catalog/player";
import { SiteFooter } from "@/components/ui/site-footer";
import { SiteHeader } from "@/components/ui/site-header";
import { currentUser } from "@/lib/session";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "EchoVault — curated AI/hybrid music licensing", template: "%s · EchoVault" },
  description: "License curated AI/hybrid music with documented provenance, technical QA and a license certificate."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body className="min-h-screen bg-echo-dark font-sans text-white antialiased">
        <PlayerProvider>
          <SiteHeader user={user} />
          <div className="pb-24">
            {children}
            <SiteFooter />
          </div>
        </PlayerProvider>
      </body>
    </html>
  );
}
