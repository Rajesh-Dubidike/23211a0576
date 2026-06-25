import axios from "axios";
import { logFrontend } from "./loggerClient.js";
import { normalizeNotification } from "./notificationPriority.js";

const api = axios.create({
  baseURL: "/evaluation-service",
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const token =
    import.meta.env.VITE_AFFORDMED_ACCESS_TOKEN ||
    import.meta.env.VITE_ACCESS_TOKEN ||
    import.meta.env.VITE_LOG_ACCESS_TOKEN;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function fetchNotifications({ limit, page, notificationType } = {}) {
  await logFrontend(
    "info",
    "api",
    `fetching notifications page=${page ?? 1} limit=${limit ?? "all"} type=${notificationType || "all"}`
  );

  try {
    const response = await api.get("/notifications", {
      params: {
        limit,
        page,
        notification_type: notificationType || undefined,
      },
    });

    const notifications = (response.data?.notifications || []).map(normalizeNotification);
    await logFrontend("info", "api", `received ${notifications.length} notifications from API`);
    return notifications;
  } catch (error) {
    const status = error.response?.status;
    await logFrontend(
      "error",
      "api",
      `notification fetch failed${status ? ` status=${status}` : ""}: ${error.message}`
    );
    throw error;
  }
}
