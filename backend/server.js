const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load .env from backend directory (or root if present)
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

const connectDB = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const shipmentRoutes = require("./routes/shipmentRoutes");
const { initializeTrackingSocket } = require("./sockets/trackingSocket");
const { authenticate } = require("./middleware/authMiddleware");
const { getDeliveryProofPhoto } = require("./controllers/shipmentController");

const app = express();
const httpServer = http.createServer(app);

// Ensure local uploads directories exist on server boot
const uploadsDir = path.join(__dirname, "uploads");
const proofsDir = path.join(uploadsDir, "delivery-proofs");
if (!fs.existsSync(proofsDir)) {
  fs.mkdirSync(proofsDir, { recursive: true });
}

// -------------------------------------------------------------
// Production CORS Configuration
// Supports CLIENT_URL and CLIENT_ORIGIN (single or comma-separated)
// Supports credentials safely without wildcard origin rejections
// -------------------------------------------------------------
const rawAllowedOrigins = process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || "";
const configuredOrigins = rawAllowedOrigins
  .split(",")
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost:5000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

const allowedOriginsSet = new Set([...configuredOrigins, ...defaultAllowedOrigins]);

const isOriginAllowed = (origin) => {
  // Allow requests without Origin (e.g. mobile apps, server-to-server, curl, Render health probes)
  if (!origin) return true;

  const normalized = origin.trim().replace(/\/+$/, "");

  // If wildcard configured or explicitly allowed
  if (configuredOrigins.includes("*")) return true;
  if (allowedOriginsSet.has(normalized)) return true;

  // Seamless support for Vercel preview/production subdomains
  try {
    const url = new URL(normalized);
    if (url.hostname.endsWith(".vercel.app")) {
      return true;
    }
  } catch (e) {
    // Ignore invalid URL parse
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Express CORS middleware
app.use(cors(corsOptions));
app.use(express.json());

// -------------------------------------------------------------
// Socket.IO Setup (Shares HTTP server with Express)
// -------------------------------------------------------------
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Socket origin ${origin} not allowed by CORS`));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Attach io to express app
app.set("io", io);

// -------------------------------------------------------------
// Delivery Proof Photo Routes & Static Fallback
// -------------------------------------------------------------
// Protected delivery proof photo access (authorizes customer owner, assigned courier, or admin)
app.get("/uploads/delivery-proofs/:filename", authenticate, getDeliveryProofPhoto);
app.get("/api/uploads/delivery-proofs/:filename", authenticate, getDeliveryProofPhoto);

// Static file fallback for general uploads
app.use("/uploads", express.static(uploadsDir));
app.use("/api/uploads", express.static(uploadsDir));

// -------------------------------------------------------------
// Core Routes & Health Checks
// -------------------------------------------------------------
// Root ping for Render cloud status checks
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SkyRoute API Server is running",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SkyRoute Real-Time Courier Tracking API is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/shipments", shipmentRoutes);

// Global error handler
app.use((err, req, res, next) => {
  if (err && err.message && err.message.includes("not allowed by CORS")) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }
  console.error("Unhandled server error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// Initialize Socket.IO Live GPS Tracking Handlers
initializeTrackingSocket(io);

// -------------------------------------------------------------
// Start HTTP Server
// -------------------------------------------------------------
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`SkyRoute Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();

module.exports = { app, httpServer, io };
