#!/bin/bash
# Click through every nav item and verify each view renders
cd /home/z/my-project

# View titles expected from page.tsx TITLE_MAP
declare -A VIEWS=(
  [dashboard]="Dashboard"
  [analytics]="Analytics"
  [alerts]="Alerts"
  [website]="Website Monitoring"
  [news]="News Intelligence"
  [products]="Product Intelligence"
  [pricing]="Pricing Intelligence"
  [careers]="Career Intelligence"
  [social]="Social Media Intelligence"
  [reviews]="Customer Review Intelligence"
  [swot]="SWOT Generator"
  [reports]="AI Report Generator"
  [chat]="AI Chat Assistant"
  [agents]="AI Agents"
  [competitors]="Competitors"
)

# Order to test (matches sidebar order)
ORDER=(dashboard analytics alerts website news products pricing careers social reviews swot reports chat agents competitors)

echo "=== VIEW-BY-VIEW RENDERING TEST ==="
echo ""
printf "%-30s %-25s %-10s %-15s\n" "View" "Expected Title" "Rendered?" "Time (s)"
printf "%-30s %-25s %-10s %-15s\n" "----" "--------------" "---------" "--------"

for view in "${ORDER[@]}"; do
  expected="${VIEWS[$view]}"
  
  # Take a snapshot to find the nav button by text
  start=$(date +%s.%N)
  
  # Click the nav item by its label
  agent-browser find text "$expected" click > /dev/null 2>&1
  sleep 2  # Allow view to mount + fetch data
  
  # Get the page heading
  title=$(agent-browser get text @e4 2>/dev/null)
  if [ -z "$title" ]; then
    # Try alternative: snapshot heading
    title=$(agent-browser eval "document.querySelector('h1')?.textContent || ''" 2>/dev/null | tr -d '"')
  fi
  
  end=$(date +%s.%N)
  elapsed=$(echo "$end - $start" | bc)
  
  if echo "$title" | grep -qi "$expected"; then
    status="✓ OK"
  elif [ -z "$title" ]; then
    status="✗ NO HEADING"
  else
    status="? Got: $title"
  fi
  
  printf "%-30s %-25s %-10s %-15s\n" "$view" "$expected" "$status" "$elapsed"
done

echo ""
echo "=== Final page state ==="
agent-browser errors 2>&1 | head -10 || echo "No errors"
echo ""
echo "=== Console messages (last 10) ==="
agent-browser console 2>&1 | tail -10
