# Google Play Submission Guide for LTCme.click

## 📦 What You Need to Submit

This folder contains everything you need for Google Play submission.

### Required Files

1. **App Bundle (AAB)** - The signed Android App Bundle
   - Location: `mobile/android/app/build/outputs/bundle/release/app-release.aab`
   - **How to generate:** See instructions below

2. **Privacy Policy** - Already created
   - Location: `mobile/android/PRIVACY_POLICY.md`
   - **You must:** Host this at `https://ltcme.click/privacy`

3. **Store Listing** - All text content
   - Location: `mobile/android/play-store/store-listing.md`
   - Contains: App name, descriptions, keywords, contact info

---

## 🚀 Step 1: Generate App Icon Assets

You need these icon files in the correct directories:

```bash
# Adaptive icons (required for Android 8.0+)
mkdir -p mobile/android/app/src/main/res/mipmap-anydpi-v26

# Create adaptive icon XML files
# See: mobile/android/app/src/main/res/mipmap-anydpi-v26/
```

### Required Icon Files:

| Directory | File | Size | Purpose |
|-----------|------|------|---------|
| `mipmap-mdpi/` | `ic_launcher.png` | 48x48 | Low density |
| `mipmap-hdpi/` | `ic_launcher.png` | 72x72 | Medium density |
| `mipmap-xhdpi/` | `ic_launcher.png` | 96x96 | High density |
| `mipmap-xxhdpi/` | `ic_launcher.png` | 144x144 | Extra high density |
| `mipmap-xxxhdpi/` | `ic_launcher.png` | 192x192 | Extra extra high density |
| `mipmap-anydpi-v26/` | `ic_launcher.xml` | - | Adaptive icon |
| `mipmap-anydpi-v26/` | `ic_launcher_round.xml` | - | Round adaptive icon |

### Icon Design Requirements:
- **Format:** PNG (for bitmaps), XML (for adaptive icons)
- **Background:** Transparent or solid color
- **Shape:** Square or circular
- **Style:** Distinctive Litecoin branding

---

## 📱 Step 2: Create Screenshots

Google Play requires **at least 2 screenshots** for phone displays.

### Required Screenshot Specifications:

| Device Type | Size (Portrait) | Size (Landscape) | Quantity |
|-------------|-----------------|------------------|----------|
| Phone (6.5") | 1080x2340 | 1080x1920 | 2-8 |
| Tablet (10") | 1200x1920 | 1920x1200 | Optional |

### Suggested Screenshots:

1. **Wallet Dashboard** - Showing balance and recent transactions
2. **AI Chat** - Showing the AI companion in action
3. **Send Screen** - Showing the send LTC interface
4. **Wallet List** - Showing multiple wallets
5. **Pro Features** - Showing risk analysis or other Pro features
6. **Settings** - Showing app settings

### Tips:
- Use actual app screenshots (not mockups)
- Show the app in action
- Highlight key features
- Use high-quality images
- Add captions if helpful

---

## 🎨 Step 3: Create Feature Graphic

The feature graphic appears at the top of your store listing.

- **Size:** 1024x500 pixels
- **Format:** PNG or JPEG
- **File:** `mobile/android/play-store/feature-graphic.png`

### Design Tips:
- Include app name prominently
- Show key features visually
- Use Litecoin colors (silver/gray)
- Keep text readable on all devices

---

## 🔧 Step 4: Build the App Bundle (AAB)

### Prerequisites:
- Java JDK 17+
- Android Studio or Android SDK
- Node.js 18+

### Build Steps:

```bash
# 1. Navigate to mobile directory
cd mobile/android

# 2. Install dependencies (if not already done)
npm install

# 3. Build the web app for Android
npm run build

# 4. Copy web build to www
cp -r ../../dist/* www/

# 5. Build the Android App Bundle
./gradlew bundleRelease

# 6. Find your AAB file
# Location: app/build/outputs/bundle/release/app-release.aab
```

### Alternative: Build APK (for testing)

```bash
# Build debug APK
./gradlew assembleDebug

# Build release APK (unsigned)
./gradlew assembleRelease
```

---

## 🔐 Step 5: Sign Your App

### Option A: Use Existing Keystore

If you already have a keystore:

```bash
# Sign the AAB
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore your-keystore.jks \
  -storepass yourpassword \
  app/build/outputs/bundle/release/app-release.aab \
  your-alias-name

# Verify
jarsigner -verify app/build/outputs/bundle/release/app-release.aab
```

### Option B: Create New Keystore

```bash
# Generate a new keystore
keytool -genkey -v \
  -keystore ltcme-release.jks \
  -alias ltcme \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storetype JKS

# You'll be prompted for:
# - Keystore password (remember this!)
# - Key password (can be same as keystore password)
# - Your name, organization, etc.

# Sign the AAB
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore ltcme-release.jks \
  -storepass yourpassword \
  app/build/outputs/bundle/release/app-release.aab \
  ltcme
```

### ⚠️ IMPORTANT: Backup Your Keystore!

- **Without your keystore, you CANNOT update your app on Google Play!**
- Store it securely (encrypted USB drive, secure cloud storage)
- Never commit it to Git
- Add to `.gitignore`:
  ```
  *.jks
  *.keystore
  ```

---

## 📤 Step 6: Upload to Google Play Console

### Before Uploading:
1. ✅ App Bundle (AAB) signed
2. ✅ Privacy policy hosted at `https://ltcme.click/privacy`
3. ✅ All screenshots created (2-8)
4. ✅ Feature graphic created (1024x500)
5. ✅ App icon (512x512)
6. ✅ Store listing text ready

### Upload Steps:

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app or select existing
3. Click "Upload bundle"
4. Select your `app-release.aab` file
5. Wait for processing (may take several minutes)

---

## 📋 Step 7: Complete Store Listing

### In Google Play Console:

1. **App Name:** LTCme.click - Litecoin Wallet
2. **Short Description:** Self-custody Litecoin wallet with AI companion
3. **Full Description:** Copy from `store-listing.md`
4. **Keywords:** Copy from `store-listing.md`
5. **Category:** Finance
6. **Content Rating:** Complete the questionnaire (see `store-listing.md` for answers)
7. **Contact Details:**
   - Website: https://ltcme.click
   - Email: chad78500@gmail.com
   - Phone: Not required
8. **Privacy Policy URL:** https://ltcme.click/privacy

### Upload Graphics:
- App icon (512x512)
- Feature graphic (1024x500)
- Screenshots (2-8)

---

## 🎯 Step 8: Set Up App Content Rating

1. In Google Play Console, go to "App Content"
2. Click "Start Questionnaire"
3. Answer all questions (see `store-listing.md` for suggested answers)
4. Submit for rating
5. Wait for Google to review (usually 1-2 days)

---

## 💰 Step 9: Set Up Pricing & Distribution

### Free App:
- App is free to download
- Pro features available via in-app subscription (Stripe)

### Distribution:
- **Countries:** Select all countries where you want to distribute
- **Target Audience:** Everyone
- **Content Rating:** Everyone (or appropriate rating)

---

## 🏷️ Step 10: Set Up In-App Products (Optional)

If you want to offer Pro subscription through Google Play instead of Stripe:

1. Go to "Monetization" > "Products" > "In-app products"
2. Create a new subscription product
3. Set pricing for different regions
4. Configure billing period (monthly, yearly)

**Note:** Currently, your app uses Stripe for subscriptions. If you want to use Google Play billing, you'll need to modify the app code.

---

## 🚀 Step 11: Publish Your App

### Review Steps:
1. Click "Review" in Google Play Console
2. Check all required fields are complete
3. Click "Submit for Review"
4. Wait for Google review (usually 1-3 days)

### After Approval:
1. Your app will be published to the store
2. You can choose to publish immediately or schedule
3. Monitor for any issues or rejections

---

## 📊 Post-Publication Checklist

- [ ] Monitor app performance in Google Play Console
- [ ] Respond to user reviews
- [ ] Fix any reported bugs
- [ ] Update app regularly
- [ ] Monitor for policy violations

---

## 🔧 Troubleshooting

### Common Issues:

1. **Build fails with "Missing web content"**
   - Make sure `www/` directory has your built web app
   - Run `npm run build` in the main project directory first

2. **Keystore password forgotten**
   - You CANNOT recover it! Create a new keystore and upload as a new app
   - Package name must be different (e.g., `click.ltcme2`)

3. **App rejected for policy violation**
   - Check Google's email for specific reasons
   - Common issues: Missing privacy policy, incorrect content rating
   - Fix and resubmit

4. **App crashes on launch**
   - Test on multiple Android versions
   - Check for missing permissions
   - Test with `./gradlew assembleDebug` first

---

## 📚 Additional Resources

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [Sign Your App](https://developer.android.com/studio/publish/app-signing)
- [Google Play Policies](https://play.google.com/console/about/policies/)

---

## 🎉 You're Ready!

Once you've completed all steps:
1. ✅ App bundle signed and ready
2. ✅ All graphics created
3. ✅ Privacy policy hosted
4. ✅ Store listing complete

You can submit to Google Play Console!

**Estimated Timeline:** 1-3 days for Google review

---

## 📞 Need Help?

If you get stuck on any step, contact:
- **Email:** chad78500@gmail.com
- **Website:** https://ltcme.click
