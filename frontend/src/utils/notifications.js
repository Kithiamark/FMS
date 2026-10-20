/**
 * Browser Notification Helper
 * Provides permission request and desktop/mobile notification triggers.
 */

export const isNotificationSupported = () => {
    return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = () => {
    if (!isNotificationSupported()) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
};

export const requestNotificationAccess = async () => {
    if (!isNotificationSupported()) {
        return { granted: false, status: 'unsupported' };
    }
    try {
        const permission = await Notification.requestPermission();
        return {
            granted: permission === 'granted',
            status: permission
        };
    } catch (e) {
        console.error('Error requesting notification permission:', e);
        return { granted: false, status: 'error' };
    }
};

export const sendLocalNotification = (title, options = {}) => {
    if (!isNotificationSupported() || Notification.permission !== 'granted') {
        return null;
    }
    const defaultOptions = {
        icon: '/pwa-192x192.png',
        badge: '/favicon.svg',
        vibrate: [200, 100, 200],
        ...options
    };
    try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, defaultOptions);
            });
            return true;
        }
        return new Notification(title, defaultOptions);
    } catch (e) {
        console.error('Could not display notification', e);
        return null;
    }
};
