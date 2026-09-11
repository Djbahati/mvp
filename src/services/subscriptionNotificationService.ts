import { SubscriptionRule } from '../types';

const NOTIFIED_STORAGE_KEY = 'kofi_notified_subs_24h';

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications.');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  const permission = await Notification.requestPermission();
  return permission;
}

export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
   * Checks subscription rules and triggers browser Notification API 
   * if a payment is due within the next 24 hours (and has not been notified yet).
   */
export function checkAndTriggerSubscriptionNotifications(subscriptions: SubscriptionRule[]): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  const now = new Date();
  const notifiedMap: Record<string, string> = JSON.parse(localStorage.getItem(NOTIFIED_STORAGE_KEY) || '{}');
  let updated = false;

  subscriptions.forEach((sub) => {
    if (!sub.isEnabled || !sub.nextPaymentDate) return;

    const dueDate = new Date(sub.nextPaymentDate);
    // If nextPaymentDate is YYYY-MM-DD, set to 09:00:00 or end of day
    if (!sub.nextPaymentDate.includes('T')) {
      dueDate.setHours(9, 0, 0, 0);
    }

    const diffMs = dueDate.getTime() - now.getTime();
    const hoursLeft = diffMs / (1000 * 60 * 60);

    // Trigger notification if due within 24 hours (between 0 and 24 hours left)
    // and not already notified for this specific due date
    const notificationKey = `${sub.id}_${sub.nextPaymentDate}`;
    const isDueWithin24h = hoursLeft <= 24 && hoursLeft >= -2; // allow slight buffer for overdue

    if (isDueWithin24h && !notifiedMap[notificationKey]) {
      const title = `🔔 Payment Due in ${Math.max(1, Math.round(hoursLeft))}h: ${sub.title}`;
      const body = `Your subscription payment of ${sub.amount.toLocaleString()} ${sub.assetSymbol} to ${sub.provider} is due tomorrow (${new Date(sub.nextPaymentDate).toLocaleDateString()}).`;

      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: `sub_due_${sub.id}`
        });

        notifiedMap[notificationKey] = new Date().toISOString();
        updated = true;
      } catch (err) {
        console.error('Failed to trigger browser notification:', err);
      }
    }
  });

  if (updated) {
    localStorage.setItem(NOTIFIED_STORAGE_KEY, JSON.stringify(notifiedMap));
  }
}

/**
   * Manually test a subscription notification immediately using Web Notification API
   */
export function testSubscriptionNotification(sub: SubscriptionRule): boolean {
  if (!('Notification' in window)) {
    alert('Browser Notifications are not supported in this environment.');
    return false;
  }

  if (Notification.permission !== 'granted') {
    requestNotificationPermission().then((perm) => {
      if (perm === 'granted') {
        fireTestNotification(sub);
      } else {
        alert('Notification permission was denied. Please enable notifications in your browser settings.');
      }
    });
    return false;
  }

  fireTestNotification(sub);
  return true;
}

function fireTestNotification(sub: SubscriptionRule) {
  try {
    new Notification(`🔔 [TEST] Due in 24h: ${sub.title}`, {
      body: `Test reminder: ${sub.amount.toLocaleString()} ${sub.assetSymbol} due to ${sub.provider} tomorrow.`,
      icon: '/favicon.ico',
      tag: `test_sub_${sub.id}`
    });
  } catch (err) {
    console.error('Test notification failed:', err);
  }
}
