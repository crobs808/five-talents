#!/bin/bash

# Quick Test Guide for Retroactive Attendance Fix
# Run this after making changes to test the feature

echo "=========================================="
echo "Retroactive Attendance Testing Guide"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Start the development server${NC}"
echo "cd /home/admin/repos/five-talents && npm run dev"
echo "Wait for 'Ready in X.XXs' message"
echo ""

echo -e "${BLUE}Step 2: Open the application${NC}"
echo "Navigate to: http://localhost:3000/admin"
echo "Enter passcode: 808080"
echo ""

echo -e "${BLUE}Step 3: Go to Families${NC}"
echo "Click 'Families' card on admin dashboard"
echo ""

echo -e "${BLUE}Step 4: Find and Edit a Family${NC}"
echo "Look for 'Roberts' family or any family with multiple people"
echo "Click 'Edit' button for that family"
echo ""

echo -e "${BLUE}Step 5: Test Retroactive Attendance${NC}"
echo "In the modal, scroll down to 'Retroactive Attendance' section"
echo "Check 2-3 family member checkboxes"
echo "Check 4-6 past event checkboxes"
echo "Click 'Save Attendance' button"
echo ""

echo -e "${GREEN}Expected Result:${NC}"
echo "✅ Alert appears showing: 'Successfully marked X attendance records for Y family member(s) and Z event(s)'"
echo "✅ X should be > 0 (e.g., 12 for 2 people × 6 events)"
echo ""

echo -e "${BLUE}Step 6: Verify in Reports${NC}"
echo "Go to Admin > Attendance Report"
echo "Click the event dropdown"
echo "Select one of the events you marked for retroactive attendance"
echo "Verify the selected people appear in the report with CHECKED_IN status"
echo ""

echo -e "${BLUE}Step 7: Debug if Needed${NC}"
echo "Open browser console (F12 → Console tab)"
echo "Look for log messages like:"
echo "  'Sending retroactive attendance request: {...}'"
echo "  'Retroactive attendance response: {...}'"
echo ""

echo -e "${BLUE}Step 8: Use Debug Endpoint (Optional)${NC}"
echo "Copy a family ID (visible in edit modal or database)"
echo "GET: http://localhost:3000/api/debug/retroactive-attendance?familyId=<familyId>"
echo "This shows all attendance records for that family"
echo ""

echo -e "${YELLOW}Troubleshooting:${NC}"
echo "❌ Alert shows 'Successfully marked 0 attendance records'?"
echo "   → Check browser console for error messages"
echo "   → Use debug endpoint to verify database state"
echo ""
echo "❌ Events don't appear in report dropdown?"
echo "   → Refresh the page (Ctrl+R)"
echo "   → Check if event exists in calendar"
echo ""
echo "❌ No retroactive attendance UI in modal?"
echo "   → Make sure you have family members to select"
echo "   → Make sure past events exist in calendar"
echo ""

echo -e "${GREEN}Testing Complete!${NC}"
