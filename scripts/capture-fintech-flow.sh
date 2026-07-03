#!/bin/bash
# Capture the onboarding + first-scan flow for a brand new FinTech user
set +e

pkill -9 -f "next-server" 2>/dev/null
pkill -9 -f "node server" 2>/dev/null
sleep 3

# Clean up test users
cd /home/z/my-project
bun -e "
import { db } from './src/lib/db'
async function main() {
  await db.competitor.deleteMany({ where: { userId: { not: 'user_default' } } })
  await db.user.deleteMany({ where: { id: { not: 'user_default' } } })
  await db.chatHistory.deleteMany({ where: { userId: { not: 'user_default' } } })
}
main().then(() => process.exit(0))
" > /dev/null 2>&1

# Start server
cd /home/z/my-project/.next/standalone
node server.js > /tmp/prod.log 2>&1 &
SERVERPID=$!
sleep 4
if ! ss -tlnp 2>/dev/null | grep -q 3000; then
  echo "FAILED to start server"
  exit 1
fi
echo "✓ Server running"

cd /home/z/my-project

# Open browser
agent-browser close 2>/dev/null
sleep 2
agent-browser open http://127.0.0.1:3000/ 2>&1 | tail -1
sleep 5

# 1. Login screen
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/flow-01-login.png 2>&1 | tail -1

# 2. Fill signup form
agent-browser snapshot -i > /tmp/snap.txt 2>&1
NAME_REF=$(grep 'textbox "Name' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
EMAIL_REF=$(grep 'textbox "Email"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
PASS_REF=$(grep 'textbox "Password"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
agent-browser fill @$NAME_REF "FinTech Founder" 2>&1 | tail -1
agent-browser fill @$EMAIL_REF "fintech@test.com" 2>&1 | tail -1
agent-browser fill @$PASS_REF "hello123" 2>&1 | tail -1
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/flow-02-signup-filled.png 2>&1 | tail -1

# 3. Submit
SUBMIT_REF=$(grep 'button "Create account"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
agent-browser click @$SUBMIT_REF 2>&1 | tail -1
sleep 4

# 4. Onboarding screen
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/flow-03-onboarding.png 2>&1 | tail -1
agent-browser eval "document.querySelector('h1')?.textContent" 2>&1

# 5. Click FinTech card
agent-browser snapshot -i > /tmp/snap.txt 2>&1
# Find FinTech button by text
agent-browser eval "
  const btns = Array.from(document.querySelectorAll('button'));
  const ft = btns.find(b => b.textContent.includes('FinTech'));
  if (ft) { ft.click(); 'clicked' } else { 'not found' }
" 2>&1
sleep 1

# 6. Fill business name + competitors
agent-browser snapshot -i > /tmp/snap.txt 2>&1
BNAME_REF=$(grep -i "business\|product name" /tmp/snap.txt | head -1 | sed -E 's/.*ref=(e[0-9]+).*/\1/')
[ -n "$BNAME_REF" ] && agent-browser fill @$BNAME_REF "AcmePay" 2>&1 | tail -1
# Find competitor input
COMP_REF=$(agent-browser eval "
  const inputs = Array.from(document.querySelectorAll('input'));
  const comp = inputs.find(i => i.placeholder && i.placeholder.includes('Stripe'));
  comp ? comp.getAttribute('name') || 'found' : 'notfound'
" 2>&1 | tr -d '"')
# Use placeholder-based approach instead
agent-browser eval "
  const inputs = Array.from(document.querySelectorAll('input[placeholder*=\"Stripe\"]'));
  if (inputs.length > 0) {
    const input = inputs[0];
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'Stripe');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    'filled';
  } else { 'no input' }
" 2>&1
sleep 1
# Press Enter to add competitor
agent-browser press Enter 2>&1 | tail -1
sleep 1
agent-browser eval "
  const inputs = Array.from(document.querySelectorAll('input[placeholder*=\"Stripe\"]'));
  if (inputs.length > 0) {
    const input = inputs[0];
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'Square');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    'filled';
  } else { 'no input' }
" 2>&1
agent-browser press Enter 2>&1 | tail -1
sleep 1
agent-browser eval "
  const inputs = Array.from(document.querySelectorAll('input[placeholder*=\"Stripe\"]'));
  if (inputs.length > 0) {
    const input = inputs[0];
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'Adyen');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    'filled';
  } else { 'no input' }
" 2>&1
agent-browser press Enter 2>&1 | tail -1
sleep 1
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/flow-04-onboarding-filled.png 2>&1 | tail -1

# 7. Click Start monitoring
agent-browser eval "
  const btns = Array.from(document.querySelectorAll('button'));
  const start = btns.find(b => b.textContent.includes('Start monitoring'));
  if (start) { start.click(); 'clicked' } else { 'not found' }
" 2>&1
sleep 5

# 8. First scan screen
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/flow-05-first-scan.png 2>&1 | tail -1
agent-browser eval "document.querySelector('h1')?.textContent" 2>&1

# Wait for scan to complete
echo "Waiting 60s for LLM scan to complete..."
sleep 60

# 9. Scan complete
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/flow-06-scan-complete.png 2>&1 | tail -1
agent-browser eval "document.querySelector('h2')?.textContent" 2>&1

# 10. Enter dashboard
agent-browser eval "
  const btns = Array.from(document.querySelectorAll('button'));
  const enter = btns.find(b => b.textContent.includes('Enter dashboard'));
  if (enter) { enter.click(); 'clicked' } else { 'not found' }
" 2>&1
sleep 5
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/flow-07-dashboard.png 2>&1 | tail -1
agent-browser eval "document.querySelector('h1')?.textContent" 2>&1

# 11. Navigate to Chat to see AI welcome
agent-browser snapshot -i > /tmp/snap.txt 2>&1
CHAT_REF=$(grep -E 'button "Chat Assistant"' /tmp/snap.txt | sed -E 's/.*ref=(e[0-9]+).*/\1/')
[ -n "$CHAT_REF" ] && agent-browser click @$CHAT_REF 2>&1 | tail -1
sleep 5
agent-browser screenshot --full /home/z/my-project/download/stages-screenshots/flow-08-chat-welcome.png 2>&1 | tail -1

echo ""
echo "=== Screenshots ==="
ls -la /home/z/my-project/download/stages-screenshots/flow-*.png

# Kill server
kill $SERVERPID 2>/dev/null
wait 2>/dev/null
echo "Done"
