/**
 * Validasi username: 3–30 karakter, hanya alphanumeric dan underscore.
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: "Username tidak boleh kosong." };
  }
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return { valid: false, error: "Username minimal 3 karakter." };
  }
  if (trimmed.length > 30) {
    return { valid: false, error: "Username maksimal 30 karakter." };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: "Username hanya boleh huruf, angka, dan underscore (_)." };
  }
  return { valid: true };
}

/**
 * Validasi judul desain: tidak boleh kosong setelah trim.
 */
export function validateTitle(title: string): boolean {
  return title.trim().length > 0;
}

/**
 * Filter desain berdasarkan query (case-insensitive match pada judul).
 */
export function filterDesigns<T extends { title: string }>(
  designs: T[],
  query: string
): T[] {
  if (!query.trim()) return designs;
  const q = query.trim().toLowerCase();
  return designs.filter((d) => d.title.toLowerCase().includes(q));
}

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";

/**
 * Sort desain berdasarkan opsi yang dipilih.
 */
export function sortDesigns<T extends { title: string; updated_at?: string | null; created_at: string }>(
  designs: T[],
  sort: SortOption
): T[] {
  const arr = [...designs];
  switch (sort) {
    case "newest":
      return arr.sort((a, b) => {
        const da = new Date(a.updated_at ?? a.created_at).getTime();
        const db = new Date(b.updated_at ?? b.created_at).getTime();
        return db - da;
      });
    case "oldest":
      return arr.sort((a, b) => {
        const da = new Date(a.updated_at ?? a.created_at).getTime();
        const db = new Date(b.updated_at ?? b.created_at).getTime();
        return da - db;
      });
    case "name-asc":
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case "name-desc":
      return arr.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return arr;
  }
}
