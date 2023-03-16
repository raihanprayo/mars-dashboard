import { isArr, isBool, isUndef } from '@mars/common';
import { DependencyList, useEffect, useState } from 'react';

export function useBool(): BoolHook;
export function useBool(initial: boolean): BoolHook;
export function useBool(deps: DependencyList): BoolHook;
export function useBool(initial: boolean, deps: DependencyList): BoolHook;
export function useBool(
    initial: boolean | DependencyList = false,
    deps?: DependencyList
): BoolHook {
    const [val, setB] = useState(isBool(initial) ? initial : false);
    if (!isBool(initial)) deps = initial;

    if (isArr(deps) && deps.length > 0) {
        useEffect(() => {
            setB(!val);
        }, deps);
    }

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
