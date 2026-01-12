import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
    : "http://localhost:5000";

export const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    transports: ["websocket", "polling"], // Try websocket first
});

socket.on("connect", () => {
    console.log("[Socket] Connected to server:", SOCKET_URL);
});

socket.on("disconnect", () => {
    console.log("[Socket] Disconnected from server");
});

socket.on("connect_error", (error) => {
    console.error("[Socket] Connection error:", error.message);
});
