import { isDefined, isStr } from '@mars/common';
import { Popover, Spin } from 'antd';
import axios from 'axios';
import {
    createContext,
    createElement,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
import { onAuthenticated } from '_hook/credential.hook';
import { useBool } from '_hook/util.hook';

// const cache = new Map<string, Partial<DTO.Users>>();
const CreatedByContext = createContext<CreatedByContext>({
    users: {},
    include: () => {},
    getName: (n) => 'Unknown User',
    hasName: (n) => false,
});
interface CreatedByContext {
    users: map<Partial<DTO.Users>>;
    include(nik: string): void;
    getName(nik: string): string;
    hasName(nik: string): boolean;
}

export function CreatedBy<T extends map>(props: CreatedByProps<T>) {
    const field = props.field || 'createdBy';
    const identifier = isStr(props.data) ? props.data : props.data[field];

    const createdBy = CreatedBy.use();
    const name = createElement('i', {}, createdBy.getName(identifier));
    const content = <Spin spinning={!createdBy.hasName(identifier)}>{name}</Spin>;

    onAuthenticated(() => {
        if (props.replace) createdBy.include(identifier);
    });

    if (props.replace) return <span>{name || identifier}</span>;

    return (
        <Popover
            // title={cache.get(nik)?.name}
            content={content}
            onOpenChange={(open) => open && createdBy.include(identifier)}
        >
            <span>{identifier}</span>
        </Popover>
    );
}

export interface CreatedByProps<T extends map | string> {
    data: T;
    field?: T extends string ? T : T extends map ? keyof T : never;
    replace?: boolean;
}

const inRequest: string[] = [];
CreatedBy.Provider = function CreatedByProvider(props: HasChild) {
    const [details, setDetails] = useState<map<Partial<DTO.Users>>>({});

    console.log('Current Details --', details);
    const includeDetail = useCallback((identifier: string) => {
        console.log('Get Detail --', identifier);

        if (inRequest.includes(identifier)) return;
        else if (isDefined(details[identifier])) return;

        inRequest.push(identifier);
        api.get<DTO.Users>('/user/detail/' + identifier)
            .then((res) => {
                setDetails((p) => ({
                    ...p,
                    [identifier]: {
                        id: res.data.id,
                        name: res.data.name,
                        nik: res.data.nik,
                        roles: res.data.roles,
                    },
                }));
            })
            .catch((err) => {
                if (axios.isAxiosError(err)) {
                    const response = err.response;

                    if (response && response.status === 404) {
                        setDetails((p) => ({
                            ...p,
                            [identifier]: { name: 'Deleted User' },
                        }));
                    }
                }
            })
            .finally(() => inRequest.splice(inRequest.indexOf(identifier), 1));
    }, []);

    const getName = (nik: string) => {
        if (!isDefined(details[nik])) return 'Unknown User';
        const user = details[nik];

        if (isDefined(user.id)) return user.name;
        else return `${nik} (${user.name})`;
    };

    const hasName = (nik: string) => isDefined(details[nik]);

    return (
        <CreatedByContext.Provider
            value={{
                users: details,
                include: includeDetail,
                getName,
                hasName,
            }}
        >
            {props.children}
        </CreatedByContext.Provider>
    );
};

CreatedBy.use = function useCreatedBy() {
    return useContext(CreatedByContext);
};
