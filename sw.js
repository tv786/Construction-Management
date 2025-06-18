// Service Worker for Ruh Al-Bina Construction Management
const CACHE_NAME = 'ruh-al-bina-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/styles/components.css',
    '/styles/responsive.css',
    '/js/main.js',
    '/js/storage.js',
    '/js/vendors.js',
    '/js/transactions.js',
    '/js/projects.js',

    '/js/analytics.js',
    '/js/calculators.js',
    '/js/utils.js',
    '/assets/logo.svg',
    '/manifest.json',
    // External dependencies
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('Caching static files...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Static files cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Error caching static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Old caches cleaned up');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve files from cache or network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests
    if (STATIC_FILES.includes(request.url) || STATIC_FILES.includes(url.pathname)) {
        // Static files - cache first strategy
        event.respondWith(cacheFirst(request));
    } else if (url.origin === location.origin) {
        // Same origin requests - network first with cache fallback
        event.respondWith(networkFirst(request));
    } else if (url.origin === 'https://fonts.googleapis.com' || 
               url.origin === 'https://cdnjs.cloudflare.com' ||
               url.origin === 'https://cdn.jsdelivr.net') {
        // External CDN resources - cache first strategy
        event.respondWith(cacheFirst(request));
    } else {
        // Other external requests - network only
        event.respondWith(fetch(request));
    }
});

// Cache first strategy
async function cacheFirst(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache first strategy failed:', error);
        
        // Return offline page for navigation requests
        if (request.destination === 'document') {
            return caches.match('/index.html');
        }
        
        throw error;
    }
}

// Network first strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.status === 200) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache:', error);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.destination === 'document') {
            return caches.match('/index.html');
        }
        
        throw error;
    }
}

// Background sync for offline data
self.addEventListener('sync', event => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'offline-data-sync') {
        event.waitUntil(syncOfflineData());
    }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
    try {
        console.log('Syncing offline data...');
        
        // Get all clients (open tabs)
        const clients = await self.clients.matchAll();
        
        // Notify clients that sync is starting
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_START'
            });
        });
        
        // Here you would implement actual data synchronization
        // For now, we'll just notify clients that sync is complete
        setTimeout(() => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'SYNC_COMPLETE'
                });
            });
        }, 1000);
        
        console.log('Offline data sync completed');
    } catch (error) {
        console.error('Error syncing offline data:', error);
    }
}

// Push notification handling
self.addEventListener('push', event => {
    console.log('Push notification received:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'New notification from Ruh Al-Bina',
        icon: '/assets/logo.svg',
        badge: '/assets/logo.svg',
        vibrate: [200, 100, 200],
        data: {
            url: '/'
        },
        actions: [
            {
                action: 'open',
                title: 'Open App'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Ruh Al-Bina Construction', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    console.log('Notification clicked:', event);
    
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            self.clients.matchAll().then(clients => {
                // Check if app is already open
                const client = clients.find(c => c.url === self.location.origin);
                if (client) {
                    return client.focus();
                } else {
                    return self.clients.openWindow('/');
                }
            })
        );
    }
});

// Message handling from main thread
self.addEventListener('message', event => {
    console.log('Message received in SW:', event.data);
    
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
                
            case 'GET_VERSION':
                event.ports[0].postMessage({
                    version: CACHE_NAME
                });
                break;
                
            case 'CACHE_UPDATE':
                event.waitUntil(updateCache());
                break;
                
            default:
                console.log('Unknown message type:', event.data.type);
        }
    }
});

// Update cache manually
async function updateCache() {
    try {
        console.log('Updating cache...');
        
        const cache = await caches.open(STATIC_CACHE);
        await cache.addAll(STATIC_FILES);
        
        console.log('Cache updated successfully');
        
        // Notify all clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'CACHE_UPDATED'
            });
        });
    } catch (error) {
        console.error('Error updating cache:', error);
    }
}

// Error handling
self.addEventListener('error', event => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker loaded successfully');
