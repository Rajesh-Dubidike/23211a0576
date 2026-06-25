# Stage 1

The Priority Inbox ranks notifications using three signals:

1. Unread status: unread notifications are always shown before notifications the user has already viewed.
2. Notification type: `Placement` is highest priority, followed by `Result`, then `Event`.
3. Recency: newer notifications are shown before older notifications when unread status and type are equal.

The implementation keeps viewed notification IDs in browser `localStorage`, which is enough for the given frontend-only evaluation because the API is the source of notification data and no database storage is required. New notifications continue to appear in the top 10 efficiently because the ranking function sorts incoming API data by a numeric score and slices the first `n` records.

For larger production volumes, the same priority formula can be maintained with a bounded priority queue of size `n`. Each incoming notification would be scored once, compared against the current lowest-ranked item in the queue, and inserted only if it belongs in the top `n`. That keeps updates efficient without repeatedly sorting the full notification history.

Core scoring order:

```text
score = unread_weight + type_weight + timestamp

unread_weight: unread > viewed
type_weight: Placement > Result > Event
timestamp: newer > older
```

The Stage 2 frontend reuses this same logic in `src/notificationPriority.js` and applies it to both the Priority view and the All Notifications view.
