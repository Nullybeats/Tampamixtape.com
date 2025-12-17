# TampaMixtape - Future Improvements

## Approval Flow Enhancements

### High Priority
- [ ] **Email Notifications** - Send email when user status changes (approved/rejected)
  - Requires email service (SendGrid, Resend, or AWS SES)
  - Notify user immediately when admin approves/rejects

- [ ] **Session Auto-Refresh** - Automatically update user status while logged in
  - Poll `/api/auth/me` periodically (every 30-60s) or use WebSocket
  - User sees approval without needing to refresh/re-login

### Medium Priority
- [ ] **Rejection Reason** - Allow admin to provide reason when rejecting
  - Add `rejectionReason` field to User model
  - Display reason on rejected user's page
  - Include reason in rejection email

- [ ] **Re-application Flow** - Allow rejected users to re-apply
  - Add "Re-apply" button that resets status to PENDING
  - Optionally require updated information

- [ ] **Bulk Actions** - Select multiple pending users to approve/reject at once
  - Checkbox selection in Pending tab
  - "Approve All" / "Reject All" buttons

### Low Priority
- [ ] **Audit Log** - Track admin actions
  - Who approved/rejected whom and when
  - View history in admin dashboard

- [ ] **Auto-refresh Pending Count** - Real-time pending badge update
  - WebSocket or polling for admin dashboard
  - Show notification when new applications arrive

## Other Enhancements
- [ ] Apple Music integration
- [ ] SoundCloud integration
- [ ] YouTube channel integration
- [ ] Profile analytics for artists
