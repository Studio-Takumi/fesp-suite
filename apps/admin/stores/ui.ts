import { create } from 'zustand'

/** 管理画面のクライアントUI状態のみ（サーバー状態・同期状態は持たせない） */
type AdminUiState = {
    isSidebarOpen: boolean
    toggleSidebar: () => void
}

export const useAdminUiStore = create<AdminUiState>((set) => ({
    isSidebarOpen: true,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}))
