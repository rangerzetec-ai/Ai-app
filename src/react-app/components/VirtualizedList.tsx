import React, { useRef } from 'react';
import { useVirtualization } from '@/react-app/hooks/useVirtualization';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T, index: number) => string | number;
  className?: string;
  overscan?: number;
}

export default function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  renderItem,
  getItemKey,
  className = '',
  overscan = 5,
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    visibleItems,
    totalHeight,
    handleScroll,
  } = useVirtualization({
    items,
    itemHeight,
    containerHeight: height,
    overscan,
  });

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((item) => (
          <div
            key={getItemKey(item, item.index)}
            style={{
              position: 'absolute',
              top: item.offsetY,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, item.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
