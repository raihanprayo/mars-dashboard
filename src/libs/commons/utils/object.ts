import { kebabCaseToCamelCase } from "./string";
import {
    isPrimitive,
    isArr,
    isNull,
    isDefined,
    isUndef,
    isFn,
    isObj,
    isBoxedPrimitive,
} from "./guards";

export function objectSort<T extends object>(o: T, compareFn?: (a: any, b: any) => number): T {
    if (typeof o === "object" && !isNull(o)) {
        if (isArr(o)) return o.sort(compareFn);
        else {
            const keys = Object.keys(o).sort(compareFn);
            return keys.reduce(function (prev, current) {
                prev[current] = o[current];
                return prev;
            }, {}) as T;
        }
    }
    return o;
}

/**
 * @returns a copy of target that has been merged with source(s). `Wouldn't` change anything from target.
 */
export function objectMerge<A extends obj, B extends obj>(target: A, source1: B): A & B;
export function objectMerge<A extends obj, B extends obj, C extends obj>(
    target: A,
    source1: B,
    source2: C
): A & B & C;
export function objectMerge<A extends map, B extends map, C extends map, D extends map>(
    target: A,
    source1: B,
    source2: C,
    source3: D
): A & B & C & D;
export function objectMerge<
    A extends map,
    B extends map,
    C extends map,
    D extends map,
    E extends map
>(target: A, source1: B, source2: C, source3: D, source4: E): A & B & C & D & E;
export function objectMerge(target: obj, ...sources: obj[]): obj;
export function objectMerge(...sources: obj[]): obj {
    const [target, ...others] = sources;
    let result = isArr(target) ? [] : {};

    function merge(target: obj, source: obj) {
        const keys = Object.keys(source);
        for (const key of keys) {
            const value = source[key];
            if (isObj(value)) {
                if (isFn(value) || isBoxedPrimitive(value)) target[key] = value;
                else if (isArr(value)) target[key] = merge([], value);
                else target[key] = merge({}, value);
            } else {
                target[key] = value;
            }
        }
        return target;
    }

    return sources.reduce(merge, result);
}

/**
 * make eumerable key of an object as 1 merged key.
 * @example
 * const item1 = {
 *    its: 'success'
 * }
 * const obj = {
 *    a: 123,
 *    b: {
 *       hello: 'hello',
 *       'kebab-case-key': 123
 *       arr: [ item1, item2, item3 ]
 *    }
 * }
 * // end result
 * let result = {
 *    a: 123,
 *    "b.hello": 'hello',
 * // option.camelCaseKey = true
 *    kebabCaseKey: 123
 *    'b.arr': [ item1, item2, item3 ]
 * // option.separateArray = true
 *    'b.arr[0]': item1,
 *    'b.arr[0].its': 'success',
 *    'b.arr[1]': item2,
 *    'b.arr[2]': item3,
 * }
 *
 * @param o an object
 * @param option merge option
 * @returns
 */
export function inlineKey(o: any, option: MergeOption = {}) {
    const result: map = {};
    if (!isDefined(o) || typeof o !== "object" || isArr(o)) return result;

    function merge(o: object, key: string) {
        if (option.camelCaseKey) key = kebabCaseToCamelCase(key);

        if (isPrimitive(o) || isNull(o)) result[key] = o;
        else if (!isUndef(o)) {
            if (isArr(o)) {
                if (option.separateArray) {
                    for (let i = 0; i < o.length; i++) {
                        const prepKey = key + `[${i}]`;
                        const val = o[i];
                        merge(val, prepKey);
                    }
                } else result[key] = o;
            } else {
                for (const k in o) {
                    const prepKey = key + "." + k;
                    const val = o[k];
                    merge(val, prepKey);
                }
            }
        }
    }

    for (const key in o) {
        const val = o[key];
        merge(val, key);
    }
    return result;
}

export function addToGlobal(sources: map<object>, onKeyExist: OnExistType = 'merge') {
    for (const k in sources) {
        const target = globalThis[k];

        if (onKeyExist === "merge") {
            if (isDefined(target)) globalThis[k] = Object.assign(globalThis[k], sources[k]);
            else globalThis[k] = sources[k];
        } else if (onKeyExist === "override") {
            globalThis[k] = sources[k];
        }
    }
}

type OnExistType = "override" | "merge";
interface AddToGlobalOption {
    onExist?: OnExistType;
}

interface MergeOption {
    separateArray?: bool;
    camelCaseKey?: bool;
}

declare global {
    function addToGlobal(sources: map<object>, onKeyExist?: AddToGlobalOption): void;
}

addToGlobal({ addToGlobal }, 'override');
