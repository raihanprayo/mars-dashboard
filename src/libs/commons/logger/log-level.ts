export enum LogLevel {
    error,
    warn,
    log,
    debug,
    verbose,
}
export namespace LogLevel {
    export function alias(lvl: LogLevel) {
        switch (lvl) {
            case LogLevel.error:
                return "ERR ";
            case LogLevel.warn:
                return "WARN";
            case LogLevel.log:
                return "INFO";
            case LogLevel.debug:
                return "DEBG";
            case LogLevel.verbose:
                return "VERB";
        }
    }

    Object.defineProperties(LogLevel, {
        alias: {
            enumerable: false,
            configurable: false,
            writable: false,
        },
    });
}

export type LogLevelKey = Exclude<keyof typeof LogLevel, "alias">;

Object.defineProperties(globalThis, {
    LogLevel: {
        value: LogLevel,
        writable: false,
        enumerable: true,
        configurable: true,
    },
});
