# Quick Reference Card

## For Families (Kiosk Users)

### Check-In Flow
1. Visit: http://your-kiosk:3000/checkin
2. Enter last 4 digits of your phone number
3. Select your family if multiple matches
4. Click "Check In" next to each youth
5. Note the pickup code that appears

### At Pickup
- Give your pickup code to staff
- Or show the parent pickup tag with QR code
- Staff will scan or enter the code
- Your child will be checked out and released

---

## For Staff

### Access Admin
- URL: http://your-kiosk:3000/admin
- PIN: 5555 (demo - change in production)

### Check-Out Process
1. Visit: http://your-kiosk:3000/checkout
2. Enter staff PIN (5555)
3. Type or scan the pickup code
4. Confirm the child's name
5. Complete pickup

### Admin Tasks
- **Families**: View and add families
- **People**: Add youth and adults
- **Events**: Create events and set one ACTIVE
- **Reports**: View attendance statistics

---

## Key Phone Numbers to Remember

### Demo Setup
- **Family 1**: Last 4 = 4567 (Smith family)
- **Family 2**: Last 4 = 6543 (Johnson family)
- **Staff PIN**: 5555

### Pickup Codes
- Demo code: ABC123 (after checking in)
- New codes auto-generate when checking in

---

## Printing Tags

### To Print Tags
1. Go to: http://your-kiosk:3000/print/default-event/[personId]
2. Click "Print Tags" button
3. Select your label printer
4. Print at 2.25in × 4in size

### What Gets Printed
- **Tag 1**: Child's name + code + QR code
- **Tag 2**: Parent pickup tag + same code + QR code

---

## Troubleshooting

### "Phone number not found"
- Check that last 4 digits are correct
- Create the family in Admin if it doesn't exist
- Contact staff

### "Code already redeemed"
- That code has already been used for pickup
- Check in again to get a new code

### Printer not printing
- Check printer is connected and powered on
- Try printing a test page from settings
- Contact IT support

---

## Contact & Support

For issues or questions:
1. Contact event staff on-site
2. Call: [Your support number]
3. Email: [Your support email]

---

**Last Updated**: December 2024
**Version**: 1.0.0
