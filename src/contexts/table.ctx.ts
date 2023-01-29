import { isDefined } from '@mars/common';
import { TablePaginationConfig } from 'antd';
import { createContext, createElement, useContext, useState } from 'react';

const MarsTableContext = createContext<MarsTableContext>(null);
export interface MarsTableContext {
    readonly openFilter: boolean;
    toggleFilter(open?: boolean): void;

    refresh(): OrPromise<any>;
}

export function MarsTableProvider(props: MarsTableProviderProps): JSX.Element {
    const [filter, setFilter] = useState(false);

    return createElement(MarsTableContext.Provider, {
        value: {
            refresh: props.refresh,
            openFilter: filter,
            toggleFilter(open) {
                if (!isDefined(open)) setFilter(!filter);
                else setFilter(open);
            },
        },
        children: props.children,
    });
}
export interface MarsTableProviderProps extends HasChild {
    refresh(): OrPromise<any>;
}

export function useMarsTable() {
    return useContext(MarsTableContext);
}

export function MarsTablePagination(
    opt: MarsTablePaginationOptions
): TablePaginationConfig {
    const { pageable, refresh, setPageable, total } = opt;

    return {
        total: total,
        current: pageable.page + 1,
        pageSizeOptions: [10, 20, 50, 100, 200],
        hideOnSinglePage: false,
        onChange(page, pageSize) {
            if (pageable.page !== page - 1) {
                setPageable({ page: page - 1 });
                refresh();
            }
        },
        onShowSizeChange(current, size) {
            if (current !== size) {
                setPageable({ size });
                refresh();
            }
        },
    };
}

export interface MarsTablePaginationOptions {
    total: number;
    pageable: Pageable;
    setPageable(pageable: Partial<Pageable>): void;
    refresh(): void;
}
