import { useRouter } from "next/router";
import { useState } from "react";

export function usePageable(defaultSort?: string): PageableHook {
    const router = useRouter();
    const [pageable, setPageable] = useState<Pageable>({
        page: Number(router.query.page || 0),
        size: Number(router.query.size || 50),
        sort: {}
    });

    return {
        pageable,
        setPageable(v = {}) {
            setPageable((t) => ({ ...t, ...v }));
        },
    };
}

export interface PageableHook {
    pageable: Pageable;
    setPageable(v: Partial<Pageable>): void;
}