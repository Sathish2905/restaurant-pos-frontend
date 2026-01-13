import { io } from "socket.io-client";

const getSocketUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    // Remove /api and any trailing slash
    return apiUrl.trim().replace(/\/api\/?$/, '').replace(/\/$/, '');
}

const SOCKET_URL = getSocketUrl();

console.log("[Socket] Initializing with URL:", SOCKET_URL);

export const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 2000,
    transports: ["websocket", "polling"],
});

socket.onAny((event, ...args) => {
    console.log(`[Socket DEBUG] Received Event: ${event}`, args);
});

socket.on("connect", () => {
    console.log("[Socket] Connected to server:", SOCKET_URL, "ID:", socket.id);
});

socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected from server. Reason:", reason);
});

socket.on("connect_error", (error) => {
    console.error("[Socket] Connection error:", error.message);
    console.log("[Socket] Current URL attempted:", SOCKET_URL);
});

socket.on("reconnect_attempt", (attempt) => {
    console.log("[Socket] Reconnect attempt:", attempt);
});
