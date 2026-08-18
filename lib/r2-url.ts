export function publicImageUrl(key: string): string {
  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL}/${key}`
}
