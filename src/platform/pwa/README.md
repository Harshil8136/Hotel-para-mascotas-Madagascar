# PWA (Progressive Web App) Support

This folder contains PWA-specific code for offline functionality and app-like experience on mobile devices.

## Overview

Progressive Web Apps combine the best of web and native apps:
- **Installable** - Can be added to home screen
- **Offline** - Works without internet connection
- **Fast** - Cached assets load instantly
- **Engaging** - Push notifications, background sync

## Current Status

✅ **Manifest** - Already configured ([manifest.json](../../../manifest.json))
🟡 **Service Worker** - Prepared (needs registration)
🟡 **Offline Page** - To be created
🟡 **Push Notifications** - Hooks ready

## Files

- **[service-worker.js](./service-worker.js)** - Main Service Worker with caching strategies
- **[pwa-install.js](./pwa-install.js)** - Install prompt handler (to be created)
- **[push-notifications.js](./push-notifications.js)** - Push notification manager (to be created)

## Quick Start

### 1. Register Service Worker

Add to your `main.js` or `index.html`:

```javascript
// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/src/platform/pwa/service-worker.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });
  });
}
```

### 2. Update Manifest

The manifest is already at [manifest.json](../../../manifest.json). Verify it has:

```json
{
  "name": "Hotel Madagascar",
  "short_name": "Madagascar",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#D9F22E",
  "icons": [
    {
      "src": "/assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 3. Test PWA

1. **Serve over HTTPS** (required for Service Workers)
2. **Open DevTools** → Application tab
3. **Check**:
   - Manifest loaded correctly
   - Service Worker registered
   - Offline functionality works
4. **Lighthouse Audit**: Run PWA audit to check compliance

## Cache Strategy

The Service Worker uses two strategies:

### Cache-First (Static Assets)
```
Request → Check Cache → If found: Return
                      → If not: Fetch + Cache + Return
```

**Used for**:
- HTML, CSS, JavaScript
- Images, fonts, icons
- Rarely changing files

### Network-First (Dynamic Data)
```
Request → Fetch Network → If success: Cache + Return
                        → If fail: Return cached
```

**Used for**:
- `seed.json` (booking data)
- API requests (future)
- Frequently updating content

## Updating Service Worker

When you update the Service Worker:

1. Change `CACHE_NAME` version:
   ```javascript
   const CACHE_NAME = 'hotel-madagascar-v2'; // Increment version
   ```

2. Old caches are automatically cleared in `activate` event

3. Force update for testing:
   ```javascript
   // In DevTools Console
   self.registration.unregister();
   location.reload();
   ```

## Offline Page

Create `offline.html` in the root:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sin Conexión - Hotel Madagascar</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #D9F22E 0%, #1a5f3d 100%);
      color: white;
      text-align: center;
      padding: 2rem;
    }
    h1 { font-size: 2.5rem; margin-bottom: 1rem; }
    p { font-size: 1.2rem; opacity: 0.9; }
    button {
      margin-top: 2rem;
      padding: 1rem 2rem;
      font-size: 1rem;
      background: white;
      color: #1a5f3d;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div>
    <h1>🐾 Sin Conexión</h1>
    <p>No hay conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.</p>
    <button onclick="location.reload()">Reintentar</button>
  </div>
</body>
</html>
```

Then add to `STATIC_ASSETS` in Service Worker:
```javascript
const STATIC_ASSETS = [
  // ...
  '/offline.html'
];
```

## Install Prompt

Show custom install prompt when PWA is installable:

```javascript
// Save the beforeinstallprompt event
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing
  e.preventDefault();
  deferredPrompt = e;
  
  // Show your custom install button
  showInstallButton();
});

// When user clicks your install button
async function installPWA() {
  if (!deferredPrompt) return;
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log(`User response: ${outcome}`);
  deferredPrompt = null;
}
```

## Push Notifications (Future)

To enable push notifications:

1. **Get user permission**:
   ```javascript
   const permission = await Notification.requestPermission();
   if (permission === 'granted') {
     // Subscribe to push
   }
   ```

2. **Subscribe to push service**:
   ```javascript
   const registration = await navigator.serviceWorker.ready;
   const subscription = await registration.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
   });
   ```

3. **Send subscription to your server**:
   ```javascript
   await fetch('/api/subscribe', {
     method: 'POST',
     body: JSON.stringify(subscription),
     headers: { 'Content-Type': 'application/json' }
   });
   ```

4. **Handle push in Service Worker** (already in service-worker.js)

## Background Sync (Future)

To sync data when connection is restored:

```javascript
// Register a sync
const registration = await navigator.serviceWorker.ready;
await registration.sync.register('sync-bookings');

// In Service Worker (already in service-worker.js)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});
```

## Testing Checklist

- [ ] Service Worker registers successfully
- [ ] Static assets cached on first visit
- [ ] Site works offline (test with DevTools → Network → Offline)
- [ ] Site can be installed (Add to Home Screen)
- [ ] Installed app opens in standalone mode
- [ ] Updates work correctly (change SW version, refresh)
- [ ] Lighthouse PWA audit scores 90+

## Performance Metrics

Target metrics for mobile (3G):
- **First Contentful Paint**: < 2.5s
- **Largest Contentful Paint**: < 4s
- **Time to Interactive**: < 5s
- **Cumulative Layout Shift**: < 0.1

Test with:
```bash
npx lighthouse https://your-domain.com --preset=perf --view
```

## Browser Support

Service Workers are supported in:
- ✅ Chrome/Edge 40+
- ✅ Firefox 44+
- ✅ Safari 11.1+
- ✅ Samsung Internet 4+

Check support:
```javascript
if ('serviceWorker' in navigator) {
  // Supported
}
```

## Debugging

### Chrome DevTools

1. **Application tab** → Service Workers
   - See registration status
   - Force update
   - Unregister

2. **Application tab** → Cache Storage
   - View cached files
   - Clear cache

3. **Network tab**
   - Filter by "Served from ServiceWorker"
   - See what's cached vs fetched

### Firefox Developer Tools

1. **about:debugging** → This Firefox → Service Workers
2. **Storage tab** → Cache Storage

## Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Workbox](https://developers.google.com/web/tools/workbox) - Google's SW library

## See Also

- [MOBILE.md](../../../MOBILE.md) - Mobile UX guidelines
- [manifest.json](../../../manifest.json) - App manifest
