import { createContext, useContext } from "react";

export const PageContext = createContext<PageContext>(null);
export const PageProvider = PageContext.Provider;

export interface PageContext {
    collapsed: boolean;
    setCollapse(b: bool): void;

    loading: boolean;
    setLoading(loading: boolean, description?: string): void;
    setLoading(description: string): void;
}

export function usePage() {
    return useContext(PageContext);
}