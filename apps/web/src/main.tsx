import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'

import './index.css'
import { createQueryClient } from './lib/query-client'
import { router } from './router'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('#root が見つかりません')

const queryClient = createQueryClient()

createRoot(rootElement).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    </StrictMode>,
)
