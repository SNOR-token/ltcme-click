import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "click.ltcme",
  appName: "LTCme.click",
  webDir: "www",
  server: {
    url: "https://ltcme.click",
    cleartext: false,
    androidScheme: "https",
  },
};

export default config;
