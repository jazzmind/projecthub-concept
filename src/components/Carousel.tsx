'use client';

import { ReactNode, useMemo, useRef, useState, useEffect } from 'react';

interface CarouselProps {
  children: ReactNode[] | ReactNode;
  title?: string;
  itemWidthClass?: string; // e.g., 'w-80'
  autoPlay?: boolean;
  interval?: number;
  showProgress?: boolean;
  heroMode?: boolean;
}

export default function Carousel({ 
  children, 
  title, 
  itemWidthClass = 'w-80', 
  autoPlay = false,
  interval = 5000,
  showProgress = false,
  heroMode = false
}: CarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const items = useMemo(() => (Array.isArray(children) ? children : [children]), [children]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isHovered || items.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, interval);
    
    return () => clearInterval(timer);
  }, [autoPlay, interval, isHovered, items.length]);

  // Smooth scroll to item
  useEffect(() => {
    if (!containerRef.current || !autoPlay) return;
    
    const container = containerRef.current;
    const itemWidth = container.children[0]?.clientWidth || 320;
    const scrollPosition = currentIndex * (itemWidth + 16); // include gap
    
    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
  }, [currentIndex, autoPlay]);

  const scrollBy = (dir: number) => {
    const el = containerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-carousel-item]');
    const delta = (card?.offsetWidth || 320) + 16; // include gap
    el.scrollBy({ left: dir * delta, behavior: 'smooth' });
    
    // Update current index for progress tracking
    if (autoPlay) {
      const newIndex = Math.max(0, Math.min(items.length - 1, currentIndex + dir));
      setCurrentIndex(newIndex);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (heroMode) {
    return (
      <div 
        className="relative h-[70vh] w-full max-w-full overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute inset-0 transition-all duration-1000 ease-out">
          {items[currentIndex]}
        </div>
        
        {/* Navigation */}
        <button
          type="button"
          aria-label="Previous"
          onClick={() => goToSlide((currentIndex - 1 + items.length) % items.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          type="button"
          aria-label="Next"
          onClick={() => goToSlide((currentIndex + 1) % items.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Progress indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex ? 'bg-white w-8' : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
        
        {/* Auto-play progress bar */}
        {autoPlay && showProgress && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20 z-10">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ 
                width: `${((Date.now() % interval) / interval) * 100}%`,
                animation: isHovered ? 'paused' : 'none'
              }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-full">
      {title && (
        <div className="flex items-center justify-between mb-6 px-4">
          <h3 className="text-2xl font-bold text-foreground dark:text-white">{title}</h3>
          <div className="text-sm text-muted-foreground dark:text-gray-400">{items.length} items</div>
        </div>
      )}
      <div 
        className="group relative w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          type="button"
          aria-label="Previous"
          onClick={() => scrollBy(-1)}
          className="opacity-0 group-hover:opacity-100 absolute left-2 top-1/2 -translate-y-1/2 z-10 h-12 w-12 bg-black/70 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div
          ref={containerRef}
          className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 scrollbar-hide px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((child, idx) => (
            <div
              key={idx}
              data-carousel-item
              className={`${itemWidthClass} h-[24rem] shrink-0 snap-start flex-shrink-0`}
            >
              {child}
            </div>
          ))}
        </div>
        
        <button
          type="button"
          aria-label="Next"
          onClick={() => scrollBy(1)}
          className="opacity-0 group-hover:opacity-100 absolute right-2 top-1/2 -translate-y-1/2 z-10 h-12 w-12 bg-black/70 hover:bg-black/90 text-white rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}


