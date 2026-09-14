import type { ReactNode } from 'react'

import { AuthGuard } from '~/components/auth/AuthGuard'
import { AdminSidebar } from '~/components/layout/AdminSidebar'

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <AuthGuard>
            <div className='flex h-screen'>
                <AdminSidebar />
                <main className='flex-1 overflow-y-auto'>{children}</main>
            </div>
        </AuthGuard>
    )
}
