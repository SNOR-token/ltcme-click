import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle } from "lucide-react";

export const Route = createFileRoute("/support/thank-you")({
  component: ThankYouPage,
  head: () => ({
    meta: [
      { title: "Thank You - LTCme.click" },
      { name: "description", content: "Thank you for contacting LTCme.click support." },
      { property: "og:title", content: "Thank You - LTCme.click" },
      { property: "og:description", content: "Thank you for contacting LTCme.click support." },
    ],
  }),
});

function ThankYouPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10" style={{
        backgroundImage: `
          radial-gradient(closest-side, oklch(0.90 0.20 100 / 0.28), transparent 100%),
          radial-gradient(closest-side, oklch(0.72 0.28 350 / 0.30), transparent 100%),
          radial-gradient(closest-side, oklch(0.65 0.24 330 / 0.24), transparent 100%)
        `,
        backgroundRepeat: "no-repeat, no-repeat, no-repeat",
        backgroundSize: "42vw 42vw, 38vw 38vw, 34vw 34vw",
        backgroundPosition: "6% 8%, 92% 18%, 72% 78%",
        opacity: 0.9,
        pointerEvents: "none",
      }} />
      
      <div className="relative z-10 max-w-md text-center card-glass rounded-3xl p-12 md:p-16 neon-edge">
        <div className="h-20 w-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/30">
          <CheckCircle className="h-10 w-10 text-emerald-500" />
        </div>
        
        <h1 className="mt-6 text-2xl md:text-3xl font-bold text-neon-gradient">
          Thank You for Contacting Us!
        </h1>
        
        <p className="mt-4 text-muted-foreground">
          Your message has been successfully sent to our support team.
        </p>
        
        <p className="mt-2 text-sm text-muted-foreground">
          We typically respond within <span className="text-primary font-medium">24-48 hours</span>.
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 btn-glow"
          >
            Return Home
          </Link>
          
          <Link
            to="/support"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/50 px-6 py-3 text-sm font-medium text-foreground hover:bg-card/80 transition"
          >
            Back to Support
          </Link>
        </div>
        
        <p className="mt-8 text-[10px] text-muted-foreground/60">
          In the meantime, check our <Link to="/support" className="text-primary hover:underline">FAQ</Link> 
          for answers to common questions.
        </p>
      </div>
    </div>
  );
}
