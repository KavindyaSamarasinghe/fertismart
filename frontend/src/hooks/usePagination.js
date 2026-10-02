import { useEffect, useMemo, useState } from "react";

// Client-side pagination: slices an already-loaded array into pages.
export default function usePagination(items, pageSize = 10) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // If the list shrinks (filtering, deletion), fall back to a valid page.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );

  return { page, setPage, totalPages, pageItems, total: items.length, pageSize };
}