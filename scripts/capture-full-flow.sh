#!/bin/bash
# Capture full UI flow: login → onboarding → first-scan → dashboard → SWOT → digest
set +e

pkill -f "node server" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 2

# Clean up fintech test user first (so we can re-run onboarding)
cd /home/z/my-project
bun -e "
import { db } from './src/lib/db'
async function main() {
  await db.competitor.deleteMany({ where: { userId: { not: 'user_default' } } })
  await db.user.deleteMany({ where: { id: { not: 'user_default' } } })
}
main().then(() => process.exit(0))
" > /dev/null 2>&1

# Start server
setsid bash -c 'cd /home/z/my-project/.next/standalone && exec node server.js' > /tmp/prod.log 2>&1 < /dev/null &
sleep 5
ss -tlnp 2>/dev/null | grep -q 3000 && echo "✓ Server running" || { echo "DEAD"; exit 1; }

mkdir -p /home/z/my-project/download/stages-screenshots

# Open browser
agent-browser open http://127.0.0.1:3000/ 2>&1 | tail -1
sleep 5

echo ""
echo "=== 1. Login screen ==="
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/01-login.png 2>&1 | tail -1

# Fill signup form
echo "=== 2. Filling signup form ==="
agent-browser snapshot -i > /tmp/snap.txt 2>&1
NAME_REF=$(grep 'textbox "Name' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
EMAIL_REF=$(grep 'textbox "Email"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
PASS_REF=$(grep 'textbox "Password"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
SUBMIT_REF=$(grep 'button "Create account"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
echo "  Filling name=$NAME_REF email=$EMAIL_REF password=$PASS_REF submit=$SUBMIT_REF"
agent-browser fill @$NAME_REF "FinTech Founder" 2>&1 | tail -1
agent-browser fill @$EMAIL_REF "fintech@test.com" 2>&1 | tail -1
agent-browser fill @$PASS_REF "hello123" 2>&1 | tail -1
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/02-signup-filled.png 2>&1 | tail -1

# Submit
agent-browser click @$SUBMIT_REF 2>&1 | tail -1
sleep 4

echo ""
echo "=== 3. Onboarding (niche selection) screen ==="
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/03-onboarding.png 2>&1 | tail -1
agent-browser get title 2>&1 | head -1

# Click FinTech card
echo "=== 4. Selecting FinTech niche ==="
agent-browser snapshot -i > /tmp/snap.txt 2>&1
FINTECH_REF=$(grep -i "fintech" /tmp/snap.txt | head -1 | sed -E 's/.*ref=(e[0-9]+).*/\1/')
echo "  FinTech card ref: $FINTECH_REF"
agent-browser click @$FINTECH_REF 2>&1 | tail -1
sleep 1

# Fill business name
agent-browser snapshot -i > /tmp/snap.txt 2>&1
BNAME_REF=$(grep -i "Acme\|business\|product name" /tmp/snap.txt | head -1 | sed -E 's/.*ref=(e[0-9]+).*/\1/')
if [ -n "$BNAME_REF" ]; then
  agent-browser fill @$BNAME_REF "AcmePay" 2>&1 | tail -1
fi

# Fill competitors
COMP_REF=$(grep -i "stripe\|competitor" /tmp/snap.txt | head -1 | sed -E 's/.*ref=(e[0-9]+).*/\1/')
if [ -n "$COMP_REF" ]; then
  agent-browser fill @$COMP_REF "Stripe" 2>&1 | tail -1
  agent-browser press Enter 2>&1 | tail -1
  agent-browser fill @$COMP_REF "Square" 2>&1 | tail -1
  agent-browser press Enter 2>&1 | tail -1
  agent-browser fill @$COMP_REF "Adyen" 2>&1 | tail -1
  agent-browser press Enter 2>&1 | tail -1
fi
sleep 1
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/04-onboarding-filled.png 2>&1 | tail -1

# Click "Start monitoring" button
agent-browser snapshot -i > /tmp/snap.txt 2>&1
START_REF=$(grep -i "Start monitoring" /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
echo "  Start button ref: $START_REF"
agent-browser click @$START_REF 2>&1 | tail -1
sleep 5

echo ""
echo "=== 5. First-scan progress screen ==="
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/05-first-scan.png 2>&1 | tail -1

# Wait for scan to complete (LLM call takes ~30-60s)
echo "=== 6. Waiting for scan to complete (60s)... ==="
sleep 60
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/06-first-scan-complete.png 2>&1 | tail -1
agent-browser get title 2>&1 | head -1

# Click "Enter dashboard" button
agent-browser snapshot -i > /tmp/snap.txt 2>&1
ENTER_REF=$(grep -i "Enter dashboard" /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
if [ -n "$ENTER_REF" ]; then
  echo "  Clicking Enter dashboard..."
  agent-browser click @$ENTER_REF 2>&1 | tail -1
  sleep 5
fi

echo ""
echo "=== 7. Dashboard populated with FinTech data ==="
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/07-dashboard.png 2>&1 | tail -1
agent-browser get title 2>&1 | head -1

# Navigate to Chat Assistant to see Stage B welcome message
echo ""
echo "=== 8. AI Chat Assistant with welcome message ==="
agent-browser snapshot -i > /tmp/snap.txt 2>&1
CHAT_REF=$(grep -E 'button "Chat Assistant"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
[ -n "$CHAT_REF" ] && agent-browser click @$CHAT_REF 2>&1 | tail -1
sleep 5
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/08-chat-welcome.png 2>&1 | tail -1

# Navigate to SWOT to see battlecard
echo ""
echo "=== 9. SWOT with battlecard ==="
agent-browser snapshot -i > /tmp/snap.txt 2>&1
SWOT_REF=$(grep -E 'button "SWOT"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
[ -n "$SWOT_REF" ] && agent-browser click @$SWOT_REF 2>&1 | tail -1
sleep 3
# Click Regenerate to force AI SWOT generation
agent-browser snapshot -i > /tmp/snap.txt 2>&1
REGEN_REF=$(grep -E 'button "Regenerate"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
[ -n "$REGEN_REF" ] && agent-browser click @$REGEN_REF 2>&1 | tail -1
echo "  Waiting 15s for SWOT AI generation..."
sleep 15
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/09-swot-battlecard.png 2>&1 | tail -1

# Navigate to Digest
echo ""
echo "=== 10. Weekly Digest view ==="
agent-browser snapshot -i > /tmp/snap.txt 2>&1
DIGEST_REF=$(grep -E 'button "Weekly Digest"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
[ -n "$DIGEST_REF" ] && agent-browser click @$DIGEST_REF 2>&1 | tail -1
sleep 3
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/10-digest.png 2>&1 | tail -1

# Navigate to Alerts
echo ""
echo "=== 11. Alerts view (sorted by severity) ==="
agent-browser snapshot -i > /tmp/snap.txt 2>&1
ALERTS_REF=$(grep -E 'button "Alerts' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
[ -n "$ALERTS_REF" ] && agent-browser click @$ALERTS_REF 2>&1 | tail -1
sleep 3
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/11-alerts.png 2>&1 | tail -1

echo ""
echo "=== Screenshots saved ==="
ls -la /home/z/my-project/download/stages-screenshots/

pkill -f "node server" 2>/dev/null
echo "Done"
