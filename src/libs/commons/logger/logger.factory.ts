import { format as dateFormat } from 'date-fns';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { isAbsolute, parse } from 'path';
import { Writable, PassThrough, Readable } from 'stream';
import { debug, DebugLoggerFunction, formatWithOptions, InspectOptions } from 'util';
import { isArr, isBool, isDefined, isFn, isStr } from '../utils';
import { Colorize } from './colors';
import { LogLevel, LogLevelKey } from './log-level';
import { LogContext, LogFormatFn, ScLogger } from './logger';

const stdout = new PassThrough({ defaultEncoding: 'utf8' });
const stderr = new PassThrough({ defaultEncoding: 'utf8' });

stdout.pipe(process.stdout);
stderr.pipe(process.stderr);

const defaultConsole = globalThis.console;

globalThis.console = new console.Console({
    stdout,
    stderr,
    inspectOptions: { colors: true, depth: 2, getters: true, showHidden: true },
});
(globalThis.console as any).origin = defaultConsole;

const ANSII_CHAR_REGX = /\x1b\[[0-9;]+m/g;
const LOGGERS = new Set<ScLogger>();
const LEVELS: LogLevelKey[] = ['error', 'warn', 'log', 'debug', 'verbose'];
const MODE = process.env.NODE_ENV;

const cleaner = new PassThrough({
    transform(chunk: Buffer, encoding, done) {
        if (Buffer.isBuffer(chunk)) {
            const normalize = chunk.toString('utf8').replace(ANSII_CHAR_REGX, '');
            chunk = Buffer.from(normalize);
        }

        done(null, chunk);
    },
});

export class ScLoggerFactory {
    private _initialized = false;
    private _level: LogLevel;
    private _inspect: InspectOptions = {
        colors: process.env.LOG_NO_COLOR ? false : true,
        getters: MODE !== 'production',
        depth: Number(process.env.LOG_DEPTH) || null,
    };

    private _filePath?: string | Empty;
    private _file_stream?: Writable | Empty;
    private _format: LogFormatFn;

    private _ignore_nest_ctx: true | LogContext[] = [];

    public log: ScLogger;
    get stdout() {
        return stdout;
    }
    get stderr() {
        return stderr;
    }

    constructor(opt: LogFactoryOptions) {
        this.init();

        this.level = opt.level;
        this._inspect = opt.inspect;
        this._format = opt.format;

        if (opt.ignore) {
            const ignore = opt.ignore;
            if (ignore.nestjs === true || isArr(ignore.nestjs))
                this._ignore_nest_ctx = ignore.nestjs;
        }

        this.filePath = opt.filePath;
    }

    set level(value: LogLevel) {
        this._level = value;
    }
    get level(): LogLevel {
        return this._level;
    }

    set inspect(value: InspectOptions) {
        this._inspect = value;
    }
    get inspect(): InspectOptions {
        return this._inspect;
    }

    set filePath(x: string | Empty) {
        const enabled = isStr(x) && isAbsolute(x);
        console.log('Enable log file (%o) ?', x, enabled);

        let s = this._file_stream;
        if (isStr(x)) {
            if (!isAbsolute(x)) return;
            const { dir } = parse(x);

            if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

            s = this._file_stream = createWriteStream(x, {
                encoding: 'utf8',
                autoClose: true,
                flags: 'a',
            });

            stdout.pipe(cleaner);
            stderr.pipe(cleaner);
            cleaner.pipe(s);

            if (!this._initialized) {
                const dateStr = new Date() + '';
                const len = dateStr.length;
                cleaner.push(`-------${'-'.repeat(len)}-------\n`);
                cleaner.push(`------ Start ${dateStr}\n`);
                cleaner.push(`-------${'-'.repeat(len)}-------\n`);
                this._initialized = true;
            }

            s.on('close', () => {
                this._file_stream = this._filePath = null;
            });
        } else {
            if (!isDefined(s)) return;

            // this.unpipe(cleaner).unpipe(s);

            cleaner.unpipe(s);
            stderr.unpipe(cleaner);
            stdout.unpipe(cleaner);

            s.destroy();
        }
    }
    get filepath(): string | Empty {
        return this._filePath;
    }

    get format() {
        return this._format;
    }
    set format(x) {
        if (!isFn(x)) return;
        this._format = x;
    }

    // pipe<T extends NodeJS.WritableStream>(dest: T) {
    //     this.stdout.pipe(process.stdout).pipe(dest);
    //     this.stderr.pipe(process.stderr).pipe(dest);
    //     return dest;
    // }

    // unpipe<T extends NodeJS.WritableStream>(dest: T) {
    //     this.stdout.unpipe(process.stdout).unpipe(dest);
    //     this.stderr.unpipe(process.stderr).unpipe(dest);
    //     return dest;
    // }

    addInstance(logger: ScLogger) {
        LOGGERS.add(logger);
    }

    addNestjsIgnoreCtx(context: LogContext) {
        if (isBool(this._ignore_nest_ctx)) return;

        if (isStr(context) || 'name' in context) {
            this._ignore_nest_ctx.push(context);
        }
    }

    ignoreNestjsCtx(context: string) {
        if (isBool(this._ignore_nest_ctx)) return this._ignore_nest_ctx;
        return (
            this._ignore_nest_ctx.findIndex((e) => {
                return isStr(e) ? e === context : e.name === context;
            }) !== -1
        );
    }

    private init() {
        const desc = {
            writable: false,
            configurable: false,
            enumerable: true,
        };
        Object.defineProperties(this, {
            stdout: {
                ...desc,
                value: this.stdout,
            },
            stderr: {
                ...desc,
                value: this.stderr,
            },
        });

        this.initIgnore();
    }

    private initIgnore() {
        const { LOG_IGNORE_NEST, LOG_IGNORE_NEST_CTX } = process.env;
        if (!!LOG_IGNORE_NEST) this._ignore_nest_ctx = true;
        else if (LOG_IGNORE_NEST_CTX)
            this._ignore_nest_ctx = LOG_IGNORE_NEST_CTX.split(/[,;]/).map((e) =>
                e.trim()
            );
    }
}

export const logFactory = new ScLoggerFactory({
    filePath: process.env.LOG_DIR,
    inspect: {
        colors: process.env.LOG_NO_COLOR ? false : true,
        getters: MODE !== 'production',
        depth: Number(process.env.LOG_DEPTH) || null,
    },
    level: (() => {
        let lv = process.env.LOG_LEVEL as LogLevelKey;
        if (!lv) lv = MODE === 'production' ? 'log' : 'verbose';

        let l: LogLevel;
        if (LEVELS.includes(lv)) l = LogLevel[lv];
        else l = LogLevel.log;

        console.log('log level init:', LogLevel[l]);
        return l;
    })(),

    format(level, timestamp, context, message) {
        const color = Colorize.byLogLevel[level];
        const timeFormat = color(dateFormat(timestamp, 'dd/MM/yyyy, HH:mm:ss'));
        const formatCtx = context ? `[${Colorize.yellowBright(context)}]` : null;

        const lvlAlias = ['[', color(LogLevel.alias(level)), ']'];
        return [lvlAlias.join(''), timeFormat, '-', formatCtx, message]
            .filter(isDefined)
            .join(' ');
    },
});

export namespace LogUtil {
    export function prettyStack(err: Error) {
        const splits = err.stack!.split('\n');
        const indexStack = splits.findIndex((e) => e.trim().startsWith('Error'));
        return splits.slice(indexStack === -1 ? 1 : indexStack + 1).map((e) =>
            e
                .trim()
                .replace(/^(at )/, '')
                .trim()
        );
    }

    export function byNest(stacks: string[]) {
        return (
            stacks.findIndex(
                (s) =>
                    /^(Logger)/.test(s) &&
                    /(@nestjs(\\|\/)common)/g.test(s) &&
                    /(logger\.service\.js)/g.test(s)
            ) !== -1
        );
    }

    export function getCtxMethod(
        ctx: string,
        byNest: boolean,
        level: LogLevel,
        stacks: string[],
        temp_method?: string | Empty
    ) {
        if (byNest) return ctx;
        else if (LogUtil.isWarnOrError(level)) {
            let result = ctx;
            const idx = stacks.findIndex((e) => e.startsWith(ctx));
            if (idx === -1) result = `${ctx}.<anon>`;
            else result = stacks[idx].split(' ', 1)[0];

            if (result.includes('.<anon>') && temp_method)
                result = `${ctx}.${temp_method}`;

            return result;
        }

        if (temp_method) ctx = `${ctx}.${temp_method}`;
        return ctx;
    }

    export function isTemplateStringsArr(o: any): o is TemplateStringsArray {
        // @ts-ignore
        return Array.isArray(o) && 'raw' in o && Array.isArray(o.raw);
    }

    export function isAllowed(level: LogLevel) {
        return level <= logFactory.level;
    }

    export function formatMessage(
        message: any,
        args: any[],
        inspect: InspectOptions = {}
    ) {
        if (isTemplateStringsArr(message)) message = message.join('%o');

        const opt = {
            ...logFactory.inspect,
            ...inspect,
        };
        return formatWithOptions(opt, message, ...args);
    }

    export function isWarnOrError(level: LogLevel) {
        return [LogLevel.error, LogLevel.warn].includes(level);
    }
}

export interface LogFactoryOptions {
    level: LogLevel;
    inspect: InspectOptions;
    format: LogFormatFn;
    filePath?: string | Empty;

    ignore?: {
        nestjs?: true | LogContext[];
    };
}
