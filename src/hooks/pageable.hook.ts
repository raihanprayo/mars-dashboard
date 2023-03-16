import { isArr, isNull, isStr } from '@mars/common';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';

export function usePageable(defaultSort?: PageableSort): PageableHook {
    const router = useRouter();

    const [sorter, setSorter] = useState<PageableSortTupple[]>([]);
    const [pageable, setPageable] = useState<Pageable>({
        page: Number(router.query.page || 0),
        size: Number(router.query.size || 10),
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

            const indexField = findSortedField(field);
            if (indexField > -1) {
                const tempSorter = [...sorter];
                tempSorter[indexField] = [field, orderEnm];
                setSorter(tempSorter);
            } else {
                setSorter([...sorter, [field, orderEnm]]);
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
            if (sorter.length === 1) {
                setPageable((prev) => ({ ...prev, sort: sorter[0] }));
            } else {
                setPageable((prev) => ({ ...prev, sort: sorter }));
            }
        } else setPageable((prev) => ({ ...prev, sort: Pageable.Sorts.UNSORT }));
    }, [sorter]);

    return {
        pageable,
        updateSort(field, order) {
            if (isStr(order)) addSortOrder(field, order);
            else rmSortOrder(field);
        },
        setPageable(v = {}) {
            setPageable((t) => ({ ...t, ...v }));
        },
    };
}

export interface PageableHook {
    pageable: Pageable;
    setPageable(v: Partial<Pageable>): void;
    updateSort(field: string, order: 'ascend' | 'descend' | null): void;
}
