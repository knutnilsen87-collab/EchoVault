import { SubNav } from "@/components/ui/sub-nav";

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SubNav
        label="Artist"
        items={[
          { href: "/artist", label: "Tracks", exact: true },
          { href: "/artist/tracks/new", label: "Upload track" },
          { href: "/artist/earnings", label: "Earnings" },
          { href: "/settings", label: "Profile & settings" }
        ]}
      />
      {children}
    </>
  );
}
