#!/bin/bash
# Single bash session: start server + run all tests + capture screenshots + kill server
set +e

pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "node server" 2>/dev/null
sleep 3

# Start server (will be killed at end of script)
cd /home/z/my-project/.next/standalone
node server.js > /tmp/prod.log 2>&1 &
SERVERPID=$!
sleep 4
if ! ss -tlnp 2>/dev/null | grep -q 3000; then
  echo "FAILED to start server"
  cat /tmp/prod.log
  exit 1
fi
echo "✓ Server running (PID $SERVERPID)"

cd /home/z/my-project

# Close any existing browser
agent-browser close 2>/dev/null
sleep 2

# Open browser
agent-browser open http://127.0.0.1:3000/ 2>&1 | tail -1
sleep 5
agent-browser get title 2>&1

# Click Try demo
agent-browser snapshot -i > /tmp/snap.txt 2>&1
DEMO_REF=$(grep -E 'button "Try demo' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
agent-browser click @$DEMO_REF 2>&1 | tail -1
sleep 4
echo ""
echo "=== After demo login ==="
agent-browser eval "document.querySelector('h1')?.textContent" 2>&1

# Capture dashboard
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/demo-01-dashboard.png 2>&1 | tail -1

# Navigate to Chat
agent-browser snapshot -i > /tmp/snap.txt 2>&1
CHAT_REF=$(grep -E 'button "Chat Assistant"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
agent-browser click @$CHAT_REF 2>&1 | tail -1
sleep 4
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/demo-02-chat.png 2>&1 | tail -1

# Navigate to SWOT
agent-browser snapshot -i > /tmp/snap.txt 2>&1
SWOT_REF=$(grep -E 'button "SWOT"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
agent-browser click @$SWOT_REF 2>&1 | tail -1
sleep 4
# Force regenerate to get fresh SWOT with howToRespond
agent-browser snapshot -i > /tmp/snap.txt 2>&1
REGEN_REF=$(grep -E 'button "Regenerate"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
if [ -n "$REGEN_REF" ]; then
  agent-browser click @$REGEN_REF 2>&1 | tail -1
  echo "  SWOT regenerating (15s)..."
  sleep 15
fi
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/demo-04-swot.png 2>&1 | tail -1

# Navigate to Digest
agent-browser snapshot -i > /tmp/snap.txt 2>&1
DIGEST_REF=$(grep -E 'button "Weekly Digest"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
agent-browser click @$DIGEST_REF 2>&1 | tail -1
sleep 4
agent-browser eval "document.querySelector('h1')?.textContent" 2>&1
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/demo-05-digest.png 2>&1 | tail -1

# Navigate to Alerts
agent-browser snapshot -i > /tmp/snap.txt 2>&1
ALERTS_REF=$(grep -E 'button "Alerts ' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
agent-browser click @$ALERTS_REF 2>&1 | tail -1
sleep 3
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/demo-06-alerts.png 2>&1 | tail -1

# Navigate to Competitors
agent-browser snapshot -i > /tmp/snap.txt 2>&1
COMP_REF=$(grep -E 'button "Competitors"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
agent-browser click @$COMP_REF 2>&1 | tail -1
sleep 3
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/demo-07-competitors.png 2>&1 | tail -1

echo ""
echo "=== Screenshots ==="
ls -la /home/z/my-project/download/stages-screenshots/demo-*.png

# Kill server
kill $SERVERPID 2>/dev/null
wait 2>/dev/null
echo "Done"
