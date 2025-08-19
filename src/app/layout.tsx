import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthBridge } from '@/lib/auth-bridge'
import Navigation from '@/components/Navigation'
import AdminSidebar from '@/components/AdminSidebar'
import ConditionalLayout from '@/components/ConditionalLayout'

export const metadata: Metadata = {
  title: 'ProjectHub',
  description: 'A platform for sourcing and managing industry projects and partner companies',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const h = await headers()
  // Convert to a plain object eagerly; don't pass the dynamic headers iterable
  const plain: Record<string, string> = Object.fromEntries((h as any).entries())
  const initialUser = await AuthBridge.getInitialUserFromHeaderObject(plain)
  return (
    <html lang="en">
      <body className="min-h-screen bg-white dark:bg-gray-900">
        <AuthProvider initialUser={initialUser as any}>
          <Navigation />
          <AdminSidebar />
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthProvider>
      </body>
    </html>
  )
}

