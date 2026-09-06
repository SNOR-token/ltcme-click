import { supabase } from "@/integrations/supabase/client";

const NATIVE_AUTH_CALLBACK = "click.ltcme://auth/callback";

type ListenerHandle = { remove: () => Promise<void> };
type NativeAppPlugin = {
  addListener: (
    eventName: "appUrlOpen",
    listener: (event: { url: string }) => void,
  ) => Promise<ListenerHandle>;
  getLaunchUrl: () => Promise<{ url?: string } | undefined>;
};
type NativeBrowserPlugin = {
  open: (options: { url: string }) => Promise<void>;
  close?: () => Promise<void>;
};

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      Plugins?: {
        App?: NativeAppPlugin;
        Browser?: NativeBrowserPlugin;
      };
    };
  }
}

let initialization: Promise<void> | undefined;
let callbackInProgress = false;

function nativePlugins() {
  if (typeof window === "undefined") return undefined;
  if (!window.Capacitor?.isNativePlatform?.()) return undefined;
  return window.Capacitor.Plugins;
}

function callbackParams(url: URL) {
  const params = new URLSearchParams(url.search);
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ""));
  fragment.forEach((value, key) => params.set(key, value));
  return params;
}

async function handleNativeAuthCallback(rawUrl: string) {
  if (callbackInProgress) return;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return;
  }

  if (url.protocol !== "click.ltcme:" || url.hostname !== "auth" || url.pathname !== "/callback") {
    return;
  }

  callbackInProgress = true;
  const params = callbackParams(url);

  try {
    const providerError = params.get("error_description") || params.get("error");
    if (providerError) throw new Error(providerError);

    const code = params.get("code");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else {
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (!accessToken || !refreshToken) {
        throw new Error("The sign-in response did not include a session.");
      }
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
    }

    await nativePlugins()
      ?.Browser?.close?.()
      .catch(() => undefined);
    window.location.replace("/wallets");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Google sign-in did not finish.";
    sessionStorage.setItem("ltcme:native-auth-error", message);
    await nativePlugins()
      ?.Browser?.close?.()
      .catch(() => undefined);
    window.location.replace("/auth");
  }
}

export function initializeNativeAuth() {
  if (typeof window === "undefined") return Promise.resolve();
  if (initialization) return initialization;

  initialization = (async () => {
    const app = nativePlugins()?.App;
    if (!app) return;

    await app.addListener("appUrlOpen", ({ url }) => {
      void handleNativeAuthCallback(url);
    });

    const launchUrl = await app.getLaunchUrl();
    if (launchUrl?.url) await handleNativeAuthCallback(launchUrl.url);
  })().catch((error) => {
    console.error("Unable to initialize native authentication", error);
  });

  return initialization;
}

export async function startGoogleSignIn() {
  const plugins = nativePlugins();
  const native = Boolean(plugins);
  const redirectTo = native ? NATIVE_AUTH_CALLBACK : `${window.location.origin}/auth`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: native,
      queryParams: { prompt: "select_account" },
    },
  });

  if (error) throw error;

  if (native) {
    if (!data.url) throw new Error("Google sign-in URL was not returned.");
    if (!plugins?.Browser) {
      throw new Error(
        "This app version cannot open secure Google sign-in. Update the Android app and try again.",
      );
    }
    await plugins.Browser.open({ url: data.url });
  }

  return { openedNativeBrowser: native };
}

export function takeNativeAuthError() {
  if (typeof window === "undefined") return null;
  const message = sessionStorage.getItem("ltcme:native-auth-error");
  if (message) sessionStorage.removeItem("ltcme:native-auth-error");
  return message;
}
