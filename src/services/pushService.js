const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const API_BASE = import.meta.env.VITE_API_BASE || '';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !VAPID_KEY || VAPID_KEY === 'your_vapid_key') {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
      });
    }

    await fetch(`${API_BASE}/api/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    return subscription;
  } catch {
    return null;
  }
}

export async function unsubscribeFromPush() {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }
}
