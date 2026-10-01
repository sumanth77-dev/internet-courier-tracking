const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");
const { initializeTrackingSocket } = require("./sockets/trackingSocket");

dotenv.config();

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO on the HTTP server with configurable CORS
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_ORIGIN || "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/shipments", shipmentRoutes);

// Health check route
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Courier Tracking API is running",
    });
});

// Initialize Socket.IO Live GPS Tracking Handlers
initializeTrackingSocket(io);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();

module.exports = { app, httpServer, io };