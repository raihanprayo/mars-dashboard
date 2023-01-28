import axios from 'axios';
import { createContext, createElement, useContext, useEffect, useState } from 'react';

export const AppContext = createContext<AppContext>(null);
export interface AppContext extends MarsApplicationInfo {
    readonly witel: Mars.Witel;
}

export function useApp() {
    return useContext(AppContext);
}

export function getWitel() {
    return useApp().witel;
}

export function AppProvider(props: HasChild) {
    const [info, setInfo] = useState<MarsApplicationInfo>();

    useEffect(() => {
        axios.get<MarsApplicationInfo>('/api/info').then((res) => {
            setInfo(res.data);
            api.defaults.baseURL = res.data.service.url;
        });
    }, []);

    return createElement(AppContext.Provider, {
        children: props.children,
        value: {
            ...info,
        },
    });
}
