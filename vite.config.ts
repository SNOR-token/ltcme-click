import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const SUPABASE_PROJECT_REF = "sddeayzumvkdmdgqetyz";

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const supabaseUrl = env.VITE_SUPABASE_URL?.trim();
  const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. " +
        "Configure the LTCme production Supabase browser values before building.",
    );
  }

  let supabaseHost: string;
  try {
    const parsed = new URL(supabaseUrl);
    if (parsed.protocol !== "https:") {
      throw new Error("Supabase URL must use HTTPS.");
    }
    supabaseHost = parsed.hostname;
  } catch {
    throw new Error("VITE_SUPABASE_URL must be a valid HTTPS URL.");
  }

  if (supabaseHost !== `${SUPABASE_PROJECT_REF}.supabase.co`) {
    throw new Error(
      `VITE_SUPABASE_URL must point to the LTCme production project ${SUPABASE_PROJECT_REF}.`,
    );
  }

  return {
    resolve: {
      dedupe: ["react", "react-dom", "@tanstack/react-router"],
      tsconfigPaths: true,
    },
    plugins: [
      cloudflare({ viteEnvironment: { name: "ssr" } }),
      tailwindcss(),
      tanstackStart(),
      react(),
    ],
  };
});
