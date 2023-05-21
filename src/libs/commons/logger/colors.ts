import './log-level';
import { LogLevel } from './log-level';
type ColorFn = (text: string | number) => string;

export namespace Colorize {
    const allowColor = !process.env.LOG_NO_COLOR;
    function factory(code: number | string): ColorFn {
        const colored = (text: string | number) => `\x1B[${code}m${text}\x1B[0m`;
        return function (text) {
            return String(allowColor ? colored(text) : text);
        };
    }

    export const custom = (ansiiColorCode: number | string, text: string) =>
        factory(ansiiColorCode)(text);

    export const black = factory(30);
    export const gray = factory(90);

    export const red = factory(31);
    export const green = factory(32);
    export const yellow = factory(33);
    export const blue = factory(34);
    export const magenta = factory(35);
    export const cyan = factory(36);
    export const white = factory(37);

    export const redBright = factory(91);
    export const greenBright = factory(92);
    export const yellowBright = factory(93);
    export const blueBright = factory(94);
    export const magentaBright = factory(95);
    export const cyanBright = factory(96);
    export const whiteDensed = factory(97);

    export const byLogLevel = {
        [LogLevel.error]: Colorize.red,
        [LogLevel.warn]: Colorize.yellow,
        [LogLevel.log]: Colorize.blueBright,
        [LogLevel.debug]: Colorize.magentaBright,
        [LogLevel.verbose]: Colorize.greenBright,

        error: Colorize.red,
        warn: Colorize.yellow,
        log: Colorize.blueBright,
        debug: Colorize.magentaBright,
        verbose: Colorize.greenBright,
    };
}
