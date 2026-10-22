import { Alert, Panel } from "@/components/ui/primitives";

export const metadata = { title: "Privacy" };

const SECTIONS: [string, string[]][] = [
  ["What we store", [
    "Account: email, name, artist name and bio, role, and a password hash (never the password). If you use Google sign-in: your Google account ID and profile picture URL.",
    "Artists: uploaded audio and artwork, the Proof of Effort you submit (including private notes, which only reviewers see), technical analysis results and review decisions.",
    "Buyers: licenses, the project/channel you entered, download and certificate history, and reports you file.",
    "Payments are processed by Stripe. We store Stripe session and payment IDs and the amount — never card details.",
    "An audit log of important actions (uploads, reviews, purchases, downloads) for trust, disputes and security."
  ]],
  ["What is public", [
    "For approved tracks: title, artist name and bio, genre/mood/BPM, artwork, a preview, technical summary and a Proof of Effort summary (no prompts, sample notes or private notes).",
    "Certificate verification pages show the license, track and a masked licensee name — never your email."
  ]],
  ["Cookies", [
    "One session cookie to keep you signed in, and a short-lived cookie during Google sign-in. No advertising or third-party tracking cookies."
  ]],
  ["Retention and your rights", [
    "License and purchase records are kept as long as legally required, because they prove your rights. You can ask for a copy of your data or deletion of everything that is not legally required to keep.",
    "Retention for rejected uploads is still being decided (Open Question Q-010)."
  ]]
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <section>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-echo-muted">Legal</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Privacy</h1>
      </section>
      <Alert>DRAFT — describes what the software actually stores today; pending review by legal counsel (GDPR).</Alert>
      {SECTIONS.map(([title, items]) => (
        <Panel key={title} title={title}>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-neutral-300">
            {items.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </Panel>
      ))}
    </main>
  );
}
