/**
 * Supabase/PostgREST caps every response at 1,000 rows (server `max-rows`).
 * Any query that can grow past that must page through with .range().
 *
 * `page(from, to)` must build a *fresh* query each call with a deterministic
 * order (add a unique tiebreaker such as `id`), ending in `.range(from, to)`.
 */
export async function fetchAllRows<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1)
    if (error) throw new Error(error.message)
    const chunk = data ?? []
    rows.push(...chunk)
    if (chunk.length < pageSize) return rows
  }
}
