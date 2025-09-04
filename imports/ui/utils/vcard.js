export function buildVCard({ name = '', company = '', email = '', phone = '' }) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    name ? `FN:${name}` : '',
    company ? `ORG:${company}` : '',
    email ? `EMAIL;TYPE=INTERNET:${email}` : '',
    phone ? `TEL;TYPE=CELL:${phone}` : '',
    'END:VCARD'
  ].filter(Boolean);
  return lines.join('\n');
}
