import { Field } from './decorators';
import { isArr, isBool, isStr, isUndef } from './guards';

declare global {
    interface IFilter<T> {
        eq?: T;
        in?: T[];
        negated?: boolean;
    }
    namespace IFilter {
        export interface Readable<T extends StrType> extends IFilter<T> {
            contains?: T;
            /** only works for `contains` property, determine `contains` value to use ignore-case search */
            specific?: boolean;
        }

        export interface Range<T extends RangeType> extends IFilter<T> {
            /** greater than `T` */
            gt?: T;

            /** greater than or equal `T` */
            gte?: T;

            /** less than `T` */
            lt?: T;

            /** less than or equal `T` */
            lte?: T;
        }
    }
}

export class Filter<T> implements IFilter<T> {
    readonly instance: string = '@Filter';

    @Field()
    eq?: T;

    @Field()
    in?: T[];

    hasFilter() {
        let count = 0;
        if (isUndef.non(this.eq)) count += 1;
        if (isArr(this.in)) count += 1;
        return count;
    }
}

type StrType = string | String;
type NumType = number | Number;
type BoolType = boolean | Boolean;
type BigIntType = bigint | BigInt;
type DateType = Date;
type RangeType = NumType | BigIntType | DateType;
export namespace Filter {
    export type Of<V> = V extends StrType
        ? IFilter.Readable<StrType>
        : V extends RangeType
        ? IFilter.Range<V>
        : V extends BoolType
        ? IFilter<boolean>
        : unknown;

    export class Boolean extends Filter<BoolType> {
        override readonly instance = '@Filter.Boolean';
    }

    export class String extends Filter<StrType> implements IFilter.Readable<StrType> {
        override readonly instance = '@Filter.String';
        @Field()
        contains?: StrType;

        @Field()
        specific?: boolean;

        override hasFilter() {
            let count = super.hasFilter();
            if (isStr(this.contains)) count += 1;
            if (isBool(this.specific)) count += 1;
            return count;
        }
    }

    export class Range<T extends RangeType>
        extends Filter<T>
        implements IFilter.Range<T>
    {
        override readonly instance: string = '@Filter.Range';
        @Field()
        gt?: T;

        @Field()
        gte?: T;

        @Field()
        lt?: T;

        @Field()
        lte?: T;

        override hasFilter() {
            let count = super.hasFilter();
            if (isUndef.non(this.gt)) count += 1;
            if (isUndef.non(this.gte)) count += 1;
            if (isUndef.non(this.lt)) count += 1;
            if (isUndef.non(this.lte)) count += 1;
            return count;
        }
    }

    export class Date extends Range<DateType> {
        override readonly instance = '@Filter.Date';
    }
    export class Number extends Range<NumType> {
        override readonly instance = '@Filter.Number';
    }
    export class BigInt extends Range<BigIntType> {
        override readonly instance = '@Filter.BigInt';
    }
}
