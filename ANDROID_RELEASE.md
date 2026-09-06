# LTCme.click Android release

The Android package is `click.ltcme`. The web and native flow is:

1. The app loads `https://ltcme.click`.
2. **Continue to sign in** opens `/auth`.
3. Google sign-in opens in Android's secure system browser.
4. Supabase returns to `click.ltcme://auth/callback`.
5. The app validates the callback, saves the Supabase session, and opens `/wallets`.

## Required one-time settings

In Supabase **Authentication > URL Configuration**, keep the production HTTPS
redirects and add this exact Android redirect URL:

```text
click.ltcme://auth/callback
```

Do not add OAuth client secrets, Supabase service-role keys, seed phrases, private
keys, or the Android keystore to this repository.

## Install and synchronize Capacitor

Capacitor 8 requires Node 22 or later and JDK 21.

```bash
cd mobile
npm install
npm run sync
```

The app uses `@capacitor/browser` for Google OAuth and `@capacitor/app` to receive
the deep-link callback. Re-run `npm run sync` after changing a Capacitor plugin or
the manifest.

## Create the upload key once

If this is the first Play release, create a dedicated upload key and keep it backed
up outside Git. `keytool` prompts for passwords so they do not need to appear in the
command:

```bash
keytool -genkeypair -v \
  -keystore ltcme-upload.jks \
  -alias ltcme-upload \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000
```

If Google Play already knows an upload certificate for `click.ltcme`, use that
existing key. A different key will be rejected unless Google approves an upload-key
reset.

## Build the signed AAB and APK

Set all four signing variables in the same terminal. Use the absolute path to your
keystore; do not copy the keystore into Git.

```bash
export LTCME_UPLOAD_KEYSTORE="/absolute/private/path/ltcme-upload.jks"
export LTCME_UPLOAD_KEY_ALIAS="ltcme-upload"
read -rsp "Keystore password: " LTCME_UPLOAD_KEYSTORE_PASSWORD && export LTCME_UPLOAD_KEYSTORE_PASSWORD
echo
read -rsp "Key password: " LTCME_UPLOAD_KEY_PASSWORD && export LTCME_UPLOAD_KEY_PASSWORD
echo

npm run build:aab
npm run build:apk
```

Outputs:

- Play upload: `mobile/android/app/build/outputs/bundle/release/app-release.aab`
- Direct install: `mobile/android/app/build/outputs/apk/release/app-release.apk`

Verify the APK before publishing it:

```bash
apksigner verify --verbose --print-certs \
  android/app/build/outputs/apk/release/app-release.apk
```

The signer must be your LTCme upload/release certificate, not
`C=US, O=Android, CN=Android Debug`.

## Enable the direct APK only after verification

Google Play uses the AAB. If you also want the direct-download fallback:

1. Copy the verified release APK to `public/downloads/LTCme.apk` in the repository
   root.
2. Update `src/routes/download.tsx` to show the direct-download link.
3. Commit the APK, its SHA-256 checksum, and the page change together.

The QR code stays pointed at `https://ltcme.click/download`, so it never needs to be
reprinted when the Play listing or direct APK changes.
