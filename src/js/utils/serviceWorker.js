export function unregisterServiceWorkers() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function (registrations) {
            for (let registration of registrations) {
                console.log('Unregistering stale service worker:', registration);
                registration.unregister();
            }
        });
    }
}
