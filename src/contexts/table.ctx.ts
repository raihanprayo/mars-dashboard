import { isArr, isDefined } from '@mars/common';
import { Table, TablePaginationConfig } from 'antd';
import {
    FilterValue,
    SorterResult,
    TableCurrentDataSource,
} from 'antd/lib/table/interface';
import { createContext, createElement, useContext, useState } from 'react';
import pages from 'src/pages';

const MarsTableContext = createContext<MarsTableContext>(null);
export interface MarsTableContext {
    readonly openFilter: boolean;
    toggleFilter(open?: boolean): void;

    refresh(): OrPromise<any>;
}

export const MarsTableConsumer = MarsTableContext.Consumer;
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
    const { pageable, setPageable, total } = opt;

    return {
        total: total,
        current: pageable.page + 1,
        pageSize: pageable.size,
        pageSizeOptions: [10, 20, 50, 100, 200, 500, 1000],
        hideOnSinglePage: false,
        defaultCurrent: 1,
        defaultPageSize: 50,
        showSizeChanger: true,
        onChange(page, pageSize) {
            const actualPage = page - 1;

            const n: Partial<Pageable> = {};
            if (pageable.page !== actualPage) n.page = actualPage;
            if (pageable.size !== pageSize) n.size = pageSize;

            setPageable(n);
        },
    };
}

export interface MarsTablePaginationOptions {
    total: number;
    pageable: Pageable;
    setPageable(pageable: Partial<Pageable>): void;
}

type TableOnchange<R> = (
    pagination: TablePaginationConfig,
    filters: map<FilterValue | null>,
    sorter: SorterResult<R> | SorterResult<R>[],
    extra: TableCurrentDataSource<R>
) => void;

export function MarsTableSorter<R>(opt: MarsTableSorterOptions<R>): TableOnchange<R> {
    // return TableProps
    return (pagination, filters, sorter, extra) => {
        if (extra.action === 'sort') {
            if (!isArr(sorter)) {
                const { column, order, field } = sorter;
                const f = !isArr(field) ? String(field) : field.join('.');
                opt.updateSort(f, order);
            } else {
                for (const sortProp of sorter) {
                    const { column, order, field } = sortProp;
                    const f = !isArr(field) ? String(field) : field.join('.');
                    opt.updateSort(f, order);
                }
            }
        } else opt.onChange?.(pagination, filters, sorter, extra);
    };
}

export interface MarsTableSorterOptions<R> {
    updateSort(field: string, direction: 'ascend' | 'descend'): void;
    onChange?: TableOnchange<R>;
}
