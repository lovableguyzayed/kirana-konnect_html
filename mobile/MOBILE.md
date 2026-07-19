# Kirana Konnect — Android app (Apache Cordova)

This folder wraps the Kirana Konnect web app in a **native Android app** using
Apache Cordova. The app is a thin native shell: it shows a branded splash
screen, then loads your **hosted backend** (the Render deployment) inside an
Android WebView. All pages, the database, the `/api/*` calls, and the barcode
scanner run against your live server.

> **Why a shell and not a fully offline app?**
> Kirana Konnect is a Flask (Python) server app with a PostgreSQL database.
> Android cannot run Flask, so the phone app cannot contain the backend — it
> talks to your deployed server. The app therefore needs the backend deployed
> (e.g. on Render) and an internet connection.

## 1. Point the app at your backend

Edit **`www/js/config.js`** and set your deployed URL:

```js
window.APP_CONFIG = {
    APP_URL: "https://kirana-konnect.onrender.com"   // <- your Render URL
};
```

If you use a custom domain (not `*.onrender.com`), also update the
`<allow-navigation>` host and the `Content-Security-Policy` in
`www/index.html` and `config.xml` so the WebView is allowed to load it.

## 2. Prerequisites (on the machine that builds the APK)

Cordova cannot build the APK in the Claude web environment because Google's
Android SDK servers are blocked there. Build on your own machine or a CI runner:

- **Node.js** 18+ and **Cordova CLI**: `npm install -g cordova`
- **Java JDK 17** (JDK 17 is required by cordova-android 13)
- **Android SDK** — easiest via **Android Studio**, or the command-line tools.
  Set the environment variables:
  ```bash
  export ANDROID_HOME=$HOME/Android/Sdk
  export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
  ```
- Install the required SDK packages and accept licenses:
  ```bash
  sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
  sdkmanager --licenses
  ```

## 3. Build a debug APK (for testing)

```bash
cd mobile
cordova platform add android      # first time only
cordova build android
```

The APK is written to:
```
platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

Install it on a phone (USB debugging enabled):
```bash
adb install -r platforms/android/app/build/outputs/apk/debug/app-debug.apk
```
…or copy the `.apk` to the phone and open it (enable "Install unknown apps").

## 4. Build a signed release APK (for sharing / Play Store)

1. Create a keystore once:
   ```bash
   keytool -genkey -v -keystore kirana.keystore -alias kirana \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Create `build.json` next to `config.xml`:
   ```json
   {
     "android": {
       "release": {
         "keystore": "kirana.keystore",
         "storePassword": "YOUR_STORE_PASSWORD",
         "alias": "kirana",
         "password": "YOUR_KEY_PASSWORD",
         "keystoreType": "jks"
       }
     }
   }
   ```
   (Keep `build.json` and the keystore **out of git** — they contain secrets.)
3. Build:
   ```bash
   cordova build android --release
   ```
   Output: `platforms/android/app/build/outputs/apk/release/app-release.apk`
   (or use `--packageType=bundle` to produce an `.aab` for the Play Store).

## Notes

- **Camera / barcode scanner:** the app declares the `CAMERA` permission; Android
  will prompt the user the first time the scanner opens.
- **Version / app id:** change `version` and the `id` in `config.xml` for updates.
- **App icons:** in `res/android/` (regenerate to replace the placeholder cart icon).
- **What's committed:** only the Cordova *source* (`config.xml`, `www/`,
  `package.json`, `res/`, this guide). The generated `platforms/` and `plugins/`
  folders are rebuilt by `cordova platform add android` and are gitignored.
