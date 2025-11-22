# Android Platform Support

This folder contains Android-specific code and configurations for the Hotel Madagascar mobile app.

## Overview

Currently, this is a web-first PWA (Progressive Web App). This folder is prepared for future Android-specific features if you decide to wrap the web app in a native Android container (WebView) or build native screens.

## Folder Structure

```
platform/android/
├── README.md           # This file
├── webview/            # WebView integration code
│   ├── WebViewConfig.js
│   └── AndroidBridge.js
├── native/             # Native Android code (if hybrid app)
│   └── .gitkeep
└── assets/             # Android-specific assets
    └── .gitkeep
```

## Current Status

✅ **Web/PWA** - Fully responsive, mobile-optimized
🟡 **Android Native** - Prepared but not implemented
🟡 **WebView Wrapper** - Boilerplate ready

## WebView Integration (Future)

If you decide to wrap the web app in an Android WebView:

### Security Checklist

- [ ] Disable file access unless needed
- [ ] Remove `addJavascriptInterface()` or use safely with `@JavascriptInterface`
- [ ] Set `setAllowFileAccessFromFileURLs(false)`
- [ ] Set `setAllowUniversalAccessFromFileURLs(false)`
- [ ] Validate all deep link parameters
- [ ] Implement certificate pinning if handling sensitive data

### WebView Configuration Example

```java
// Minimal secure WebView setup
WebView webView = findViewById(R.id.webview);
WebSettings settings = webView.getSettings();

// Enable JavaScript (required for React app)
settings.setJavaScriptEnabled(true);

// Security settings
settings.setAllowFileAccess(false);
settings.setAllowFileAccessFromFileURLs(false);
settings.setAllowUniversalAccessFromFileURLs(false);
settings.setDatabaseEnabled(true);
settings.setDomStorageEnabled(true); // Required for IndexedDB

// Load the web app
webView.loadUrl("https://your-domain.com");

// Handle back button
@Override
public void onBackPressed() {
    if (webView.canGoBack()) {
        webView.goBack();
    } else {
        super.onBackPressed();
    }
}
```

## Native Features Integration

If you add native Android features (camera, GPS, push notifications):

### 1. Camera Access

```javascript
// In your web code
async function openCamera() {
  if (window.Android && window.Android.takePhoto) {
    // Native Android camera
    const photoData = await window.Android.takePhoto();
    return photoData;
  } else {
    // Web camera API fallback
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // ...
  }
}
```

```java
// In Android WebView bridge
@JavascriptInterface
public String takePhoto() {
    // Launch camera intent
    // Return base64 or file URI
}
```

### 2. Push Notifications

For Android push notifications (Firebase Cloud Messaging):

1. Add FCM SDK to `build.gradle`
2. Create notification service
3. Bridge to web app via JavaScript interface
4. Handle notification clicks

### 3. Geolocation

Web Geolocation API works in WebView, but you may want native:

```java
@JavascriptInterface
public String getCurrentLocation() {
    // Use FusedLocationProviderClient
    // Return JSON: {"lat": 21.88, "lng": -102.29}
}
```

## Testing on Android

### Debug Build

1. **Install Android Studio**
2. **Create WebView wrapper project**
3. **Test on emulator or device**

```bash
# Build debug APK
./gradlew assembleDebug

# Install on device
adb install app/build/outputs/apk/debug/app-debug.apk
```

### Chrome DevTools Remote Debugging

1. Connect Android device via USB
2. Enable USB debugging
3. Open Chrome: `chrome://inspect`
4. Select your WebView
5. Inspect like a regular web page

## Performance Optimization

### Android-Specific Optimizations

1. **Hardware Acceleration**
   ```java
   webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
   ```

2. **Cache Configuration**
   ```java
   settings.setCacheMode(WebSettings.LOAD_DEFAULT);
   settings.setAppCacheEnabled(true);
   settings.setAppCachePath(getApplicationContext().getCacheDir().getPath());
   ```

3. **Memory Management**
   ```java
   @Override
   protected void onDestroy() {
       if (webView != null) {
           webView.destroy();
       }
       super.onDestroy();
   }
   ```

## Play Store Requirements

If publishing to Google Play:

- [ ] App signing configured
- [ ] Privacy policy URL added
- [ ] Data safety form completed
- [ ] Target SDK 33+ (Android 13)
- [ ] App size < 150MB (or use App Bundles)
- [ ] Permissions requested only when needed
- [ ] Content rating completed

## Network Security Configuration

Create `res/xml/network_security_config.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <!-- Prevent cleartext traffic -->
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
    
    <!-- Certificate pinning for your domain (optional) -->
    <domain-config cleartextTrafficPermitted="false">
        <domain includeSubdomains="true">your-domain.com</domain>
        <pin-set expiration="2026-01-01">
            <pin digest="SHA-256">your-cert-sha256-hash</pin>
        </pin-set>
    </domain-config>
</network-security-config>
```

Reference in `AndroidManifest.xml`:
```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

## Deep Linking

Handle deep links in `AndroidManifest.xml`:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:scheme="https"
        android:host="your-domain.com"
        android:pathPrefix="/booking" />
</intent-filter>
```

Handle in Activity:
```java
Intent intent = getIntent();
Uri data = intent.getData();
if (data != null) {
    String path = data.getPath();
    // Validate and pass to WebView
    webView.loadUrl("https://your-domain.com" + path);
}
```

## Resources

- [Android WebView Best Practices](https://developer.android.com/guide/webapps/webview)
- [PWA on Android](https://web.dev/progressive-web-apps/)
- [Trusted Web Activities](https://developer.chrome.com/docs/android/trusted-web-activity/)

## See Also

- [MOBILE.md](../../../MOBILE.md) - Mobile UX guidelines
- [SECURITY.md](../../../SECURITY.md) - Security policy
