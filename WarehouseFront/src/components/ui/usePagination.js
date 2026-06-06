import { useState } from 'react';

// Pagination klient-anësor i ripërdorshëm. I jep një liste të plotë (tashmë
// të filtruar/renditur) dhe kthen pjesën e faqes aktuale + kontrollet e gjendjes.
//
//   const pg = usePagination(rows, 10);
//   pg.pageItems.map(...)        // rreshtat e faqes aktuale
//   <Pagination pagination={pg} />
export function usePagination(items, initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Nëse rreshtat pakësohen (p.sh. pas filtrimit), `page` i ruajtur mund të dalë
  // jashtë intervalit. NUK e "snap-ojmë" me efekt (do shkaktonte render kaskadë);
  // në vend të kësaj derivojmë faqen efektive dhe kontrollet veprojnë mbi të, kështu
  // çdo klikim Prev/Next e rikthen `page` brenda intervalit të vlefshëm.
  const effectivePage = Math.min(page, totalPages);
  const pageItems = items.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);

  const changePageSize = (v) => { setPageSize(v); setPage(1); };

  return {
    page: effectivePage,
    setPage,
    pageSize,
    setPageSize: changePageSize,
    total,
    totalPages,
    pageItems,
    start: total === 0 ? 0 : (effectivePage - 1) * pageSize + 1,
    end: Math.min(effectivePage * pageSize, total),
  };
}
