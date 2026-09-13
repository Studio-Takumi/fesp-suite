import type { ReactNode } from 'react'

import { AdminSidebar } from '~/components/layout/AdminSidebar'

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className='flex h-screen'>
            <AdminSidebar />
            <main className='flex-1 overflow-y-auto'>{children}</main>
        </div>
    )
}
