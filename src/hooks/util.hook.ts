import { useState } from 'react';

export function useBool(initial = false): BoolHook {
    const [val, setB] = useState(initial);
    return {
        value: val,
        setValue(b: boolean) {
            setB(b);
        },
        toggle() {
            setB(!val);
        },
    };
}
export interface BoolHook {
    readonly value: boolean;
    setValue(b: boolean): void;
    toggle(): void;
}
