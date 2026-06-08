export const maskEmail = (email?: string | null) => {
  if (!email) return "";

  const [name, domain] = email.split("@");
  if (!name || !domain) return email;

  const visibleStart = name.slice(0, Math.min(3, name.length));
  const visibleEnd = name.length > 5 ? name.slice(-2) : "";
  const hiddenLength = Math.max(3, name.length - visibleStart.length - visibleEnd.length);

  return `${visibleStart}${"*".repeat(hiddenLength)}${visibleEnd}@${domain}`;
};
