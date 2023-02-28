import { Duration } from '@mars/common';
import { createContext, createElement, useCallback, useContext, useState } from 'react';
import { onAuthenticated } from '_hook/credential.hook';
import notif from '_service/notif';

const EXCLUDED_IDS = [2, 4];
export const AppContext = createContext<AppContext>(null);
AppContext.displayName = 'MarsApplicationContext';

export interface AppContext extends MarsApplicationInfo {
    settings: AppSetting[];
}

export function useApp() {
    return useContext(AppContext);
}

export function getWitel() {
    return useApp().witel;
}

export function AppProvider(props: AppProviderProps) {
    api.defaults.baseURL = props.info.service.url;
    const [settings, setSettings] = useState<AppSetting[]>([]);

    const getSettings = useCallback(() => {
        api.get<DTO.Setting[]>('/app/config')
            .then((res) => {
                setSettings(
                    res.data
                        .filter((s) => !EXCLUDED_IDS.includes(s.id))
                        .map((s) => new AppSetting(s))
                );
            })
            .catch(notif.error.bind(notif));
    }, []);

    onAuthenticated(() => {
        getSettings();
        window.addEventListener('refresh-setting', getSettings);
        return () => {
            window.removeEventListener('refresh-setting', getSettings);
        };
    });

    return createElement(AppContext.Provider, {
        children: props.children,
        value: { ...props.info, settings },
    });
}

export interface AppProviderProps extends HasChild {
    info: MarsApplicationInfo;
}

export class AppSetting implements DTO.Setting {
    id: number;
    name: string;
    title: string;
    type: DTO.SettingType;
    value: string;
    description: string;

    constructor(setting: DTO.Setting) {
        Object.keys(setting).forEach((k) => {
            this[k] = setting[k];
        });
    }

    getAsNumber() {
        switch (this.type) {
            case DTO.SettingType.DURATION:
                return Duration.from(this.value).toMilis();
            case DTO.SettingType.NUMBER:
                return Number(this.value);
            default:
                return null;
        }
    }

    getAsDuration() {
        if (this.type !== DTO.SettingType.DURATION) return null;
        return Duration.from(this.value);
    }

    getAsArray() {
        if (this.type !== DTO.SettingType.ARRAY) return null;
        return this.value.split('|');
    }

    getAsBoolean() {
        if (this.type !== DTO.SettingType.BOOLEAN) return null;
        return ['true', 't'].includes(this.value.trim().toLowerCase());
    }

    getAsJson() {
        if (this.type !== DTO.SettingType.JSON) return null;
        return JSON.parse(this.value);
    }
}
