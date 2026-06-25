import {
  Alert,
  AppBar,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  CssBaseline,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  createTheme,
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import InboxIcon from "@mui/icons-material/Inbox";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import RefreshIcon from "@mui/icons-material/Refresh";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useEffect, useMemo, useState } from "react";
import { fetchNotifications } from "./api.js";
import { logFrontend } from "./loggerClient.js";
import { getTopPriorityNotifications, sortNotificationsByPriority } from "./notificationPriority.js";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1c5d99",
    },
    secondary: {
      main: "#1b998b",
    },
    background: {
      default: "#f6f8fb",
      paper: "#ffffff",
    },
    warning: {
      main: "#d9822b",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "Inter, Arial, sans-serif",
    h1: {
      fontSize: "2rem",
      fontWeight: 700,
      letterSpacing: 0,
    },
    h2: {
      fontSize: "1.2rem",
      fontWeight: 700,
      letterSpacing: 0,
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
});

const LIMIT_OPTIONS = [10, 15, 20];
const TYPE_OPTIONS = ["All", "Placement", "Result", "Event"];
const VIEWED_STORAGE_KEY = "campus-notification-viewed-ids";

function readViewedIds() {
  try {
    return new Set(JSON.parse(localStorage.getItem(VIEWED_STORAGE_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveViewedIds(viewedIds) {
  localStorage.setItem(VIEWED_STORAGE_KEY, JSON.stringify([...viewedIds]));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTypeColor(type) {
  if (type === "Placement") return "primary";
  if (type === "Result") return "secondary";
  return "warning";
}

function NotificationRow({ notification, viewed, onMarkViewed, rank }) {
  return (
    <Paper className={`notification-row ${viewed ? "viewed" : ""}`} elevation={0}>
      <Box className="rank">{rank}</Box>
      <Box className="notification-copy">
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip size="small" color={getTypeColor(notification.type)} label={notification.type} />
          {!viewed && <Chip size="small" variant="outlined" color="success" label="New" />}
          <Typography variant="caption" color="text.secondary">
            {formatDate(notification.timestamp)}
          </Typography>
        </Stack>
        <Typography className="message" variant="body1">
          {notification.message}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {notification.id}
        </Typography>
      </Box>
      <Tooltip title={viewed ? "Already viewed" : "Mark as viewed"}>
        <span>
          <IconButton
            aria-label="mark as viewed"
            color="primary"
            disabled={viewed}
            onClick={() => onMarkViewed(notification.id)}
          >
            <VisibilityIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Paper>
  );
}

export default function App() {
  const [notifications, setNotifications] = useState([]);
  const [viewedIds, setViewedIds] = useState(readViewedIds);
  const [tab, setTab] = useState("priority");
  const [limit, setLimit] = useState(10);
  const [notificationType, setNotificationType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const unreadCount = notifications.filter((item) => !viewedIds.has(item.id)).length;

  const visibleNotifications = useMemo(() => {
    const filtered =
      notificationType === "All"
        ? notifications
        : notifications.filter((item) => item.type === notificationType);

    if (tab === "priority") {
      return getTopPriorityNotifications(filtered, limit, viewedIds);
    }

    return sortNotificationsByPriority(filtered, viewedIds);
  }, [limit, notificationType, notifications, tab, viewedIds]);

  async function loadNotifications() {
    setLoading(true);
    setError("");

    try {
      const data = await fetchNotifications({
        limit: tab === "priority" ? limit : undefined,
        page: 1,
        notificationType: notificationType === "All" ? undefined : notificationType,
      });
      setNotifications(data);
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || fetchError.message);
    } finally {
      setLoading(false);
    }
  }

  function markViewed(id) {
    const nextViewedIds = new Set(viewedIds);
    nextViewedIds.add(id);
    setViewedIds(nextViewedIds);
    saveViewedIds(nextViewedIds);
    logFrontend("info", "state", `marked notification viewed id=${id}`);
  }

  function markAllViewed() {
    const nextViewedIds = new Set([...viewedIds, ...visibleNotifications.map((item) => item.id)]);
    setViewedIds(nextViewedIds);
    saveViewedIds(nextViewedIds);
    logFrontend("info", "state", `marked ${visibleNotifications.length} visible notifications viewed`);
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    logFrontend("debug", "page", `view changed tab=${tab} type=${notificationType} limit=${limit}`);
  }, [limit, notificationType, tab]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="app-shell">
        <AppBar position="sticky" elevation={0} color="inherit">
          <Toolbar className="topbar">
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <NotificationsActiveIcon color="primary" />
              <Box>
                <Typography variant="h1">Campus Notifications</Typography>
                <Typography variant="body2" color="text.secondary">
                  Priority inbox for placements, results, and events
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Tooltip title="Unread notifications">
                <Badge badgeContent={unreadCount} color="error">
                  <InboxIcon color="action" />
                </Badge>
              </Tooltip>
              <Tooltip title="Refresh">
                <IconButton aria-label="refresh" onClick={loadNotifications}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" className="content">
          <Paper className="controls" elevation={0}>
            <Tabs value={tab} onChange={(_, value) => setTab(value)} aria-label="notification views">
              <Tab value="priority" label="Priority" />
              <Tab value="all" label="All Notifications" />
            </Tabs>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
              <FormControl size="small" className="filter-control">
                <InputLabel id="type-label">Type</InputLabel>
                <Select
                  labelId="type-label"
                  value={notificationType}
                  label="Type"
                  onChange={(event) => setNotificationType(event.target.value)}
                >
                  {TYPE_OPTIONS.map((type) => (
                    <MenuItem value={type} key={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" className="filter-control">
                <InputLabel id="limit-label">Top</InputLabel>
                <Select
                  labelId="limit-label"
                  value={limit}
                  label="Top"
                  onChange={(event) => setLimit(Number(event.target.value))}
                  disabled={tab !== "priority"}
                >
                  {LIMIT_OPTIONS.map((option) => (
                    <MenuItem value={option} key={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button startIcon={<DoneAllIcon />} variant="contained" onClick={markAllViewed}>
                Mark Visible Viewed
              </Button>
            </Stack>
          </Paper>

          {error && (
            <Alert severity="error" className="status-alert">
              {error}
            </Alert>
          )}

          <Paper className="inbox-panel" elevation={0}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
              <Box>
                <Typography variant="h2">
                  {tab === "priority" ? `Top ${limit} Priority Notifications` : "All Notifications"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unread items are ranked first, then type priority, then recency.
                </Typography>
              </Box>
              {loading && <CircularProgress size={24} />}
            </Stack>
            <Divider />
            <Stack spacing={1.25}>
              {!loading && visibleNotifications.length === 0 && (
                <Alert severity="info">No notifications match the current filters.</Alert>
              )}
              {visibleNotifications.map((notification, index) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  viewed={viewedIds.has(notification.id)}
                  onMarkViewed={markViewed}
                  rank={index + 1}
                />
              ))}
            </Stack>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
