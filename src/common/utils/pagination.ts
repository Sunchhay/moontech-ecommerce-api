export type PageQuery = { page?: string | number; pageSize?: string | number };
export function parsePage({ page = 1, pageSize = 20 }: PageQuery) {
    const p = Math.max(parseInt(page as any, 10) || 1, 1);
    const s = Math.min(Math.max(parseInt(pageSize as any, 10) || 20, 1), 100);
    return { page: p, pageSize: s, skip: (p - 1) * s, take: s };
}
