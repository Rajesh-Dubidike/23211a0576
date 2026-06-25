const TYPE_WEIGHT = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

export function normalizeNotification(notification) {
  return {
    id: notification.ID || notification.id,
    type: notification.Type || notification.type,
    message: notification.Message || notification.message,
    timestamp: notification.Timestamp || notification.timestamp,
  };
}

export function getNotificationScore(notification, viewedIds = new Set()) {
  const recencyScore = new Date(notification.timestamp).getTime() || 0;
  const unreadScore = viewedIds.has(notification.id) ? 0 : 1_000_000_000_000_000;
  const typeScore = (TYPE_WEIGHT[notification.type] || 0) * 1_000_000_000_000;

  return unreadScore + typeScore + recencyScore;
}

export function sortNotificationsByPriority(notifications, viewedIds = new Set()) {
  return [...notifications].sort((left, right) => {
    const rightScore = getNotificationScore(right, viewedIds);
    const leftScore = getNotificationScore(left, viewedIds);

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return String(left.id).localeCompare(String(right.id));
  });
}

export function getTopPriorityNotifications(notifications, limit = 10, viewedIds = new Set()) {
  return sortNotificationsByPriority(notifications, viewedIds).slice(0, limit);
}
