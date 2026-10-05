#!/usr/bin/env bash
# Chạy trong `firebase emulators:exec`: khởi động server trỏ vào emulator rồi chạy test trình duyệt.
set -u
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8085 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
export FIREBASE_PROJECT_ID=$(node -p "require('./firebase-applet-config.json').projectId")
export PORT=${PORT:-3995}
STATIC_DIR=dist-e2e NODE_ENV=production GEMINI_API_KEY=test node --import tsx server.ts > e2e-server.log 2>&1 &
SRV=$!
for i in $(seq 1 60); do curl -s -o /dev/null "localhost:$PORT" && break; sleep 0.5; done
node tests/e2e/rooms.mjs
RC=$?
node tests/e2e/assignment-editor.mjs || RC=1
kill $SRV
exit $RC
