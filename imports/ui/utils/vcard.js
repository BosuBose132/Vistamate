// /imports/ui/utils/vcard.js
export function buildVCard({ name = '', company = '', email = '', phone = '' }) {
    const [first = '', ...rest] = (name || '').trim().split(/\s+/);
    const last = rest.join(' ');
    const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${last};${first};;;`,          // Structured name
        `FN:${name}`,                     // Formatted name
        company ? `ORG:${company}` : '',
        email ? `EMAIL;TYPE=INTERNET:${email}` : '',
        phone ? `TEL;TYPE=CELL:${phone}` : '',
        'END:VCARD',
    ].filter(Boolean);
    return lines.join('\r\n');          // CRLF line endings
}
