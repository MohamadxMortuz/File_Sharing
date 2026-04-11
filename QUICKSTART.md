# Quick Start Guide

## Option 1: Automatic Start (Recommended)

Run this single command:
```bash
./start.sh
```

## Option 2: Manual Start

### Step 1: Start MongoDB
```bash
mongod
```

### Step 2: Start Backend (in new terminal)
```bash
cd backend
npm install
node server.js
```

### Step 3: Start Frontend (in new terminal)
```bash
cd frontend
npm install
npm start
```

## Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## First Time Setup

1. Register a new account at http://localhost:3000/register
2. Login with your credentials
3. Upload files from the dashboard
4. Copy share links and test file sharing

## Troubleshooting

**MongoDB not found:**
```bash
brew install mongodb-community
brew services start mongodb-community
```

**Port already in use:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Dependencies error:**
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```
