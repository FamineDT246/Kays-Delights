import { useState, useCallback, useRef } from 'react';

export function usePagination(pageSize = 15) {
  const pageRef = useRef(0);
  const [hasMore, setHasMore] = useState(true);

  const getRange = useCallback((targetPage) => {
    const from = targetPage * pageSize;
    const to = from + pageSize - 1;
    return { from, to };
  }, [pageSize]);

  const resetPage = useCallback(() => {
    pageRef.current = 0;
    setHasMore(true);
    return getRange(0);
  }, [getRange]);

  const nextPage = useCallback(() => {
    pageRef.current += 1;
    return getRange(pageRef.current);
  }, [getRange]);

  const evaluateHasMore = useCallback((currentLoaded, totalCount) => {
    setHasMore(currentLoaded < totalCount);
  }, []);

  return { 
    page: pageRef.current, 
    hasMore, 
    resetPage, 
    nextPage, 
    evaluateHasMore 
  };
}