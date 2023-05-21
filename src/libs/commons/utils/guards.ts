import { guardFactory, GuardFn } from "./factory";
// === Base Type ===========================================================================
export const isArr = guardFactory<Array<any>>(function (o) {
    return Array.isArray(o);
});
/** Check is valid `string`, either `primitives` or `Object` */
export const isStr = guardFactory<string>((o) => typeof o === "string" || o instanceof String);
/** Check is valid `number`, either `primitives` or `Object` */
export const isNum = guardFactory<number>((o) => typeof o === "number" || o instanceof Number);
/** Check is valid `boolean`, either `primitives` or `Object` */
export const isBool = guardFactory<boolean>((o) => typeof o === "boolean" || o instanceof Boolean);
/** Check is valid `bigint`, either `primitives` or `Object` */
export const isBigInt = guardFactory<bigint>((o) => typeof o === "bigint" || o instanceof BigInt);
/**
 * Basic check target instaceof Object,
 * also check is target `null`
 */
export const isObj = guardFactory<map>((o) => o instanceof Object);
export const isFn = guardFactory<Function>((o) => typeof o === "function");
export const isSymbol = guardFactory<symbol>((o) => typeof o === "symbol");
export const isUndef = guardFactory<undefined>((o) => typeof o === "undefined");
export const isNull = guardFactory<null>((o) => typeof o === "object" && o === null);
export const isPrimitive = guardFactory<primitives>(
    (o) => isStr(o) || isBool(o) || isNum(o) || isBigInt(o)
);
export const isFalsy = guardFactory<Falsy>((o) => {
    if (isBoxedPrimitive(o)) return "" == o || 0 == o || -0 == o || 0n == o || false == o;
    return !!o === false;
});

export function isDefined<T>(o: T): o is Exclude<T, Empty> {
    return !isUndef(o) && !isNull(o);
}
export function isTruthy<T>(o: T): o is Truthy<T> {
    return isFalsy.non(o);
}

// === Boxed Type ===========================================================================
export const isBoxedString = guardFactory<String>(
    (o) => typeof o === "object" && o instanceof String
);
export const isBoxedNumber = guardFactory<Number>((o) => {
    return typeof o === "object" && o instanceof Number;
});
export const isBoxedBoolean = guardFactory<Boolean>((o) => {
    return typeof o === "object" && o instanceof Boolean;
});
export const isBoxedBigInt = guardFactory<BigInt>((o) => {
    return typeof o === "object" && o instanceof Boolean;
});
export const isBoxedPrimitive = guardFactory<String | Number | Boolean | BigInt>(
    (o) => isBoxedString(o) || isBoxedNumber(o) || isBoxedBigInt(o) || isBoxedBoolean(o)
);

// === String Aliases =======================================================================
export function isStringNumber(value: string) {
    const numRegx = /^([0-9]+)$/;
    return numRegx.test(value);
}
export function isConvertableStringNumber(value: string) {
    const numRegx = /^[1-9]([0-9]*)$/;
    return numRegx.test(value);
}
export function isStringBoolean(value: string | number) {
    const t = value.toString().toLowerCase();
    const numRegx = /^(0|1)$/;
    const strRegx = /^(true|false)/i;
    return isNum(value) ? numRegx.test(t) : strRegx.test(t);
}

type ConcatedType<I, N extends bool, T extends GuardFn<any>[]> = T extends GuardFn<infer P>[]
    ? N extends true
        ? Exclude<I, P>
        : P
    : unknown;

export function is<I, T extends GuardFn<any>[]>(o: I, guards: T): o is ConcatedType<I, false, T>;
export function is<I, N extends bool, T extends GuardFn<any>[]>(
    o: I,
    negate: N,
    guards: T
): o is ConcatedType<I, N, T>;
export function is(o: any, negate: GuardFn<any>[] | bool, guards?: GuardFn<any>[]): boolean {
    const result = [] as bool[];
    if (isDefined(guards)) {
        const useNon = negate as bool;
        for (const guard of guards) {
            result.push(useNon ? guard.non(o) : guard(o));
        }
    } else {
        for (const guard of negate as GuardFn<any>[]) {
            result.push(guard(o));
        }
    }
    return result.indexOf(false) === -1;
}

export function IfPlainOrArray<T>(
    input: OrArray<T> | Empty,
    cb: (item: T, index?: number, container?: T[]) => void
) {
    if (isArr(input)) return input.forEach(cb);
    else if (isDefined(input)) cb(input);
}

export namespace IfPlainOrArray {
    export async function async<T>(
        input: OrArray<T> | Empty,
        cb: (item: T, index?: number, container?: T[]) => OrPromise<void>
    ) {
        if (isArr(input)) {
            let counter = 0;
            for (const el of input) {
                await cb(el, counter, input);
                counter++;
            }
        } else if (isDefined(input)) await cb(input);
    }
}
