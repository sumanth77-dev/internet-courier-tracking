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

// Attach io to express app
app.set("io", io);

const path = require("path");

const { authenticate } = require("./middleware/authMiddleware");
const { getDeliveryProofPhoto } = require("./controllers/shipmentController");

// Middleware
app.use(cors());
app.use(express.json());

// Protected delivery proof photo access (authorizes customer owner, assigned courier, or admin)
app.get("/uploads/delivery-proofs/:filename", authenticate, getDeliveryProofPhoto);
app.get("/api/uploads/delivery-proofs/:filename", authenticate, getDeliveryProofPhoto);

// Static file fallback for general uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/shipments", shipmentRoutes);

// Health check route
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SkyRoute Real-Time Courier Tracking API is running",
    });
});

// Initialize Socket.IO Live GPS Tracking Handlers
initializeTrackingSocket(io);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        httpServer.listen(PORT, "0.0.0.0",() => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();

module.exports = { app, httpServer, io };