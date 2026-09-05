import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, ShieldCheck, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { LogoMark } from "./index";

const DOWNLOAD_URL = "https://ltcme.click/download";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=click.ltcme";

export const Route = createFileRoute("/download")({
  component: DownloadPage,
  head: () => ({
    meta: [
      { title: "Get the LTCme.click Android app" },
      {
        name: "description",
        content: "Get the official LTCme.click self-custody Litecoin wallet for Android.",
      },
      { property: "og:title", content: "Get LTCme.click for Android" },
      { property: "og:url", content: DOWNLOAD_URL },
    ],
    links: [{ rel: "canonical", href: DOWNLOAD_URL }],
  }),
});

function DownloadPage() {
  return (
    <div className="min-h-screen px-6 py-10">
      <main className="mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2">
          <LogoMark size={36} />
          <span className="font-semibold">
            LTCme<span className="text-primary">.click</span>
          </span>
        </Link>

        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <section>
            <span className="eyebrow">Android app</span>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Your Litecoin wallet, ready to go.
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Scan the QR code on your phone or open the Google Play listing. The same stable link
              will keep working after the listing is approved.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href={PLAY_STORE_URL}
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90"
              >
                <Smartphone className="h-4 w-4" />
                Get it on Google Play
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <span className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm text-muted-foreground">
                Signed direct APK coming after release approval
              </span>
            </div>

            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p>
                Only install an APK signed by LTCme.click. The earlier attached test APK is
                debug-signed and is not being offered as a public download.
              </p>
            </div>
          </section>

          <aside className="mx-auto rounded-3xl bg-white p-5 shadow-2xl shadow-primary/10">
            <QRCodeSVG
              value={DOWNLOAD_URL}
              size={240}
              level="H"
              marginSize={1}
              bgColor="#ffffff"
              fgColor="#071323"
              title="Open the LTCme.click Android download page"
            />
          </aside>
        </div>
      </main>
    </div>
  );
}
