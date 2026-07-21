const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const NOTIFICACIONES_URL = import.meta.env.VITE_NOTIFICACIONES_URL || 'http://localhost:3081';


function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function subscribeToPush(): Promise<boolean> {
    console.log('[Push] subscribeToPush() iniciado');
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('[Push] Navegador no soporta push');
        return false;
    }

    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
        console.warn('[Push] Permiso denegado');
        return false;
    }

    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
    });

    const subJson = subscription.toJSON();

    const res = await fetch(`${NOTIFICACIONES_URL}/api/v1/notificaciones/push/subscribe`, {
        method: 'POST',
        credentials:"include",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            endpoint: subJson.endpoint,
            keys: subJson.keys
        })
    });

    if (!res.ok) {
        throw new Error(`Error al registrar suscripcion push: HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    console.log('[Push] Suscripcion registrada');
    return true;
}

export async function unsubscribeFromPush(): Promise<boolean> {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return false;

    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    const res = await fetch(`${NOTIFICACIONES_URL}/api/v1/notificaciones/push/unsubscribe`, {
        credentials:"include",
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint })
    });

    if (!res.ok) {
        console.warn(`[Push] Error al eliminar suscripcion: HTTP ${res.status}`);
    }

    console.log('[Push] Suscripcion eliminada');
    return true;
}

export async function isPushSubscribed(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;
    try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        console.log('[SW] Service Worker registrado');
        return reg;
    } catch (err) {
        console.error('[SW] Error al registrar:', err);
        return null;
    }
}
