import { config } from '../config/env.js';

/**
 * Rewrites every uploaded-media URL in a JSON response to the public HTTPS origin.
 *
 * Stored URLs come in several shapes: relative "/uploads/x.webp" (fine for the web
 * app behind the same nginx, useless to a mobile app), and absolute ones minted
 * while UPLOAD_BASE_URL pointed at the Node port, e.g. "http://1.2.3.4:5000/uploads/x.webp"
 * -- plain http and a port that is not open to the internet, so the apps showed
 * broken images. Fixing it on the way out covers the records already in the DB.
 *
 * Only /uploads/ paths are touched; CDN or third-party image URLs pass through.
 */

const LOCAL_HOST = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|::1)$/i;

const resolveBase = (req) => {
    if (config.publicMediaBaseUrl) return config.publicMediaBaseUrl.replace(/:5000(?=\/|$)/, '');
    const host = String(req.hostname || '').trim();
    // Local development has no TLS; leave URLs as they are.
    if (!host || LOCAL_HOST.test(host)) return null;
    return `https://${host}`;
};

const needsRewrite = (url) => {
    if (url.protocol === 'http:') return true;
    if (url.port) return true;
    return LOCAL_HOST.test(url.hostname);
};

export const rewriteMediaUrl = (value, base) => {
    if (typeof value !== 'string' || !base || !value.includes('/uploads/')) return value;

    if (value.startsWith('/uploads/')) return `${base}${value}`;
    if (value.startsWith('uploads/')) return `${base}/${value}`;

    if (/^https?:\/\//i.test(value)) {
        try {
            const url = new URL(value);
            if (url.pathname.startsWith('/uploads/') && needsRewrite(url)) {
                return `${base}${url.pathname}${url.search}`;
            }
        } catch {
            /* not a URL; leave it */
        }
    }
    return value;
};

export const publicMediaUrls = (req, res, next) => {
    const base = resolveBase(req);
    if (!base) return next();

    const originalJson = res.json.bind(res);
    res.json = (body) => {
        // A replacer runs after each value's toJSON, so mongoose documents,
        // lean objects and plain values are all covered without a deep clone.
        let text;
        try {
            text = JSON.stringify(body, (_key, value) => rewriteMediaUrl(value, base));
        } catch {
            return originalJson(body);
        }
        if (text === undefined) return originalJson(body);
        if (!res.get('Content-Type')) res.set('Content-Type', 'application/json; charset=utf-8');
        return res.send(text);
    };
    next();
};
