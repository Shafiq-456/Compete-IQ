#!/bin/bash
# Capture all 15 view screenshots in one shell session
cd /home/z/my-project/.next/standalone

# Start prod server
node server.js > /tmp/prod.log 2>&1 &
SERVERPID=$!
sleep 4
ss -tlnp 2>/dev/null | grep 3000 > /dev/null && echo "Server OK" || echo "DEAD"

# Open browser
agent-browser open http://127.0.0.1:3000/ 2>&1 | tail -2
sleep 8  # wait for first compile + animations + data fetch

echo "=== Verify dashboard loaded ==="
agent-browser get title 2>&1
agent-browser eval "document.querySelector('h1')?.textContent" 2>&1

# Capture dashboard
agent-browser screenshot --full /home/z/my-project/download/screenshots-v2/01-Dashboard.png > /dev/null 2>&1
echo "01-Dashboard captured"

# Navigate through all 15 views
declare -a VIEWS=(
  "Analytics" "Alerts" "Website" "News" "Products"
  "Pricing" "Careers" "Social" "Reviews" "SWOT"
  "Reports" "Chat Assistant" "AI Agents" "Competitors"
)
declare -a FILES=(
  "02-Analytics" "03-Alerts" "04-Website" "05-News" "06-Products"
  "07-Pricing" "08-Careers" "09-Social" "10-Reviews" "11-SWOT"
  "12-Reports" "13-Chat" "14-Agents" "15-Competitors"
)

i=0
for view in "${VIEWS[@]}"; do
  file="${FILES[$i]}"
  agent-browser snapshot -i > /tmp/snap.txt 2>&1
  ref=$(grep -E "button \"$view( [0-9]+)?\" *\[" /tmp/snap.txt | head -1 | sed -E 's/.*ref=(e[0-9]+).*/\1/')
  if [ -n "$ref" ]; then
    agent-browser click @$ref > /dev/null 2>&1
    sleep 3
    agent-browser screenshot --full "/home/z/my-project/download/screenshots-v2/$file.png" > /dev/null 2>&1
    echo "$file captured (view: $view)"
  else
    echo "$file SKIPPED (no ref for $view)"
  fi
  i=$((i+1))
done

echo ""
echo "=== Final server status ==="
ps -p $SERVERPID > /dev/null && echo "Server alive" || echo "Server died"

echo ""
echo "=== All screenshots ==="
ls -la /home/z/my-project/download/screenshots-v2/

# Cleanup
kill $SERVERPID 2>/dev/null
wait 2>/dev/null
