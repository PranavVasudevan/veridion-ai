import { create } from 'zustand';

interface UIState {
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;
    commandPaletteOpen: boolean;
    mobileMenuOpen: boolean;
    activePage: string;
    toasts: { id: string; type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }[];
    setSidebarOpen: (open: boolean) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setCommandPaletteOpen: (open: boolean) => void;
    setMobileMenuOpen: (open: boolean) => void;
    setActivePage: (page: string) => void;
    addToast: (toast: Omit<UIState['toasts'][0], 'id'>) => void;
    removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
    sidebarOpen: true,
    sidebarCollapsed: false,
    commandPaletteOpen: false,
    mobileMenuOpen: false,
    activePage: 'dashboard',
    toasts: [],
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
    setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
    setActivePage: (page) => set({ activePage: page }),
    addToast: (toast) => {
        const id = Math.random().toString(36).substring(2, 9);
        set({ toasts: [...get().toasts, { ...toast, id }] });
        setTimeout(() => get().removeToast(id), 5000);
    },
    removeToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
