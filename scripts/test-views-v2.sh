#!/bin/bash
# Improved test: snapshot + click each nav item, take screenshot
cd /home/z/my-project

# First navigate back to dashboard
agent-browser open http://127.0.0.1:3000/ > /dev/null 2>&1
sleep 3

# Take initial snapshot to find nav refs
agent-browser snapshot -i > /tmp/snap.txt 2>&1
echo "=== Sidebar nav items found ==="
grep -E "Website|News|Products|Pricing|Careers|Social|Reviews|SWOT|Reports|Chat|Agents|Competitors|Analytics|Alerts|Dashboard" /tmp/snap.txt | head -20
echo ""

# Now click each nav item by traversing the snapshot
declare -A VIEWS=(
  [Dashboard]="Dashboard"
  [Analytics]="Analytics"
  [Alerts]="Alerts"
  [Website]="Website"
  [News]="News"
  [Products]="Products"
  [Pricing]="Pricing"
  [Careers]="Careers"
  [Social]="Social"
  [Reviews]="Reviews"
  [SWOT]="SWOT"
  [Reports]="Reports"
  [Chat Assistant]="Chat Assistant"
  [AI Agents]="AI Agents"
  [Competitors]="Competitors"
)

ORDER=("Dashboard" "Analytics" "Alerts" "Website" "News" "Products" "Pricing" "Careers" "Social" "Reviews" "SWOT" "Reports" "Chat Assistant" "AI Agents" "Competitors")

echo "=== VIEW RENDERING TEST ==="
printf "%-25s %-15s %-50s\n" "View" "Status" "H1 Found"
printf "%-25s %-15s %-50s\n" "----" "------" "--------"

for view in "${ORDER[@]}"; do
  # Re-snapshot to find current ref of this nav item
  agent-browser snapshot -i > /tmp/snap_current.txt 2>&1
  ref=$(grep -E "button.*\"$view\"" /tmp/snap_current.txt | head -1 | grep -oE 'ref=e[0-9]+' | head -1)
  
  if [ -z "$ref" ]; then
    # Try as link
    ref=$(grep -E "\"$view\"" /tmp/snap_current.txt | head -1 | grep -oE 'ref=e[0-9]+' | head -1)
  fi
  
  if [ -z "$ref" ]; then
    printf "%-25s %-15s %-50s\n" "$view" "NO REF" "(nav item not found)"
    continue
  fi
  
  agent-browser click @$ref > /dev/null 2>&1
  sleep 2.5
  
  # Get the h1 of the new view
  h1=$(agent-browser eval "document.querySelector('h1')?.textContent?.trim() || 'NO H1'" 2>/dev/null | tr -d '"' | head -1)
  
  if echo "$h1" | grep -qi "^$view"; then
    status="✓ OK"
  else
    status="✗ MISMATCH"
  fi
  
  printf "%-25s %-15s %-50s\n" "$view" "$status" "$h1"
done

echo ""
echo "=== Check for any rendering errors after navigation ==="
agent-browser errors 2>&1 | head -10
echo ""
echo "=== Final console check ==="
agent-browser console 2>&1 | grep -i "error\|warn\|fail" | head -10 || echo "No errors/warnings"
