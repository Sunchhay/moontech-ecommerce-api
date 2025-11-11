export function slugify(name: string) {
    return name
        ?.toLowerCase()
        ?.normalize('NFKD')
        ?.replace(/[^\w\s-]/g, '')
        ?.trim()
        ?.replace(/\s+/g, '-')
        ?.replace(/-+/g, '-');
}
