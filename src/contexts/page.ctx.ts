import { createContext } from "react";

export const PageContext = createContext<PageContext>(null);
export const PageProvider = PageContext.Provider;

export interface PageContext {
    collapsed: boolean;
    setCollapse(b: bool): void;

    loading: boolean;
    setLoading(loading: boolean): void;
}