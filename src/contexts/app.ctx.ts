import { Duration } from '@mars/common';
import { createContext, createElement, useCallback, useContext, useState } from 'react';
import { onAuthenticated } from '_hook/credential.hook';
import notif from '_service/notif';

const EXCLUDED_IDS = [2, 4];
export const AppContext = createContext<AppContext>(null);
AppContext.displayName = 'MarsApplicationContext';

export interface AppContext extends MarsApplicationInfo {
    settings: map<AppSetting[]>;
    // get(key: DTO.SettingKey): AppSetting;
}

export function useApp() {
    return useContext(AppContext);
}

export function getWitel() {
    return useApp().witel;
}

const CONFIG_CACHE: map<AppSetting> = {};
export function AppProvider(props: AppProviderProps) {
    if (!api.defaults.baseURL) api.defaults.baseURL = props.info.service.url;
    const [settings, setSettings] = useState<map<AppSetting[]>>({});

    const getSettings = useCallback(() => {
        api.get<DTO.Setting[]>('/app/config')
            .then((res) => {
                const result: map<AppSetting[]> = {};

                for (const config of res.data) {
                    const tag = config.tag || '#';
                    const configWrap = new AppSetting(config);
                    (result[tag] ||= []).push(configWrap);
                    CONFIG_CACHE[config.key] = configWrap;
                }

                setSettings(result);
            })
            .catch(notif.error.bind(notif));
        // .finally(() => );
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
        value: {
            ...props.info,
            settings
        },
    });
}

export interface AppProviderProps extends HasChild {
    info: MarsApplicationInfo;
}

export class AppSetting implements DTO.Setting {
    #key: string;
    #value: string;
    #description: string;
    #type: DTO.SettingTypDetail;

    #tag?: string;

    get key() {
        return this.#key;
    }
    get value() {
        return this.#value;
    }
    get type() {
        return this.#type;
    }
    get tag() {
        return this.#tag;
    }
    get description() {
        return this.#description;
    }

    set key(key) {
        this.#key = key;
    }
    set value(value) {
        this.#value = value;
    }
    set type(type) {
        this.#type = type;
    }
    set tag(tag) {
        this.#tag = tag;
    }
    // id: number;
    // name: string;
    // title: string;
    // type: DTO.SettingType;
    // value: string;
    // description: string;

    constructor(setting: DTO.Setting) {
        this.#key = setting.key;
        this.#type = setting.type;
        this.#value = setting.value;
        this.#tag = setting.tag;
        this.#description = setting.description;
    }

    getAsNumber() {
        switch (this.type.enum) {
            case DTO.SettingType.INTEGER:
            case DTO.SettingType.LONG:
            case DTO.SettingType.DOUBLE:
            case DTO.SettingType.SHORT:
            case DTO.SettingType.FLOAT:
                return Number(this.value);
            default:
                return null;
        }
    }

    getAsDuration() {
        if (this.type.enum !== DTO.SettingType.DURATION) return null;
        return Duration.from(this.value);
    }

    getAsArray() {
        if (this.type.enum !== DTO.SettingType.LIST) return null;
        return this.value.split('|');
    }

    getAsBoolean() {
        if (this.type.enum !== DTO.SettingType.BOOLEAN) return null;
        return ['true', 't'].includes(this.value.trim().toLowerCase());
    }
}
