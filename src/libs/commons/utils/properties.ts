/// <reference lib="dom" />
import { isArr, isBoxedPrimitive, isObj } from './guards';
import { inlineKey, objectMerge } from './object';
import { kebabCaseToCamelCase } from './string';

const storage = new Map<Properties, PropertiesMetadata>();

if (!globalThis['sc_prop_storage']) {
    Object.defineProperty(globalThis, 'sc_prop_storage', {
        value: storage,
        enumerable: false,
        configurable: false,
        writable: false,
    });
}

export class Properties implements Iterable<[string, any]> {
    [Symbol.iterator](): Iterator<[string, any], any, undefined> {
        return Object.entries(this.inlined)[Symbol.iterator]();
    }

    constructor(initialValue: object = {}) {
        storage.set(this, {
            props: {},
            locked: false,
            config: {
                inlineCamelCaseKey: true,
                inlineSeparateArray: false,
            },
        });

        const isAcceptable =
            isObj(initialValue) &&
            !isArr(initialValue) &&
            !isBoxedPrimitive(initialValue);

        if (isAcceptable) Object.entries(initialValue).forEach((e) => this.set(...e));
    }

    get raw(): map {
        const { locked, props } = storage.get(this)!;
        if (locked) return {};
        return objectMerge({}, props);
    }

    get inlined(): map {
        const { locked, props } = storage.get(this)!;
        if (locked) return {};
        return inlineKey(props, {
            camelCaseKey: true,
            separateArray: false,
        });
    }

    get<T = any>(key: string): T {
        const t_key = kebabCaseToCamelCase(key);
        return get_r(split_key(t_key), storage.get(this)!.props);
    }

    set(key: string, value: any) {
        if (storage.get(this)!.locked) return;
        const t_key = kebabCaseToCamelCase(key);
        // const evt = new Utils.PipeEvent(t_key, value);
        set_r(
            split_key(t_key),
            value,
            storage.get(this)!.props,
            this
            // evt
        );
    }

    has(key: string) {
        const t_key = kebabCaseToCamelCase(key);
        return has_r(split_key(t_key), storage.get(this)!.props);
    }

    /** Prevent any modification to current storage */
    lock() {
        const md = storage.get(this)!;
        if (md.locked) return;
        md.locked = true;
        Object.freeze(storage.get(this)?.props);
    }

    config(config: PropertiesConfig) {
        return this;
    }

    destroy() {
        storage.set(this, null as any);
    }
    // pipe(prefix: string, properties: Properties) {
    //     prefix = kebabCaseToCamelCase(prefix);
    //     this.emitter.addEventListener("pipe", (evt) => {
    //         const { key, value } = evt as Utils.PipeEvent;
    //         if (key.startsWith(prefix))
    //             properties.set(
    //                 key.replace(RegExp(`^(${prefix})`), ""),
    //                 value
    //             );
    //     });
    // }
}

namespace Utils {
    // export class PipeEvent extends Event {
    //     constructor(readonly key: string, readonly value: any) {
    //         super("pipe");
    //     }
    // }
}

function split_key(key: string) {
    return key
        .split('.')
        .flatMap((e) => e.split(/[\[\]]/g))
        .filter((e) => e !== '');
}

function set_r(
    keys: string[],
    value: any,
    store: map,
    properties: Properties
    // pipeEvent: Utils.PipeEvent
): void {
    const [k, ...others] = keys;
    if (others.length > 0) {
        store[k] = store[k] ||= /^(0|([1-9][0-9]*))$/.test(others[0]) ? [] : {};
        return set_r(
            others,
            value,
            store[k],
            properties
            // pipeEvent
        );
    }
    store[k] = value;
    // emitter.dispatchEvent(pipeEvent);
}

function get_r(keys: string[], store: map): any {
    const [k, ...others] = keys;
    try {
        if (others.length > 0) return get_r(others, store[k]);
        // let tempKey = camelCaseToKebabCase(k);
        if (k in store) return store[k];
        // else if (tempKey in store) return store[tempKey];
    } catch (err) {}
    return null;
}

function has_r(keys: string[], store: map): bool {
    try {
        const [k, ...others] = keys;
        if (others.length > 0) return has_r(others, store[k]);

        // let tempKey = camelCaseToKebabCase(k);
        if (k in store) return true;
        // else if (tempKey in store) return true;
        return false;
    } catch (err) {
        return false;
    }
}

interface PropertiesMetadata {
    locked: bool;
    props: map;
    // emitter: EventTarget;
    config: PropertiesConfig;
}
interface PropertiesConfig {
    inlineCamelCaseKey?: boolean;
    inlineSeparateArray?: boolean;
}
