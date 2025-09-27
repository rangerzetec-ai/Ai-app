import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  threshold?: number;
}

export function useInfiniteScroll({
  hasNextPage,
  fetchNextPage,
  threshold = 100,
}: UseInfiniteScrollOptions) {
  const [isFetching, setIsFetching] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  const handleIntersection = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      
      if (entry.isIntersecting && hasNextPage && !isFetching) {
        setIsFetching(true);
        try {
          await fetchNextPage();
        } catch (error) {
          console.error('Failed to fetch next page:', error);
        } finally {
          setIsFetching(false);
        }
      }
    },
    [hasNextPage, fetchNextPage, isFetching]
  );

  useEffect(() => {
    if (targetRef.current && hasNextPage) {
      observerRef.current = new IntersectionObserver(handleIntersection, {
        rootMargin: `${threshold}px`,
      });

      observerRef.current.observe(targetRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, hasNextPage, threshold]);

  const setTarget = useCallback((node: HTMLDivElement | null) => {
    targetRef.current = node;
  }, []);

  return { setTarget, isFetching };
}
