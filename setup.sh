#!/bin/bash
set -e

echo "🚗 Setting up Cabure..."

# Backend
echo "📦 Installing backend dependencies..."
cd backend
cp .env.example .env
npm install
echo "✅ Backend ready"
cd ..

# Frontend
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
echo "✅ Frontend ready"
cd ..

echo ""
echo "════════════════════════════════════════"
echo "  ✅ Cabure setup complete!"
echo "════════════════════════════════════════"
echo ""
echo "  1. Edit backend/.env with your MongoDB URI"
echo ""
echo "  2. Start backend:   cd backend && npm run dev"
echo "  3. Start frontend:  cd frontend && npm start"
echo ""
echo "  🌐 Open: http://localhost:3000"
echo "════════════════════════════════════════"
