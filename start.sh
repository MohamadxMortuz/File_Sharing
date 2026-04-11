#!/bin/bash

echo "🚀 Starting Secure File Sharing System..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."
    mongod --fork --logpath /tmp/mongodb.log --dbpath /tmp/mongodb-data
fi

# Start Backend
echo "📦 Installing backend dependencies..."
cd backend
npm install

echo "🔧 Starting backend server..."
node server.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start Frontend
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install

echo "🎨 Starting frontend..."
npm start

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
