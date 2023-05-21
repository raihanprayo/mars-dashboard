import { isDefined } from '../../utils';

export class Duration {
    private _d: number;
    private _h: number;
    private _m: number;
    private _s: number;

    constructor(
        day: number = 0,
        hour: number = 0,
        minute: number = 0,
        second: number = 0
    ) {
        this._d = day;
        this._h = hour;
        this._m = minute;
        this._s = second;
    }

    get day() {
        return this._d;
    }
    get hour() {
        return this._h;
    }
    get minute() {
        return this._m;
    }
    get second() {
        return this._s;
    }

    addDay(dayToAdd: number): this {
        this._d += dayToAdd;
        return this;
    }

    addHour(hourToAdd: number): this {
        this._h += hourToAdd;
        return this;
    }

    addMinute(minuteToAdd: number): this {
        this._m += minuteToAdd;
        return this;
    }

    addSecond(secondToAdd: number): this {
        this._s += secondToAdd;
        return this;
    }

    split(): DurationSegment {
        return [this._d, this._h, this._m, this._s];
    }

    toJSON() {
        return this.toString();
    }

    toString() {
        return `P${this._d}DT${this._h}H${this._m}M${this._s}S`;
    }

    toMilis() {
        return convert(this, Duration.Unit.MILI);
    }

    static from(input: string) {
        const result = input.matchAll(Duration.DURATION_REGX);
        if (!isDefined(result))
            throw new TypeError(`Unable to parse input (${input}) to Duration`);

        const temp = [...result][0];
        const [full, pd, day, time, hour, minute, second] = temp;

        const segments: DurationSegment = [
            Number(day ?? 0),
            Number(hour ?? 0),
            Number(minute ?? 0),
            Number(second ?? 0),
        ];
        return new Duration(...segments);
    }
}

export namespace Duration {
    export const DURATION_REGX =
        /^([-+]?)P(?:([-+]?[0-9]+)D)?(T(?:([-+]?[0-9]+)H)?(?:([-+]?[0-9]+)M)?(?:([-+]?[0-9]+)(?:[.,]([0-9]{0,9}))?S)?)?$/g;

    export enum Unit {
        MILI,
        SECOND,
        MINUTE,
        HOUR,
        DAY,
    }
    export namespace Unit {
        export function lessThanEq(u1: Unit, u2: Unit) {
            return u1 <= u2;
        }
    }
}

function convert(duration: Duration, to: Duration.Unit) {
    const [day, hour, minute, second] = duration.split();

    let result = 0;
    if (Duration.Unit.lessThanEq(to, Duration.Unit.DAY)) {
        result += 60 * 60 * 24 * day;
    }
    if (Duration.Unit.lessThanEq(to, Duration.Unit.HOUR)) {
        result += 60 * 60 * hour;
    }
    if (Duration.Unit.lessThanEq(to, Duration.Unit.MINUTE)) {
        result += 60 * minute;
    }
    if (Duration.Unit.lessThanEq(to, Duration.Unit.SECOND)) {
        result += second;
    }
    if (Duration.Unit.lessThanEq(to, Duration.Unit.MILI)) {
        result * 1000;
    }

    return result;
}

globalThis.Duration = Duration;
