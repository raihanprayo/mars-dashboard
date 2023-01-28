import { createContext, createElement, useContext, useEffect, useState } from 'react';

export const AppContext = createContext<AppContext>(null);
AppContext.displayName = 'MarsApplicationContext'

export interface AppContext extends MarsApplicationInfo {
}

export function useApp() {
    return useContext(AppContext);
}

export function getWitel() {
    return useApp().witel;
}

export function AppProvider(props: AppProviderProps) {
    api.defaults.baseURL = props.info.service.url;

    return createElement(AppContext.Provider, {
        children: props.children,
        value: {...props.info},
    });
}

export interface AppProviderProps extends HasChild {
    info: MarsApplicationInfo;
}
