GLOW STRONG FIT — DEVELOPMENT v23 / ACCOUNT MANAGEMENT
===================================================
STATUS: DEV PACKAGE ONLY. NOT DEPLOYED OR LIVE-TESTED.

DESIGN FREEZE
- Existing v21/v22 styles, home, workouts, notebook, Profile, Progress, PRs,
  achievements, and bottom navigation are retained.
- Only new account-security styles, routes, and buttons are appended.
- Change email/password/delete options are inside existing Settings > MY ACCOUNT.

NEW FEATURES
1. Change Password: verifies the current password, checks new password and
   confirmation, updates via Supabase Auth /auth/v1/user.
2. Change Email: verifies current password, requests email update via Supabase
   Auth /auth/v1/user, displays verification instructions. Email stays unchanged
   until required verification is complete. Existing Supabase Change email
   address template is used automatically.
3. Delete Account: requires current password, typing DELETE, and a final browser
   confirmation. Calls a secure server-side Supabase Edge Function; NEVER deletes
   auth.users from the browser. The function verifies both access token and
   password, deletes auth user with service-role key, and cleans gsf_user_data.
   Local account state and IndexedDB progress photos are cleared on success.

IMPORTANT: ACCOUNT DELETION REQUIRES BACKEND DEPLOYMENT
- Upload only dev/index.html to the dev branch/path after backing it up.
- In Supabase, inspect gsf_user_data.user_id foreign key. Recommended: it
  references auth.users(id) with ON DELETE CASCADE. If it doesn't, set this up
  carefully after inspecting existing constraints; don't blindly run ALTER.
- Deploy supabase/functions/delete-account/index.ts as an Edge Function named
  delete-account. For publishable-key clients, deploy with --no-verify-jwt;
  the function explicitly validates the bearer token against Supabase Auth.
- Verify server-only SUPABASE_URL, SUPABASE_ANON_KEY and
  SUPABASE_SERVICE_ROLE_KEY are configured in Edge Function environment.
- NEVER put the service-role key into HTML or a public GitHub repository.
- Test only with a NEW throwaway account and test workout data. Deletion is
  permanent. Verify Auth user is gone and gsf_user_data row is gone.
- If the function is not deployed, deletion will show an error and will NOT
  remove the account or its local data.

EMAILS
- Change Email: existing branded Supabase Change email address template.
- Password reset: existing branded Supabase Reset password template.
- In-app password change: no additional email template required for the change
  to work. A security notification email is recommended later, via a verified
  transactional email provider if Supabase does not provide it for this action.
- Account deletion: no built-in Supabase email template for deletion. An
  optional final receipt email should be sent by a verified server-side mail
  provider after deletion, never directly from browser. Not wired in v23.

QA BEFORE DEPLOY
[ ] Change password with correct and incorrect current password
[ ] New password mismatch, short password, successful login with new password
[ ] Change email: check current/new inboxes and verify redirect works
[ ] Delete: try wrong password, wrong DELETE text, cancel confirmation
[ ] Deploy Edge Function and delete ONLY a throwaway test account
[ ] Check deleted account cannot log in; gsf_user_data row is removed
[ ] Verify local progress photos for that account are removed
[ ] Confirm all workouts, navigation, Profile and Progress still behave normally

KNOWN LIMITATIONS
- No hosted Supabase tests or live emails have been run in this environment.
- No deletion email provider configured; optional follow-up.
- The app uses local IndexedDB for photos. Deletion clears this browser's
  photos, but cannot remotely erase photos saved on other devices.
- Other local backups previously exported by the user remain on their device.
- If app-data cleanup fails after Auth deletion, function logs cleanup_warning;
  an administrator must review it. Configure ON DELETE CASCADE to avoid this.
