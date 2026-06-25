const isBrowser = typeof window !== "undefined";
const LOG_URL = isBrowser
    ? "/evaluation-service/logs"
    : "http://4.224.186.213/evaluation-service/logs";

const ALLOWED_STACKS = new Set(["backend", "frontend"]);
const ALLOWED_LEVELS = new Set(["debug", "info", "warn", "error", "fatal"]);
const BACKEND_PACKAGES = new Set([
    "cache",
    "controller",
    "cron_job",
    "db",
    "domain",
    "handler",
    "repository",
    "route",
    "service",
]);
const FRONTEND_PACKAGES = new Set(["api", "component", "hook", "page", "state", "style"]);
const SHARED_PACKAGES = new Set(["auth", "config", "middleware", "utils"]);

function getAuthToken() {
    if (typeof import.meta !== "undefined" && import.meta.env) {
        return (
            import.meta.env.VITE_AFFORDMED_ACCESS_TOKEN ||
            import.meta.env.VITE_LOG_ACCESS_TOKEN ||
            import.meta.env.VITE_ACCESS_TOKEN ||
            ""
        );
    }

    if (typeof process === "undefined") {
        return "";
    }

    return (
        process.env.AFFORDMED_ACCESS_TOKEN ||
        process.env.LOG_ACCESS_TOKEN ||
        process.env.ACCESS_TOKEN ||
        ""
    );
}

function isPackageAllowed(stack, packageName) {
    return (
        SHARED_PACKAGES.has(packageName) ||
        (stack === "backend" && BACKEND_PACKAGES.has(packageName)) ||
        (stack === "frontend" && FRONTEND_PACKAGES.has(packageName))
    );
}

function validateLogPayload(stack, level, packageName, message) {
    if (!ALLOWED_STACKS.has(stack)) {
        throw new Error(`Invalid log stack: ${stack}`);
    }

    if (!ALLOWED_LEVELS.has(level)) {
        throw new Error(`Invalid log level: ${level}`);
    }

    if (!isPackageAllowed(stack, packageName)) {
        throw new Error(`Invalid log package '${packageName}' for ${stack}`);
    }

    if (typeof message !== "string" || message.trim().length === 0) {
        throw new Error("Log message must be a non-empty string");
    }
}

export async function Log(stack, level, packageName, message) {
    const normalizedStack = String(stack).toLowerCase();
    const normalizedLevel = String(level).toLowerCase();
    const normalizedPackage = String(packageName).toLowerCase();

    validateLogPayload(normalizedStack, normalizedLevel, normalizedPackage, message);

    const token = getAuthToken();
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
        const response = await fetch(LOG_URL, {
            method: "POST",
            headers,
            body: JSON.stringify({
                stack: normalizedStack,
                level: normalizedLevel,
                package: normalizedPackage,
                message,
            }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.message || response.statusText);
        }

        return data;
    } catch (err) {
        throw new Error(`Logging failed: ${err.message}`);
    }
}
