import { isArr, isNull, isStr } from '@mars/common';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { useBool } from './util.hook';

const disableMultipleSort = true;
export function usePageable(defaultSort?: PageableSort): PageableHook {
    const router = useRouter();

    const [sorter, setSorter] = useState<PageableSortTupple[]>([]);
    const [pageable, setPageable] = useState<Pageable>({
        page: Number(router.query.page || usePageable.DEFAULT_PAGE),
        size: Number(router.query.size || usePageable.DEFAULT_SIZE),
        sort: isArr(defaultSort) ? defaultSort : Pageable.Sorts.UNSORT,
    });

    const findSortedField = (field: string) => {
        for (let i = 0; i < sorter.length; i++) {
            const [f, o] = sorter[i];
            if (f === field) return i;
        }
        return -1;
    };

    const addSortOrder = useCallback(
        (field: string, order: 'ascend' | 'descend') => {
            const orderEnm =
                order === 'ascend' ? Pageable.Sorts.ASC : Pageable.Sorts.DESC;

            if (disableMultipleSort) {
                setSorter([[field, orderEnm]]);
            } else {
                const indexField = findSortedField(field);
                if (indexField > -1) {
                    const tempSorter = [...sorter];
                    tempSorter[indexField] = [field, orderEnm];
                    setSorter(tempSorter);
                } else {
                    setSorter([...sorter, [field, orderEnm]]);
                }
            }
        },
        [pageable.sort]
    );
    const rmSortOrder = useCallback(
        (field: string) => {
            const indexField = findSortedField(field);
            if (indexField === -1) return;

            const tempSorter = [...sorter];
            tempSorter.splice(indexField, 1);
            setSorter(tempSorter);
        },
        [pageable.sort]
    );

    useEffect(() => {
        if (sorter.length > 0) {
            const p = { ...pageable };
            if (sorter.length === 1) p.sort = sorter[0];
            else p.sort = sorter;
            setPageable({ ...p });
            refreshPage(p);
        } else {
            const p = { ...pageable };
            p.sort = Pageable.Sorts.UNSORT;
            setPageable(p);
            refreshPage(p);
        }
    }, [sorter]);

    // useEffect(() => {
    //     if (!inited.value)
    // }, [pageable]);

    const refreshPage = (pageable: Pageable) => {
        router.push({
            pathname: router.pathname,
            query: api.serializeParam({
                ...router.query,
                page: pageable.page,
                size: pageable.size,
                sort: pageable.sort === Pageable.Sorts.UNSORT ? undefined : pageable.sort,
            }),
        });
    };

    return {
        pageable,
        updateSort(field, order) {
            if (isStr(order)) addSortOrder(field, order);
            else rmSortOrder(field);
        },
        setPageable(v = {}) {
            const m = { ...pageable, ...v };
            setPageable(m);
            refreshPage(m);
        },
    };
}
usePageable.DEFAULT_SIZE = 50;
usePageable.DEFAULT_PAGE = 0;

export interface PageableHook {
    pageable: Pageable;
    setPageable(v: Partial<Pageable>): void;
    updateSort(field: string, order: 'ascend' | 'descend' | null): void;
}
