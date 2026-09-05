import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, ArrowLeft } from "lucide-react";
import { LogoMark } from "./index";

export const Route = createFileRoute("/download")({
  component: DownloadPage,
});

function DownloadPage() {
  return (
    <main className="min-h-screen px-6 py-12 flex items-center justify-center">
      <div className="card-glass neon-edge rounded-3xl p-10 max-w-lg w-full text-center">
        <div className="flex justify-center"><LogoMark size={60} /></div>
        <h1 className="mt-5 text-3xl font-bold">LTCme for Android</h1>
        <p className="mt-3 text-sm text-muted-foreground">Official Android app download from LTCme.click.</p>
        <a href="/downloads/LTCme.apk" className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-7 py-3 font-medium hover:opacity-90 transition">
          <Download className="h-5 w-5" /> Download LTCme.apk
        </a>
        <div className="mt-7">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to the Journal
          </Link>
        </div>
      </div>
    </main>
  );
}
