# SkyRoute — Real-Time Courier Tracking and Delivery Management Platform

> **Tagline:** Every Delivery. Every Mile. In Sight.  
> **Official Product:** SkyRoute  
> **Architecture:** React (Vite) + Node.js (Express) + MongoDB + Socket.IO + Leaflet GIS

---

## 🚀 Overview

**SkyRoute** is an enterprise-grade real-time courier tracking and logistics delivery management platform engineered for precision, transparency, and operational velocity. SkyRoute connects senders, dispatchers, and couriers within a unified cloud system featuring interactive Leaflet road maps, live sub-second GPS coordinate streaming, two-factor Proof of Delivery (OTP + photo verification), and comprehensive role-restricted management consoles.

---

## 🌟 Key Platform Features

### 1. Public Portal & Instant Tracking Search
- Professional modern logistics landing page.
- Direct shipment tracking lookup by tracking ID (e.g. `TRK-8921`).
- Interactive Live Tracking Preview with animated Leaflet vehicle telemetry and simulation controls.
- Clear separation between public marketing/search flows and authenticated role portals.

### 2. Multi-Role Portals
- **Customer Portal:** Book new parcel shipments with interactive map pin-drop address validation, view package journey history, access dynamic 6-digit delivery OTPs, and inspect verified digital Proof of Delivery receipts.
- **Courier Portal:** Field delivery interface with active order manifests, road-following turn-by-turn route maps, built-in GPS route simulator, one-tap status updates, camera/photo upload, and recipient OTP verification.
- **Administrator Console:** Central logistics command center to oversee fleet activities, assign shipments to available couriers, override delivery statuses, and audit complete lifecycle timelines.

### 3. Real-Time GPS Tracking & Map Navigation
- OpenStreetMap and Leaflet integration with smooth vehicle heading and bearing calculation.
- Live WebSockets powered by Socket.IO for sub-second coordinate broadcasts.
- OSRM route computation and fallback road geometry rendering.

### 4. Secure Proof of Delivery (POD)
- Time-limited 6-digit OTP generated securely by the verified shipment recipient.
- Courier photographic drop-off upload with file-type verification.
- Tamper-proof milestone recording with cryptographic timestamps.

---

## 🎨 Official Brand Identity & Design System

- **Official Brand Name:** SkyRoute
- **Tagline:** *Every Delivery. Every Mile. In Sight.*
- **Color Palette:**
  - **Deep Navy:** `#142B45` (Primary identity, headers, dark surfaces)
  - **Steel Blue:** `#245B78` (Secondary accents, subtitles, borders)
  - **Teal:** `#18A6A0` (Key actions, active telemetry, icons, highlights)
  - **Soft Background:** `#F4F6F8` (Clean contrast canvas)
  - **White:** `#FFFFFF` (Card surfaces, clean modals)
  - **Main Text:** `#182433` (High legibility primary typography)
- Solid colors only with subtle borders and shadows. No glossy gradient backgrounds.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **Maps:** Leaflet & React-Leaflet
- **Real-Time Client:** Socket.IO Client
- **Icons:** Lucide React
- **Routing:** React Router v7

### Backend
- **Runtime:** Node.js + Express
- **Database:** MongoDB via Mongoose
- **Authentication:** JWT (JSON Web Tokens) + BcryptJS
- **Real-Time Server:** Socket.IO Server
- **File Uploads:** Multer with protected file streaming routes

---

## 📂 Project Directory Structure

```
internet-courier-tracking/
├── backend/
│   ├── config/             # Database connection setup
│   ├── controllers/        # Auth & Shipment business logic
│   ├── middleware/         # Auth JWT verification & Multer uploads
│   ├── models/             # Mongoose schemas (User, Shipment, Location, OTP, POD)
│   ├── routes/             # REST API endpoints (/api/auth, /api/shipments)
│   ├── scripts/            # Seed utilities for development accounts
│   ├── sockets/            # Socket.IO live GPS tracking handlers
│   ├── uploads/            # Delivery proof photos storage
│   └── server.js           # Express + HTTP + Socket.IO entry point
├── frontend/
│   ├── public/             # SkyRoute SVG icons & static assets
│   ├── src/
│   │   ├── assets/         # Logistics images & graphic resources
│   │   ├── components/     # UI components (booking, tracking, layout, common)
│   │   │   ├── common/     # BrandLogo, Button, StatsCard, EmptyState, etc.
│   │   │   ├── landing/    # Public landing page sections (Hero, Features, Preview, etc.)
│   │   │   ├── layout/     # DashboardLayout, Sidebar, TopNavbar
│   │   │   └── tracking/   # LiveTrackingMap, CourierVehicleMarker, etc.
│   │   ├── context/        # AuthContext session management
│   │   ├── hooks/          # useTrackingSocket, useSmoothVehicleTracking, useGpsSimulator
│   │   ├── pages/          # LandingPage, Login, Register, Dashboards
│   │   └── services/       # Axios API client, Geocoding, OSRM routing
│   └── package.json
└── README.md
```

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI

### 1. Backend Setup
```bash
cd backend
npm install
# Configure your .env file (PORT=5000, MONGODB_URI=mongodb://localhost:27017/courier_tracking_db, JWT_SECRET=...)
npm run seed:development-accounts  # Creates demo admin and courier accounts
npm run dev                        # Starts server on port 5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev                        # Starts Vite dev server on http://localhost:5173
```

### 3. Production Build
```bash
cd frontend
npm run build                      # Compiles production-optimized assets into /dist
```

---

## 🔒 Security & Role Model

- **Public:** Landing page, product features, interactive simulation preview, login, and registration.
- **Customer:** Book shipments, monitor owned parcels, generate delivery OTPs.
- **Courier:** View assigned deliveries, stream live GPS telemetry, capture delivery photos, verify OTPs.
- **Admin:** Dispatch overview, courier assignment, system monitoring, status override.

---

## 📄 License
SkyRoute Technologies Pvt. Ltd. All rights reserved.

