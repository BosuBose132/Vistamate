import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import { Visitors } from '/imports/api/collections';
import buildVCard from '/imports/lib/vcard.js';


const safe = s => (s || 'visitor').replace(/[^\w.-]+/g, '_');

WebApp.connectHandlers.use('/vcards', (req, res, next) => {
    // Expect /vcards/:id.vcf or /vcards/:id
    const match = req.url.match(/^\/([^/?#]+)(?:\.vcf)?(?:\?.*)?$/);
    if (!match) return next();

    const id = decodeURIComponent(match[1]);

    // Fetch minimal fields for the card (adjust to your doc shape)
    const v = Visitors.findOne(
        { _id: id },
        { fields: { name: 1, company: 1, email: 1, phone: 1 } }
    );

    if (!v) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
    }

    const vcard = buildVCard({
        name: v.name || '',
        company: v.company || '',
        email: v.email || '',
        phone: v.phone || '',
    });

    const filename = `${safe(v.name)}.vcf`;
    res.writeHead(200, {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
    });
    res.end(vcard, 'utf8');
});
