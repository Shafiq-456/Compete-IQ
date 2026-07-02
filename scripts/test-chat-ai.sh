#!/bin/bash
# Test AI Chat with 7 different question types
cd /home/z/my-project

# Ensure server is alive
if ! pgrep -f "next-server" > /dev/null; then
  echo "Server not running, starting..."
  setsid bun run dev > /tmp/dev.log 2>&1 < /dev/null &
  sleep 12
fi

QUESTIONS=(
  "Which competitor changed pricing this month?"
  "Who launched new products recently?"
  "Which company is growing fastest based on hiring?"
  "Compare OpenAI and Anthropic - which has stronger enterprise offering?"
  "Show me hiring trends across all competitors"
  "What changed on competitor websites this week?"
  "Generate a strategic recommendation for our AI chatbot business"
)

echo "=== AI CHAT TEST RESULTS ==="
echo ""
i=1
for q in "${QUESTIONS[@]}"; do
  echo "─────────────────────────────────────────────────"
  echo "Q$i: $q"
  echo "─────────────────────────────────────────────────"
  
  # Time the request
  START=$(date +%s.%N)
  RESULT=$(curl -s -o /tmp/chat_$i.json -w "%{http_code}|%{time_total}" --max-time 90 \
    -X POST -H "Content-Type: application/json" \
    -d "{\"message\":\"$q\"}" \
    http://127.0.0.1:3000/api/chat)
  END=$(date +%s.%N)
  
  IFS='|' read -r code time <<< "$RESULT"
  echo "Status: HTTP $code | Time: ${time}s"
  echo ""
  echo "AI Reply:"
  python3 -c "
import json
with open('/tmp/chat_$i.json') as f:
    d = json.load(f)
reply = d.get('reply', 'NO REPLY FIELD')
print(reply[:1500])
if len(reply) > 1500:
    print('...[truncated]')
"
  echo ""
  i=$((i+1))
done

echo "=== Server alive after all AI calls? ==="
pgrep -af "next-server" > /dev/null && echo "YES - stable" || echo "NO - DIED"
