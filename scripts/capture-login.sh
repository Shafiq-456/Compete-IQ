#!/bin/bash
# Capture UI screenshots of the full FinTech flow
set +e

pkill -f "node server" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 2

# Start server
setsid bash -c 'cd /home/z/my-project/.next/standalone && exec node server.js' > /tmp/prod.log 2>&1 < /dev/null &
sleep 5
ss -tlnp 2>/dev/null | grep -q 3000 && echo "✓ Server running" || { echo "DEAD"; exit 1; }

mkdir -p /home/z/my-project/download/stages-screenshots

# First logout any existing session
agent-browser close 2>/dev/null
agent-browser open http://127.0.0.1:3000/ 2>&1 | tail -2
sleep 5

# Should show login screen
agent-browser get title 2>&1 | head -1
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/01-login.png 2>/dev/null
echo "✓ 01-login captured"

# Look at the page to see what's shown
echo ""
echo "=== Page state ==="
agent-browser snapshot -i 2>&1 | head -20

# Kill server
pkill -f "node server" 2>/dev/null
echo "Done"
