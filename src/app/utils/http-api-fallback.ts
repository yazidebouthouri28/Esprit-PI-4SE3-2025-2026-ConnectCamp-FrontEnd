/**
 * True when the server indicates the HTTP route is missing (Spring NoResourceFoundException
 * is mapped to 404 with message "Resource not found: ..." by the backend error handler).
 */
export function isUnreachableApiRoute(err: any): boolean {
    const status = Number(err?.status ?? 0);
    if (status === 404) {
        return true;
    }
    const msg = String(err?.message ?? err?.error?.message ?? '').toLowerCase();
    return msg.includes('resource not found');
}

export function extractPagedContent<T = any>(body: any): T[] {
    if (!body) {
        return [];
    }
    if (Array.isArray(body)) {
        return body;
    }
    const data = body.data;
    if (Array.isArray(data)) {
        return data;
    }
    if (data && Array.isArray(data.content)) {
        return data.content;
    }
    if (Array.isArray(body.content)) {
        return body.content;
    }
    return [];
}
