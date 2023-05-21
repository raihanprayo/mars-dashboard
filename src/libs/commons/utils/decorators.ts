import { isDefined, isFn } from "./guards";

export function Bind(): MethodDecorator {
    return function (t, k, d) {
        return {
            configurable: true,
            enumerable: false,
            get() {
                const fn: Function = (d.value as any).bind(this);
                Object.defineProperty(this, k, {
                    value: fn,
                    configurable: true,
                    writable: true,
                });
                return fn as any;
            },
        };
    };
}

type FieldParam<T extends Type = Type> = T | (() => T);
export function Field(type?: FieldParam): PropertyDecorator;
export function Field(type?: FieldParam<ArrayConstructor>, subtype?: FieldParam): PropertyDecorator;
export function Field(type?: FieldParam, subtype?: FieldParam): PropertyDecorator {
    return (t, p) => {
        const fields: any[] = Reflect.getMetadata(Field.KEY, t) || [];

        type ||= Reflect.getMetadata("design:type", t, p);
        if (type === Array && !isDefined(subtype)) subtype = Object;

        fields.push({ type, prop: p, subtype });
        Reflect.defineMetadata(Field.KEY, fields, t);
    };
}
export namespace Field {
    const PARSED_MARK = Symbol("class:field-no-check");
    export const KEY = Symbol("class:fields");

    export function getMetadata(type: Type): FieldMetadata[] {
        const proto = type.prototype;
        if (!Reflect.getMetadata(PARSED_MARK, type)) {
            const mds: PreFieldMetadata[] = Reflect.getMetadata(KEY, proto) || [];
            const m = mds.map<FieldMetadata>((e) => ({
                prop: e.prop,
                type: isPlainFn(e.type) ? e.type() : e.type,
                subtype: isPlainFn(e.subtype) ? e.subtype() : e.subtype,
            }));
            Reflect.defineMetadata(PARSED_MARK, mds.length > 0, type);
            Reflect.defineMetadata(KEY, m, proto);
            return m;
        }
        return Reflect.getMetadata(KEY, proto);
    }
}

export interface FieldMetadata {
    prop: string;
    type: Type;
    subtype?: Type;
}
interface PreFieldMetadata {
    prop: string;
    type: Type | (() => Type);
    subtype?: Type | (() => Type);
}

function isBuiltInCtor(o: any): o is Type {
    if (!isFn(o)) return false;
    return o.toString().includes("[native code]");
}
function isPlainFn(o: any): o is () => any {
    if (!isFn(o)) return false;
    else if (isBuiltInCtor(o)) return false;
    const s: () => any = o;
    const str = s.toString();

    if (str.startsWith("function") && str.endsWith("}")) return true;
    return s.toString().startsWith("(") && s.toString().includes("=>");
}

type BuiltInCtor =
    | StringConstructor
    | ObjectConstructor
    | NumberConstructor
    | BooleanConstructor
    | RegExpConstructor
    | BigIntConstructor
    | SymbolConstructor
    | ArrayConstructor;
