// Reveals the contact email that server.js obfuscates (see obfuscateEmail).
// The address is stored reversed and base64-encoded so scrapers can't read it from the HTML.
for (const el of document.querySelectorAll('[data-email], [data-email-text]')) {
  const email = [...atob(el.dataset.email || el.dataset.emailText)].reverse().join('');
  if (el.dataset.email) el.href = `mailto:${email}`;
  else el.textContent = email;
}
