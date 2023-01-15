import { DatePicker } from 'antd';
import type { Moment } from 'moment';
import { useState } from 'react';

interface BaseDataInputProps {
    id?: string;
    value?: any;
    onChange?(value: any): void;
}

export function DateRangeFilter(props: DateFilterProps) {
    const {
        greaterEqualName = 'gte',
        lessThanEqualName = 'lte',
        allowClear,
        withTime,
    } = props;
    const [values, setValues] = useState<[Moment, Moment]>();

    const onChange = (value?: [Moment, Moment]) => {
        const d1 = value?.[0];
        const d2 = value?.[1];

        const val: map = {};
        if (d1) val[greaterEqualName] = d1.toDate();
        if (d2) val[lessThanEqualName] = d2.toDate();

        if (value) props.onChange?.(val);
        else props.onChange?.({});
        setValues([d1, d2]);
    };
    return (
        <DatePicker.RangePicker
            allowClear={allowClear}
            showTime={withTime}

            allowEmpty={[true, true]}
            value={values}
            onChange={onChange}
        />
    );
}
export interface DateFilterProps extends BaseDataInputProps {
    allowClear?: boolean;
    withTime?: boolean;
    greaterEqualName?: string;
    lessThanEqualName?: string;
}