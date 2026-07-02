#!/bin/bash
# Fixed test: snapshot before EACH click to get fresh refs
cd /home/z/my-project

agent-browser open http://127.0.0.1:3000/ > /dev/null 2>&1
sleep 3

ORDER=("Dashboard" "Analytics" "Alerts" "Website" "News" "Products" "Pricing" "Careers" "Social" "Reviews" "SWOT" "Reports" "Chat Assistant" "AI Agents" "Competitors")

echo "=== VIEW RENDERING TEST (15 views) ==="
echo ""
printf "%-20s %-12s %s\n" "View" "Status" "Rendered H1"
printf "%-20s %-12s %s\n" "----" "------" "----------"

OK_COUNT=0
FAIL_COUNT=0

for view in "${ORDER[@]}"; do
  # Fresh snapshot each iteration
  agent-browser snapshot -i > /tmp/snap.txt 2>&1
  # Find the button ref - it may be like "Alerts 4" so we need partial match
  # Match exact "View Name" or "View Name <number>" (badge)
  ref=$(grep -E "button \"$view( [0-9]+)?\" *\[" /tmp/snap.txt | head -1 | sed -E 's/.*ref=(e[0-9]+).*/\1/')
  
  if [ -z "$ref" ]; then
    printf "%-20s %-12s %s\n" "$view" "NO REF" "nav item not found"
    FAIL_COUNT=$((FAIL_COUNT+1))
    continue
  fi
  
  # Click using fresh ref
  result=$(agent-browser click @$ref 2>&1)
  sleep 2
  
  # Get the H1
  h1=$(agent-browser eval "document.querySelector('h1')?.textContent?.trim() || 'NO H1'" 2>/dev/null | tr -d '"' | head -1)
  
  # Verify H1 matches the view name (some views have suffix like "Intelligence")
  if echo "$h1" | grep -qi "^$view"; then
    status="✓ OK"
    OK_COUNT=$((OK_COUNT+1))
  else
    status="✗ FAIL"
    FAIL_COUNT=$((FAIL_COUNT+1))
  fi
  
  printf "%-20s %-12s %s\n" "$view" "$status" "$h1"
done

echo ""
echo "=== SUMMARY ==="
echo "  OK:   $OK_COUNT / 15"
echo "  FAIL: $FAIL_COUNT / 15"
echo ""
echo "=== Page errors after all navigation ==="
agent-browser errors 2>&1 | head -20 || echo "(none)"
echo ""
echo "=== Console errors after all navigation ==="
agent-browser console 2>&1 | grep -iE "error|fail|exception" | head -10 || echo "(no errors)"
