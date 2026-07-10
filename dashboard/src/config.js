// Configuration for API endpoints
// If VITE_API_URL is set (e.g. in production), use it.
// Otherwise, default to empty string which means relative paths (proxied in dev).

function normalizeApiBaseUrl(raw) {
    const trimmed = (raw || '').trim().replace(/\/+$/, '');
    if (!trimmed) return '';

    // Missing https:// makes the browser treat the host as a relative path:
    // dashboard.zeabur.app/opensorts-be.zeabur.app/api/...
    if (!/^https?:\/\//i.test(trimmed)) {
        return `https://${trimmed.replace(/^\/+/, '')}`;
    }
    return trimmed;
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

export const getApiUrl = (path) => {
    if (path.startsWith('http')) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
};

export function encodeBase64Utf8(text) {
    return btoa(unescape(encodeURIComponent(text)));
}

export function getYoutubeCookieHeaders(youtubeCookies) {
    const trimmed = (youtubeCookies || '').trim();
    if (!trimmed) return {};
    return { 'X-YouTube-Cookies-Base64': encodeBase64Utf8(trimmed) };
}

export async function parseJsonResponse(res) {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
        const text = await res.text();
        const preview = text.slice(0, 120).replace(/\s+/g, ' ');
        throw new Error(
            `Expected JSON from ${res.url}, got ${contentType || 'unknown type'}. ` +
            `Check VITE_API_URL points to the backend (not renderer/dashboard). Preview: ${preview}`
        );
    }
    return res.json();
}
