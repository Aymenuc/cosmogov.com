'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff, Loader2 } from 'lucide-react';

/**
 * PushNotificationToggle — Allows users to enable/disable push notifications.
 *
 * Place this in the settings page or as part of the notification preferences.
 * Requires the VAPID public key from /api/push/vapid-key.
 */
export default function PushNotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true);
      setPermission(Notification.permission);
      // Check if already subscribed
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setSubscribed(!!subscription);
    } catch {
      // Service worker not ready
    }
  };

  const subscribe = async () => {
    if (!supported) return;
    setLoading(true);

    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setLoading(false);
        return;
      }

      // Get VAPID public key
      const keyRes = await fetch('/api/push/vapid-key');
      const keyData = await keyRes.json();

      if (!keyData.configured || !keyData.publicKey) {
        console.warn('Push notifications not configured on server');
        setLoading(false);
        return;
      }

      // Subscribe
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyData.publicKey,
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      setSubscribed(true);
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from server
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
      }

      setSubscribed(false);
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className="flex items-center gap-3 text-sm text-cosmic-muted">
        <BellOff className="w-4 h-4" />
        <span>Push notifications are not supported in this browser</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          subscribed ? 'bg-cosmic-teal/10' : 'bg-white/5'
        }`}>
          <Bell className={`w-4 h-4 ${subscribed ? 'text-cosmic-teal' : 'text-cosmic-muted'}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Push Notifications</p>
          <p className="text-xs text-cosmic-muted">
            {subscribed
              ? 'You will receive push notifications for important updates'
              : permission === 'denied'
              ? 'Push notifications are blocked by your browser'
              : 'Enable to receive instant notifications'}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        variant={subscribed ? 'ghost' : 'default'}
        className={
          subscribed
            ? 'text-cosmic-muted hover:text-cosmic-rose'
            : 'bg-cosmic-teal text-white hover:bg-cosmic-teal/90'
        }
        onClick={subscribed ? unsubscribe : subscribe}
        disabled={loading || permission === 'denied'}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : subscribed ? (
          'Disable'
        ) : (
          'Enable'
        )}
      </Button>
    </div>
  );
}
