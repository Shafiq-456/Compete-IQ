#!/bin/bash
# Restart server cleanly and test all endpoints with timing
cd /home/z/my-project

pkill -f "next-server" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

setsid bun run dev > /tmp/dev.log 2>&1 < /dev/null &
sleep 12

if ! pgrep -f "next-server" > /dev/null; then
  echo "SERVER FAILED TO START"
  cat /tmp/dev.log
  exit 1
fi

echo "Server PID: $(pgrep -f 'next-server' | head -1)"
echo ""

# Now run all tests in same shell, in background
RESULTS_FILE=/tmp/results.txt
> $RESULTS_FILE

test_endpoint() {
  local label="$1"
  local method="$2"
  local url="$3"
  local data="$4"
  local outfile="$5"
  
  if [ "$method" = "GET" ]; then
    result=$(curl -s -o "$outfile" -w "%{http_code}|%{size_download}|%{time_total}" --max-time 30 "http://127.0.0.1:3000$url")
  else
    result=$(curl -s -o "$outfile" -w "%{http_code}|%{size_download}|%{time_total}" --max-time 30 -X "$method" -H "Content-Type: application/json" -d "$data" "http://127.0.0.1:3000$url")
  fi
  
  IFS='|' read -r code size time <<< "$result"
  printf "%-50s HTTP %s  %8s b  %6s s\n" "$label" "$code" "$size" "$time" >> $RESULTS_FILE
}

echo "Testing all endpoints..."
echo ""

test_endpoint "GET / (home page)" "GET" "/" "" /tmp/home.html
test_endpoint "GET /api/dashboard" "GET" "/api/dashboard" "" /tmp/r_dashboard.json
test_endpoint "GET /api/competitors" "GET" "/api/competitors" "" /tmp/r_competitors.json
test_endpoint "GET /api/competitors/comp_openai" "GET" "/api/competitors/comp_openai" "" /tmp/r_comp_openai.json
test_endpoint "GET /api/alerts" "GET" "/api/alerts" "" /tmp/r_alerts.json
test_endpoint "GET /api/agents" "GET" "/api/agents" "" /tmp/r_agents.json
test_endpoint "GET /api/news" "GET" "/api/news" "" /tmp/r_news.json
test_endpoint "GET /api/products" "GET" "/api/products" "" /tmp/r_products.json
test_endpoint "GET /api/pricing" "GET" "/api/pricing" "" /tmp/r_pricing.json
test_endpoint "GET /api/careers" "GET" "/api/careers" "" /tmp/r_careers.json
test_endpoint "GET /api/social" "GET" "/api/social" "" /tmp/r_social.json
test_endpoint "GET /api/reviews" "GET" "/api/reviews" "" /tmp/r_reviews.json
test_endpoint "GET /api/reports" "GET" "/api/reports" "" /tmp/r_reports.json
test_endpoint "GET /api/insights" "GET" "/api/insights" "" /tmp/r_insights.json
test_endpoint "GET /api/analytics" "GET" "/api/analytics" "" /tmp/r_analytics.json
test_endpoint "GET /api/changes" "GET" "/api/changes" "" /tmp/r_changes.json
test_endpoint "GET /api/swot?competitorId=comp_openai" "GET" "/api/swot?competitorId=comp_openai" "" /tmp/r_swot_openai.json
test_endpoint "GET /api/swot?competitorId=comp_anthropic" "GET" "/api/swot?competitorId=comp_anthropic" "" /tmp/r_swot_anthropic.json
test_endpoint "GET /api/swot?competitorId=comp_meta" "GET" "/api/swot?competitorId=comp_meta" "" /tmp/r_swot_meta.json
test_endpoint "GET /api/swot?competitorId=comp_perplexity" "GET" "/api/swot?competitorId=comp_perplexity" "" /tmp/r_swot_perp.json
test_endpoint "GET /api/chat (history)" "GET" "/api/chat" "" /tmp/r_chat_hist.json

echo "=== RESULTS ==="
cat $RESULTS_FILE
echo ""
echo "=== Server alive after tests? ==="
pgrep -af "next-server" > /dev/null && echo "YES - stable" || echo "NO - DIED"
