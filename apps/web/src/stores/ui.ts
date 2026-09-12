import { create } from 'zustand'

/**
 * クライアントUI状態のみを持つ。
 * サーバー状態（一覧・詳細など）は TanStack Query、URL状態は Router の担当。
 */
type UiState = {
    isMenuOpen: boolean
    theme: 'light' | 'dark' | 'system'
    openMenu: () => void
    closeMenu: () => void
    toggleMenu: () => void
    setTheme: (theme: UiState['theme']) => void
}

export const useUiStore = create<UiState>((set) => ({
    isMenuOpen: false,
    theme: 'system',
    openMenu: () => set({ isMenuOpen: true }),
    closeMenu: () => set({ isMenuOpen: false }),
    toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
    setTheme: (theme) => set({ theme }),
}))
