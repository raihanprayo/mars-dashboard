import { InspectOptions } from "util";
import { isArr, isStr, isSymbol } from "../utils";
import { Readable } from "stream";
import { LogFactoryOptions, LogUtil, logFactory } from "./logger.factory";
import { LogLevel } from "./log-level";

process.on("exit", (c) => (logFactory.filePath = null));

const MAPPED_LEVEL_NAME = {
    error: LogLevel.error,
    warn: LogLevel.warn,
    log: LogLevel.log,
    info: LogLevel.log,
    debug: LogLevel.debug,
    verbose: LogLevel.verbose,
} as const;

export class ScLogger {
    private _lv: LogLevel;
    private _context: string;

    private _sub_ctx: string | Empty;
    private _split_new_line = false;

    private _stdout?: Readable;
    private _stderr?: Readable;
    private readonly options: Omit<ScLoggerOptions, "stdout" | "stderr">;

    get stdout() {
        return this.outputStream().stdout;
    }
    get stderr() {
        return this.outputStream().stderr;
    }

    error: LogFn;
    warn: LogFn;
    log: LogFn;
    info: LogFn;
    debug: LogFn;
    verbose: LogFn;

    constructor(context: LogContext = "", options: ScLoggerOptions = {}) {
        this._context = isStr(context) ? context : context.name;
        this.options = {
            inspect: options.inspect,
            format: options.format,
        };

        this.init();
        logFactory.addInstance(this);
    }

    protected print(date: Date, err: Error, { message, params }: LogArgs) {
        if (!LogUtil.isAllowed(this._lv)) return;
        const stacks = LogUtil.prettyStack(err);
        const byNest = LogUtil.byNest(stacks);

        const decideCtx = this._lv !== LogLevel.error && byNest ? params.shift() : this._context;
        if (byNest && logFactory.ignoreNestjsCtx(decideCtx)) return;

        const context = LogUtil.getCtxMethod(decideCtx, byNest, this._lv, stacks, this._sub_ctx);

        const formatFn = this.options.format || logFactory.format;

        const { stderr, stdout } = this.outputStream();
        const stream = LogUtil.isWarnOrError(this._lv) ? stderr : stdout;
        const flattedMsg = LogUtil.formatMessage(message, params, this.options.inspect);

        if (!this._split_new_line) {
            stream.push(formatFn(this._lv, date, context, flattedMsg, { byNest }) + "\n", "utf8");
        } else {
            const lines = flattedMsg.split(/(\n)/g);
            for (const line of lines)
                stream.push(formatFn(this._lv, date, context, line, { byNest }) + "\n", "utf8");
        }

        this._sub_ctx = null;
        this._split_new_line = false;
    }

    private outputStream() {
        const stdout = this._stdout || logFactory.stdout;
        const stderr = this._stderr || logFactory.stderr;
        return { stdout, stderr };
    }
    /**
     * Set context
     */
    setContext(x: LogContext) {
        this._context = isStr(x) ? x : x.name;
        return this;
    }
    /**
     * Temporarily set sub-context
     */
    subContext(...subcontexts: LogContext[]) {
        this._sub_ctx = subcontexts.map((ctx) => (isStr(ctx) ? ctx : ctx.name)).join(".");
        return this;
    }

    /**
     * Temporarily split log message and print them per-line.
     */
    splits() {
        this._split_new_line = true;
        return this;
    }

    private init() {
        for (const prop of Object.keys(this)) {
            if (!prop.startsWith("_")) continue;
            Object.defineProperty(this, prop, {
                value: this[prop],
                writable: true,
                configurable: true,
                enumerable: false,
            });
        }

        this.initLogFn();
    }
    private createLogFn(name: string, level: LogLevel): LogFn {
        return {
            [name]: function (this: ScLogger, message: any, ...params: any[]) {
                this._lv = level;
                this.print(new Date(), new Error(), { message, params });
            }.bind(this),
        }[name];
    }
    private initLogFn() {
        const desc: PropertyDescriptor = {
            writable: true,
            configurable: false,
            enumerable: false,
        };

        const entries = Object.entries(MAPPED_LEVEL_NAME).map<[string, PropertyDescriptor]>(
            ([name, level]) => [name, Object.assign({ value: this.createLogFn(name, level) }, desc)]
        );
        Object.defineProperties(this, Object.fromEntries(entries));
    }
}
export namespace ScLogger {
    const logger = logFactory.log = new ScLogger(undefined, {});
    const LOG_INSTANCE = "log:instance";

    export const error = logger.error;
    export const warn = logger.warn;
    export const log = logger.log;
    export const debug = logger.debug;
    export const verbose = logger.verbose;

    /**
     * Set context
     */
    export const setContext = logFactory.log.setContext.bind(logFactory.log);

    /**
     * Temporarily set sub-context
     */
    export const subContext = logFactory.log.subContext.bind(logFactory.log);

    /**
     * Temporarily split log message and print them per-line.
     */
    export const splits = logFactory.log.splits.bind(logFactory.log);

    export function setGlobalOption<K extends keyof LogFactoryOptions>(
        key: K,
        value: LogFactoryOptions[K]
    ): void;
    export function setGlobalOption(key: "ignore-nest-ctx", value: LogContext | LogContext[]): void;
    export function setGlobalOption(key: string, value: any) {
        switch (key) {
            case "inspect":
                logFactory.inspect = Object.assign(logFactory.inspect, value || {});
                break;
            case "level":
                logFactory.level = value as LogFactoryOptions["level"];
                break;
            case "filePath":
                logFactory.filePath = value as LogFactoryOptions["filePath"];
                break;
            case "format":
                logFactory.format = value as LogFactoryOptions["format"];
                break;
            case "ignore-nest-ctx":
                if (isArr(value)) value.forEach(logFactory.addNestjsIgnoreCtx, logFactory);
                else logFactory.addNestjsIgnoreCtx(value);
                break;
        }
    }

    export function inject(ctx?: LogContext, opt?: ScLoggerOptions): PropertyDecorator;
    export function inject(target: Object, prop: string | Symbol): void;
    export function inject(ctxOrFn: any, optOrProp: any) {
        const isDecorator = isStr(optOrProp) || isSymbol(optOrProp);
        const decorate: PropertyDecorator = (t, p) => {
            Object.defineProperty(t, p, {
                get(this: any) {
                    let logger: ScLogger = Reflect.getMetadata(LOG_INSTANCE, this);
                    if (!logger) {
                        const ctx = isDecorator ? ctxOrFn.constructor.name : ctxOrFn;
                        const opt = isDecorator ? {} : optOrProp;
                        Reflect.defineMetadata(
                            LOG_INSTANCE,
                            (logger = new ScLogger(ctx, opt)),
                            this
                        );
                    }
                    return logger;
                },
                enumerable: true,
                configurable: false,
            });
        };

        if (isDecorator) return decorate(ctxOrFn, optOrProp);
        return decorate;
    }
}

export type LogContext = string | { readonly name: string };
export interface LogFormatFn {
    (
        level: LogLevel,
        timestamp: Date,
        context: string,
        message: string,
        opt: { byNest: boolean }
    ): string;
}
export interface LogFn {
    (message: any[], ...args: any[]): void;
    (...args: any[]): void;
}

interface LogArgs {
    message: any;
    params: any[];
}
interface ScLoggerOptions {
    stdout?: Readable;
    stderr?: Readable;
    inspect?: InspectOptions;
    format?: LogFormatFn;
}
