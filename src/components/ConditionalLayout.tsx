'use client';

import { usePathname } from 'next/navigation';
import { useIsAdmin } from '@/lib/auth-context';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAdmin = useIsAdmin();
  
  // Check if we should show sidebar (manager/admin routes)
  const shouldShowSidebar = isAdmin;
  
  // Check if this is a learner route that should have no padding
  const isHomeRoute = pathname === '/';
  const isLoginRoute = pathname === '/login';
  const padding = isHomeRoute || isLoginRoute ? '' : 'p-6';
  
  if (shouldShowSidebar) {
    // Manager/admin routes: with sidebar
    return (
      <main className="lg:pl-16 min-h-screen transition-all duration-300">
        <div className={padding}>
          {children}
        </div>
      </main>
    );
  }
  
  // Default routes: no sidebar but with padding
  return (
    <main className="min-h-screen">
      <div className={padding}>
        {children}
      </div>
    </main>
  );
}
