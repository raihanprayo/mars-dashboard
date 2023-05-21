export {};
declare global {
    type OrArray<T> = T | Array<T>;
    type OrPromise<T> = T | Promise<T>;

    type PartialPick<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

    namespace NodeJS {
        interface ProcessEnv {
            readonly NODE_ENV: 'development' | 'production' | 'test';
        }
    }

    type str = string;
    type int = number;
    type bool = boolean;

    /** @deprecated please use `map` instead */
    type objects<T = any> = map<T>;

    /** @deprecated please use `map` instead */
    type obj<T = any> = map<T>;

    type map<T = any> = Record<string, T>;

    type primitives = string | number | boolean | bigint;
    type primitivesCtor =
        | StringConstructor
        | NumberConstructor
        | BooleanConstructor
        | BigIntConstructor;

    type primitivesFromCtor<T extends primitivesCtor> = T extends StringConstructor
        ? string
        : T extends NumberConstructor
        ? number
        : T extends BooleanConstructor
        ? bool
        : T extends BooleanConstructor
        ? bigint
        : never;

    type Optional<T> = T | undefined;

    /** merged empty type `undefined`, `null`, `void` */
    type Empty = undefined | null | void;
    type Falsy = '' | -0 | 0 | 0n | false | Empty;
    type Truthy<T> = Exclude<T, Falsy>;

    type PartialAny<T extends object, K extends string = ''> = {
        [P in keyof T]?: K extends P ? any : T[P];
    };

    type EnumType = Record<string, string | number>;

    interface Type<T = any> extends Function {
        new (...args: any[]): T;
    }

    
    type DurationSegment = [day: number, hour: number, min: number, sec: number];
}
