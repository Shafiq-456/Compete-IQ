#!/bin/bash
# Capture screenshots of the running app for the user to see
set +e

pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "node server" 2>/dev/null
sleep 2

# Start server
cd /home/z/my-project/.next/standalone
node server.js > /tmp/prod.log 2>&1 &
SERVERPID=$!
sleep 4
ss -tlnp 2>/dev/null | grep -q 3000 && echo "✓ Server running" || { echo "DEAD"; exit 1; }

cd /home/z/my-project
mkdir -p download/output-demo
agent-browser close 2>/dev/null
sleep 2

# Open browser
agent-browser open http://127.0.0.1:3000/ 2>&1 | tail -1
sleep 5

# 1. Login screen
echo "=== 1. Login screen ==="
agent-browser screenshot --full download/output-demo/01-login.png 2>&1 | tail -1

# Login as demo
agent-browser snapshot -i > /tmp/snap.txt 2>&1
DEMO_REF=$(grep 'Try demo' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
agent-browser click @$DEMO_REF 2>&1 | tail -1
sleep 4

# 2. Dashboard
echo "=== 2. Dashboard ==="
agent-browser eval "document.querySelector('h1')?.textContent" 2>&1
agent-browser screenshot --full download/output-demo/02-dashboard.png 2>&1 | tail -1

# Navigate through key views
navigate_and_capture() {
  local view="$1"
  local file="$2"
  agent-browser snapshot -i > /tmp/snap.txt 2>&1
  REF=$(grep "button \"$view\"" /tmp/snap.txt | head -1 | sed -E 's/.*ref=(e[0-9]+).*/\1/')
  if [ -n "$REF" ]; then
    agent-browser click @$REF 2>&1 | tail -1
    sleep 3
    agent-browser screenshot --full "download/output-demo/$file" 2>&1 | tail -1
    H1=$(agent-browser eval "document.querySelector('h1')?.textContent" 2>&1 | tr -d '"')
    echo "  ✓ $view → $file (H1: $H1)"
  else
    echo "  ? $view not found"
  fi
}

echo "=== 3. Competitors ==="
navigate_and_capture "Competitors" "03-competitors.png"

echo "=== 4. News ==="
navigate_and_capture "News" "04-news.png"

echo "=== 5. Pricing ==="
navigate_and_capture "Pricing" "05-pricing.png"

echo "=== 6. Alerts ==="
navigate_and_capture "Alerts" "06-alerts.png"

echo "=== 7. SWOT + Battlecard ==="
navigate_and_capture "SWOT" "07-swot.png"

echo "=== 8. Chat Assistant ==="
navigate_and_capture "Chat Assistant" "08-chat.png"

echo "=== 9. Weekly Digest ==="
navigate_and_capture "Weekly Digest" "09-digest.png"

echo "=== 10. AI Agents ==="
navigate_and_capture "AI Agents" "10-agents.png"

echo "=== 11. Analytics ==="
navigate_and_capture "Analytics" "11-analytics.png"

echo ""
echo "=== All screenshots ==="
ls -la download/output-demo/

kill $SERVERPID 2>/dev/null
wait 2>/dev/null
echo "Done"
