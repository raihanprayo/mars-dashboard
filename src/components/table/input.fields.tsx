import { Duration, isBool, isDefined, isStr, randomString } from '@mars/common';
import {
    DatePicker,
    InputNumber,
    Popover,
    Radio,
    Select,
    SelectProps,
    Space,
    Transfer,
} from 'antd';
import { DefaultOptionType } from 'antd/lib/select/index';
import type { TransferDirection, TransferItem } from 'antd/lib/transfer/index';
import moment, { isMoment, Moment } from 'moment';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBool } from '_hook/util.hook';
import notif from '_service/notif';

const DURATION_REGX =
    /^([-+]?)P(?:([-+]?[0-9]+)D)?(T(?:([-+]?[0-9]+)H)?(?:([-+]?[0-9]+)M)?(?:([-+]?[0-9]+)(?:[.,]([0-9]{0,9}))?S)?)?$/;

export interface BaseInputProps {
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

    const initial = !isDefined(props.value)
        ? undefined
        : ([
              props.value?.[greaterEqualName]
                  ? moment(props.value[greaterEqualName])
                  : null,
              props.value?.[lessThanEqualName]
                  ? moment(props.value[lessThanEqualName])
                  : null,
          ] as [Moment, Moment]);

    const [values, setValues] = useState<[Moment, Moment]>(initial);

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
            id={props.id}
            allowClear={allowClear}
            showTime={withTime}
            allowEmpty={[true, true]}
            value={values}
            onChange={onChange}
        />
    );
}
export interface DateFilterProps extends BaseInputProps {
    allowClear?: boolean;
    withTime?: boolean;
    greaterEqualName?: string;
    lessThanEqualName?: string;
}

export function RoleTransfer(props: RoleTransferProps) {
    const { indexSelectedField = 'selected', indexUnselectedField = 'removed' } = props;

    const [roles, setRoles] = useState<RoleSelectionItem[]>([]);
    const [checked, setChecked] = useState<string[]>([]);
    const [picked, setPicked] = useState<string[]>([]);

    const getRoles = () => {
        api.get<DTO.Role[]>('/role')
            .then((res) => {
                setRoles(
                    res.data.map((role) => {
                        return {
                            id: role.id,
                            key: role.id,
                            title: role.name,
                        };
                    })
                );
                return res.data;
            })
            .catch((err) => {});
    };
    const getUserRoles = () => {
        if (!props.userId) return;
        api.get<DTO.Role[]>('/role/' + props.userId)
            .then((res) => {
                const picked = res.data.map((e) => e.id);
                setPicked(picked);
            })
            .catch((err) => {});
    };

    useEffect(() => getRoles(), []);
    useEffect(() => getUserRoles(), [props.userId]);

    const onSelectChange = (
        sourceSelectedKeys: string[],
        targetSelectedKeys: string[]
    ) => {
        setChecked([...sourceSelectedKeys, ...targetSelectedKeys]);
    };

    const onChange = (
        nextTargetKeys: string[],
        direction: TransferDirection,
        moveKeys: string[]
    ) => {
        setPicked(nextTargetKeys);
        props.onChange?.({
            [indexUnselectedField]: roles
                .filter((e) => !nextTargetKeys.includes(e.id))
                .map((e) => e.id),
            [indexSelectedField]: nextTargetKeys,
        });
    };

    return (
        <Transfer
            dataSource={roles}
            titles={['Available', 'Selected']}
            targetKeys={picked}
            selectedKeys={checked}
            onChange={onChange}
            onSelectChange={onSelectChange}
            render={(item) => item.title}
        />
    );
}
export interface RoleTransferProps extends BaseInputProps {
    userId?: string;

    indexUnselectedField?: string;
    indexSelectedField?: string;
}
interface RoleSelectionItem extends TransferItem {
    id: string;
}

export function BooleanInput(props: BooleanInputProps) {
    return (
        <Radio.Group
            id={props.id}
            value={props.value}
            onChange={props.onChange}
            buttonStyle="solid"
        >
            <Radio.Button value={true}>{props.trueText || 'Ya'}</Radio.Button>
            <Radio.Button value={false}>{props.falseText || 'Tidak'}</Radio.Button>
        </Radio.Group>
    );
}
export interface BooleanInputProps extends BaseInputProps {
    trueText?: React.ReactNode;
    falseText?: React.ReactNode;
}

export function EnumSelect(props: EnumSelectProps) {
    const { mode = 'multiple', ...rest } = props;
    const [options, setOptions] = useState<DefaultOptionType[]>([
        ...Object.values(props.enums)
            .filter((e) => {
                if (/^(\d+)$/i.test(e.toString())) return false;
                return true;
            })
            .map<DefaultOptionType>((en) => ({ label: en, value: en })),
    ]);

    let actualMode = mode === 'multiple' ? mode : mode === 'single' ? null : mode;
    return <Select {...rest} mode={actualMode} options={options} />;
}
export interface EnumSelectProps
    extends BaseInputProps,
        Omit<SelectProps, 'onChange' | 'options' | 'mode'> {
    enums: Record<string, string | number>;
    mode?: 'multiple' | 'single';
    includeNull?: boolean;
}

export function SolutionSelect(props: SolutionSelectProps) {
    const loading = useBool();
    const [list, setList] = useState<DefaultOptionType[]>([]);

    useEffect(() => {
        loading.toggle();
        api.get<DTO.Solution[]>('/solution', {
            params: { size: 1000 },
        })
            .then(({ data }) => {
                console.log(data);
                setList(data.map((e) => ({ label: e.name, value: e.id })));
            })
            .catch(notif.axiosError)
            .finally(() => loading.setValue(false));
    }, []);

    return <Select {...props} options={list} labelInValue loading={loading.value} />;
}
export interface SolutionSelectProps
    extends BaseInputProps,
        Omit<SelectProps, 'onChange' | 'options' | 'mode'> {}

export function DurationInput(props: DurationInputProps) {
    const id = useMemo(() => randomString(12), []);
    const width = 60;
    const [value, setValue] = useState<Duration>(
        isStr(props.value) ? Duration.from(props.value) : props.value
    );

    const dayPop = useBool();
    const hourPop = useBool();
    const minutePop = useBool();
    const secondPop = useBool();

    const onSegmentChange = useCallback(
        (field: 'day' | 'hour' | 'minute' | 'second', v: number) => {
            switch (field) {
                case 'day':
                    setValue(new Duration(v, value.hour, value.minute, value.second));
                    break;
                case 'hour':
                    setValue(new Duration(value.day, v, value.minute, value.second));
                    break;
                case 'minute':
                    setValue(new Duration(value.day, value.hour, v, value.second));
                    break;
                case 'second':
                    setValue(new Duration(value.day, value.hour, value.minute, v));
                    break;
                default:
                    break;
            }
        },
        [value]
    );

    return (
        <Space align="baseline">
            <Popover content={`${value.day} Hari`}>
                <InputNumber
                    key={`Duration:${id}--Day`}
                    min={0}
                    size="small"
                    style={{ width }}
                    placeholder="Hari"
                    value={value.day}
                    onChange={(v) => onSegmentChange('day', v)}
                    onFocus={() => dayPop.setValue(true)}
                    onBlur={() => dayPop.setValue(false)}
                />
            </Popover>
            <Popover content={`${value.hour} Jam`}>
                <InputNumber
                    key={`Duration:${id}--Hour`}
                    min={0}
                    max={23}
                    size="small"
                    style={{ width }}
                    placeholder="Jam"
                    value={value.hour}
                    onChange={(v) => onSegmentChange('hour', v)}
                    onFocus={() => hourPop.setValue(true)}
                    onBlur={() => hourPop.setValue(false)}
                />
            </Popover>
            <Popover content={`${value.minute} Menit`}>
                <InputNumber
                    key={`Duration:${id}--Minute`}
                    min={0}
                    max={59}
                    size="small"
                    style={{ width }}
                    placeholder="Menit"
                    value={value.minute}
                    onChange={(v) => onSegmentChange('minute', v)}
                    onFocus={() => minutePop.setValue(true)}
                    onBlur={() => minutePop.setValue(false)}
                />
            </Popover>
            <Popover content={`${value.second} Detik`}>
                <InputNumber
                    key={`Duration:${id}--Second`}
                    min={0}
                    max={59}
                    size="small"
                    style={{ width }}
                    placeholder="Detik"
                    value={value.second}
                    onChange={(v) => onSegmentChange('second', v)}
                    onFocus={() => secondPop.setValue(true)}
                    onBlur={() => secondPop.setValue(false)}
                />
            </Popover>
        </Space>
    );
}
export interface DurationInputProps extends BaseInputProps {
    value?: string | Duration;
    onChange?(value: Duration): void;
}
