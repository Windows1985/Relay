// Supabase Auth needs an email/phone identifier; Relay is username+password
// only, so each username maps deterministically to a synthetic email.
// GoTrue's validator rejects RFC 2606 reserved TLDs (.invalid, .local), so
// this uses a subdomain of the app's own domain instead — never sent to,
// format-only. Lowercasing here is what makes usernames case-insensitively
// unique — two users typing "Bob" and "bob" collide at Supabase's own
// unique-email constraint before profiles.username (citext) ever sees them.
export function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase()}@id.relay.app`;
}

const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;

export function validateUsername(username: string): string | null {
  if (!USERNAME_RE.test(username)) {
    return "3-20 characters, letters/numbers/underscore, starting with a letter.";
  }
  return null;
}
