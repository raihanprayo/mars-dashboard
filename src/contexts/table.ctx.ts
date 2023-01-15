import { isDefined } from '@mars/common';
import { createContext, createElement, useContext, useState } from 'react';

export {};

const MarsTableContext = createContext<MarsTableContext>(null);

export function MarsTableProvider(props: HasChild): JSX.Element {
    const [filter, setFilter] = useState(false);

    return createElement(MarsTableContext.Provider, {
        value: {
            openFilter: filter,
            toggleFilter(open) {
                if (!isDefined(open)) setFilter(!filter);
                else setFilter(open);
            },
        },
        children: props.children,
    });
}

export function useMarsTable() {
    return useContext(MarsTableContext);
}

export interface MarsTableContext {
    readonly openFilter: boolean;
    toggleFilter(open?: boolean): void;
}
