export function generateVCard(visitor) {
  return `
BEGIN:VCARD
VERSION:3.0
FN:${visitor.name}
ORG:${visitor.name || ''}
EMAIL:${visitor.email || ''}
TEL:${visitor.phone || ''}
ADR:;;${visitor.address || ''}
END:VCARD
`.trim();
}

