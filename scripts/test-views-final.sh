#!/bin/bash
# Final view test: smarter title matching + screenshots of each view
cd /home/z/my-project

mkdir -p /home/z/my-project/download/screenshots

agent-browser open http://127.0.0.1:3000/ > /dev/null 2>&1
sleep 3

# nav-label -> expected-H1-prefix mapping (singular vs plural differences)
declare -A H1_PREFIX=(
  [Dashboard]="Dashboard"
  [Analytics]="Analytics"
  [Alerts]="Alerts"
  [Website]="Website"
  [News]="News"
  [Products]="Product"
  [Pricing]="Pricing"
  [Careers]="Career"
  [Social]="Social"
  [Reviews]="Customer Review"
  [SWOT]="SWOT"
  [Reports]="AI Report"
  [Chat Assistant]="AI Chat"
  [AI Agents]="AI Agents"
  [Competitors]="Competitors"
)

ORDER=("Dashboard" "Analytics" "Alerts" "Website" "News" "Products" "Pricing" "Careers" "Social" "Reviews" "SWOT" "Reports" "Chat Assistant" "AI Agents" "Competitors")

echo "=== FINAL VIEW RENDERING TEST ==="
echo ""
printf "%-20s %-12s %s\n" "View" "Status" "Rendered H1"
printf "%-20s %-12s %s\n" "----" "------" "----------"

OK_COUNT=0
FAIL_COUNT=0

i=1
for view in "${ORDER[@]}"; do
  expected="${H1_PREFIX[$view]}"
  agent-browser snapshot -i > /tmp/snap.txt 2>&1
  ref=$(grep -E "button \"$view( [0-9]+)?\" *\[" /tmp/snap.txt | head -1 | sed -E 's/.*ref=(e[0-9]+).*/\1/')
  
  if [ -z "$ref" ]; then
    printf "%-20s %-12s %s\n" "$view" "NO REF" "(nav not found)"
    FAIL_COUNT=$((FAIL_COUNT+1))
    continue
  fi
  
  agent-browser click @$ref > /dev/null 2>&1
  sleep 2
  
  h1=$(agent-browser eval "document.querySelector('h1')?.textContent?.trim() || 'NO H1'" 2>/dev/null | tr -d '"' | head -1)
  
  if echo "$h1" | grep -qi "^$expected"; then
    status="✓ OK"
    OK_COUNT=$((OK_COUNT+1))
  else
    status="✗ FAIL"
    FAIL_COUNT=$((FAIL_COUNT+1))
  fi
  
  printf "%-20s %-12s %s\n" "$view" "$status" "$h1"
  
  # Take a screenshot of each view
  agent-browser screenshot --full /home/z/my-project/download/screenshots/$(printf "%02d" $i)-$view.png > /dev/null 2>&1
  i=$((i+1))
done

echo ""
echo "=== SUMMARY ==="
echo "  ✓ OK:   $OK_COUNT / 15 views rendered correctly"
echo "  ✗ FAIL: $FAIL_COUNT / 15"
echo ""
echo "=== Page errors ==="
agent-browser errors 2>&1 | head -10
echo ""
echo "=== Console errors ==="
agent-browser console 2>&1 | grep -iE "error|fail|exception" | head -10 || echo "(none)"
echo ""
echo "=== Screenshots saved ==="
ls -la /home/z/my-project/download/screenshots/ 2>/dev/null
