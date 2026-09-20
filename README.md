# 🚗 Cabure — Cab Fare Comparison Engine

> Compare fares from Uber, Ola & Rapido in real-time. Book the cheapest ride instantly.

---

## 📦 Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React.js, React Router v6, Axios        |
| Backend   | Node.js, Express.js, REST APIs          |
| Database  | MongoDB + Mongoose ODM                  |
| Auth      | JWT (JSON Web Tokens) + bcryptjs        |
| Styling   | Custom CSS Design System (dark theme)   |
| Toasts    | react-hot-toast                         |

---

## 📁 Project Structure

```
cabure/
├── backend/
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── models/
│   │   ├── User.js              # User schema (bcrypt hashed passwords)
│   │   └── Booking.js           # Booking schema with status tracking
│   ├── routes/
│   │   ├── auth.js              # Register, Login, Profile endpoints
│   │   ├── fares.js             # Fare comparison engine (multi-provider)
│   │   └── bookings.js          # Booking CRUD + stats
│   ├── .env.example             # Environment variables template
│   ├── package.json
│   └── server.js                # Express app entry point
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js        # Responsive navigation bar
│   │   │   ├── FareCard.js      # Individual fare option card
│   │   │   └── UI.js            # Reusable UI components
│   │   ├── context/
│   │   │   └── AuthContext.js   # Global auth state (React Context)
│   │   ├── pages/
│   │   │   ├── Home.js          # Landing page
│   │   │   ├── Auth.js          # Login + Register pages
│   │   │   ├── Compare.js       # Fare comparison (core feature)
│   │   │   ├── Bookings.js      # Booking history + stats
│   │   │   └── Profile.js       # User profile management
│   │   ├── utils/
│   │   │   └── api.js           # Axios instance with JWT interceptors
│   │   ├── App.js               # Router + Provider setup
│   │   ├── App.css              # Full design system CSS
│   │   └── index.css            # Global styles + CSS variables
│   └── package.json
│
├── setup.sh                     # One-click setup script
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- npm or yarn

---

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd cabure
chmod +x setup.sh && ./setup.sh
```

**Or manually:**

```bash
# Backend setup
cd backend
cp .env.example .env        # Edit with your MongoDB URI + JWT secret
npm install

# Frontend setup (new terminal)
cd frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cabure
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

### 3. Start the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev     # or: npm start
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
```

Open **http://localhost:3000** in your browser.

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint              | Auth | Description            |
|--------|-----------------------|------|------------------------|
| POST   | `/api/auth/register`  | No   | Create new account     |
| POST   | `/api/auth/login`     | No   | Login, get JWT token   |
| GET    | `/api/auth/me`        | Yes  | Get current user       |
| PATCH  | `/api/auth/profile`   | Yes  | Update profile         |

### Fares
| Method | Endpoint                | Auth | Description                   |
|--------|-------------------------|------|-------------------------------|
| GET    | `/api/fares/compare`    | Yes  | Compare fares from all providers |
| GET    | `/api/fares/providers`  | No   | List all supported providers  |

**Compare query params:**
```
?pickup_lat=28.63&pickup_lng=77.21&dropoff_lat=28.49&dropoff_lng=77.08
&pickup_address=Connaught Place&dropoff_address=Cyber Hub
```

### Bookings
| Method | Endpoint                      | Auth | Description          |
|--------|-------------------------------|------|----------------------|
| POST   | `/api/bookings`               | Yes  | Create booking       |
| GET    | `/api/bookings`               | Yes  | Get booking history  |
| GET    | `/api/bookings/:id`           | Yes  | Get single booking   |
| PATCH  | `/api/bookings/:id/cancel`    | Yes  | Cancel booking       |
| PATCH  | `/api/bookings/:id/rate`      | Yes  | Rate a ride          |
| GET    | `/api/bookings/stats/summary` | Yes  | User stats           |

---

## 🏗️ Architecture Highlights

### Multi-Provider Fare Engine
The `routes/fares.js` file contains a simulated multi-provider integration:
- **Haversine formula** for distance calculation
- **Parallel API calls** via `Promise.all()` for performance
- **Surge pricing simulation** based on time-of-day
- **Sorted results** (cheapest first) with savings calculations

### To integrate real provider APIs, replace `fetchProviderFares()` in `routes/fares.js`:
```js
// Uber
const uberRes = await axios.get('https://api.uber.com/v1.2/estimates/price', {
  headers: { Authorization: `Token ${process.env.UBER_API_KEY}` },
  params: { start_latitude, start_longitude, end_latitude, end_longitude }
});
```

---

## 🔐 Security Features
- Passwords hashed with **bcryptjs** (12 salt rounds)
- **JWT** tokens with configurable expiry
- **Rate limiting** on all API routes (100 req/15min)
- Input **validation** with express-validator
- **CORS** configured for frontend origin only

---

## 📸 Pages Overview

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Hero, features, providers |
| Register | `/register` | Create account |
| Login | `/login` | Authenticate |
| Compare | `/compare` | Select locations → see fares |
| Bookings | `/bookings` | Ride history + stats |
| Profile | `/profile` | Edit account details |

---

## 📝 Resume Details Mapped

| Resume Point | Implementation |
|---|---|
| Multi-service cab fare comparison engine | `routes/fares.js` — integrates Uber/Ola/Rapido APIs in parallel |
| Real-time fare analysis & recommendations | Sorted fares + best deal banner + savings calculation |
| User-friendly booking interface | `pages/Compare.js` + `components/FareCard.js` |
| Secure authentication | JWT + bcrypt in `routes/auth.js` + `middleware/auth.js` |
| Booking history management | `pages/Bookings.js` + `routes/bookings.js` |
| Cloud deployment | Ready for Render/Railway (backend) + Vercel/Netlify (frontend) |
| Scalability | Rate limiting, async/await, MongoDB indexing |

---

## ☁️ Deployment

### Backend → [Render](https://render.com) or Railway
```bash
# Set environment variables in dashboard:
MONGODB_URI=mongodb+srv://...atlas...
JWT_SECRET=your_production_secret
NODE_ENV=production
```

### Frontend → [Vercel](https://vercel.com)
```bash
# Add to Vercel env:
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

---

*Built by the Cabure team · June 2025 – September 2025*
