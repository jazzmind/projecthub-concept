'use client';

export default function SkeletonProjectCard() {
  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg h-80 flex flex-col animate-pulse">
      {/* Image skeleton */}
      <div className="relative h-40 bg-gray-200 dark:bg-gray-700">
        <div className="absolute top-3 right-3">
          <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
        <div className="absolute top-3 left-3">
          <div className="w-16 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="p-5 flex flex-col flex-1 min-h-0">
        {/* Title skeleton */}
        <div className="mb-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
        
        {/* Description skeleton */}
        <div className="mb-4 flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
        
        {/* Footer skeleton */}
        <div className="flex items-center justify-between mt-auto">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonHeroCard() {
  return (
    <div className="hero-project animate-pulse">
      <div className="hero-project-image bg-gray-300 dark:bg-gray-700"></div>
      <div className="hero-project-overlay bg-black/60"></div>
      <div className="hero-project-content">
        <div className="max-w-3xl h-full flex flex-col justify-between py-0">
          {/* Main content area */}
          <div className="flex-1 min-h-0">
            {/* Tags skeleton */}
            <div className="flex items-center gap-3 mb-2 lg:mb-3">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <div className="h-4 bg-gray-400 rounded w-32"></div>
              <div className="h-6 bg-gray-400 rounded-full w-20"></div>
              <div className="h-6 bg-gray-400 rounded-full w-24"></div>
            </div>
            
            {/* Title skeleton */}
            <div className="mb-2 lg:mb-3">
              <div className="h-8 lg:h-12 bg-gray-400 rounded mb-2"></div>
              <div className="h-8 lg:h-12 bg-gray-400 rounded w-4/5 mb-2"></div>
              <div className="h-8 lg:h-12 bg-gray-400 rounded w-3/5"></div>
            </div>
            
            {/* Description skeleton */}
            <div className="mb-2 lg:mb-3">
              <div className="h-5 lg:h-6 bg-gray-400 rounded mb-2"></div>
              <div className="h-5 lg:h-6 bg-gray-400 rounded w-5/6"></div>
            </div>
            
            {/* Meta skeleton */}
            <div className="flex items-center gap-4 mb-2 lg:mb-3">
              <div className="h-4 bg-gray-400 rounded w-20"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="h-4 bg-gray-400 rounded w-24"></div>
            </div>
          </div>
          
          {/* Buttons skeleton */}
          <div className="flex items-center gap-4 flex-shrink-0 pt-6 lg:pt-8">
            <div className="h-12 lg:h-14 bg-gray-400 rounded-xl w-36"></div>
            <div className="h-12 lg:h-14 bg-gray-400/30 rounded-xl w-28"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
