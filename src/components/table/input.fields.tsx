import { Duration, isBool, isDefined, isStr, isUndef, randomString } from '@mars/common';
import {
    AutoComplete,
    AutoCompleteProps,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Popover,
    Radio,
    Select,
    SelectProps,
    Space,
    Transfer,
} from 'antd';
import type { DefaultOptionType } from 'antd/lib/select/index';
import type { TransferDirection, TransferItem } from 'antd/lib/transfer/index';
import moment, { isMoment, Moment } from 'moment';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBool } from '_hook/util.hook';
import notif from '_service/notif';
import { onAuthenticated } from '_hook/credential.hook';

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

// ==================================================================================================================
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
                            key: role.name,
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
                const picked = res.data.map((e) => e.name);
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
        console.log(nextTargetKeys);
        props.onChange?.(nextTargetKeys);
        // props.onChange?.({
        //     [indexUnselectedField]: roles
        //         .filter((e) => !nextTargetKeys.includes(e.id))
        //         .map((e) => e.id),
        //     [indexSelectedField]: nextTargetKeys,
        // });
    };

    // console.log(props.value);
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

// ==================================================================================================================
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

// ==================================================================================================================
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

// ==================================================================================================================
export function SolutionSelect(props: SolutionSelectProps) {
    const loading = useBool();
    const [list, setList] = useState<DefaultOptionType[]>([]);

    useEffect(() => {
        loading.toggle();
        api.get<DTO.Solution[]>('/solution', {
            params: { size: 1000 },
        })
            .then(({ data }) => {
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

// ==================================================================================================================
type DurationUnit = 'day' | 'hour' | 'minute' | 'second';
export function DurationInput(props: DurationInputProps) {
    const id = useMemo(() => randomString(12), []);
    const width = 60;
    const [value, setValue] = useState<Duration>(
        isStr(props.value)
            ? Duration.from(props.value)
            : isDefined(props.value)
            ? props.value
            : new Duration()
    );

    const dayPop = useBool();
    const hourPop = useBool();
    const minutePop = useBool();
    const secondPop = useBool();

    const onSegmentChange = useCallback(
        (field: DurationUnit, v: number) => {
            let newVal: Duration;
            switch (field) {
                case 'day':
                    newVal = new Duration(v, value.hour, value.minute, value.second);
                    break;
                case 'hour':
                    newVal = new Duration(value.day, v, value.minute, value.second);
                    break;
                case 'minute':
                    newVal = new Duration(value.day, value.hour, v, value.second);
                    break;
                case 'second':
                    newVal = new Duration(value.day, value.hour, value.minute, v);
                    break;
                default:
                    break;
            }

            if (newVal) {
                setValue(newVal);
                props.onChange?.(newVal);
            }
        },
        [value]
    );

    const time = {
        day: value?.day || 0,
        hour: value?.hour || 0,
        minute: value?.minute || 0,
        second: value?.second || 0,
    };
    return (
        <Space id={props.id} align="baseline">
            <Popover content={`${time.day} Hari`}>
                <Input
                    type="number"
                    suffix="H"
                    key={`Duration:${id}--Day`}
                    min={0}
                    size="small"
                    style={{ width }}
                    placeholder="Hari"
                    value={time.day}
                    disabled={props.disabled}
                    onChange={(v) => onSegmentChange('day', Number(v))}
                    onFocus={() => dayPop.setValue(true)}
                    onBlur={() => dayPop.setValue(false)}
                    onMouseOver={() => dayPop.setValue(true)}
                    onMouseOut={() => dayPop.setValue(false)}
                />
            </Popover>
            <Popover content={`${time.hour} Jam`}>
                <Input
                    key={`Duration:${id}--Hour`}
                    type="number"
                    suffix="J"
                    min={0}
                    max={23}
                    size="small"
                    style={{ width }}
                    placeholder="Jam"
                    value={time.hour}
                    disabled={props.disabled}
                    onChange={(v) => onSegmentChange('hour', Number(v))}
                    onFocus={() => hourPop.setValue(true)}
                    onBlur={() => hourPop.setValue(false)}
                    onMouseOver={() => hourPop.setValue(true)}
                    onMouseOut={() => hourPop.setValue(false)}
                />
            </Popover>
            <Popover content={`${time.minute} Menit`}>
                <Input
                    key={`Duration:${id}--Minute`}
                    type="number"
                    suffix="M"
                    min={0}
                    max={59}
                    size="small"
                    style={{ width }}
                    placeholder="Menit"
                    value={time.minute}
                    disabled={props.disabled}
                    onChange={(v) => onSegmentChange('minute', Number(v))}
                    onFocus={() => minutePop.setValue(true)}
                    onBlur={() => minutePop.setValue(false)}
                    onMouseOver={() => minutePop.setValue(true)}
                    onMouseOut={() => minutePop.setValue(false)}
                />
            </Popover>
            <Popover content={`${time.second} Detik`}>
                <Input
                    key={`Duration:${id}--Second`}
                    type="number"
                    suffix="D"
                    min={0}
                    max={59}
                    size="small"
                    style={{ width }}
                    placeholder="Detik"
                    value={time.second}
                    disabled={props.disabled}
                    onChange={(v) => onSegmentChange('second', Number(v))}
                    onFocus={() => secondPop.setValue(true)}
                    onBlur={() => secondPop.setValue(false)}
                    onMouseOver={() => secondPop.setValue(true)}
                    onMouseOut={() => secondPop.setValue(false)}
                />
            </Popover>
        </Space>
    );
}
export interface DurationInputProps extends BaseInputProps {
    value?: string | Duration;
    onChange?(value: Duration): void;
    disabled?: boolean;
}

// ==================================================================================================================
export function StoSelect(props: StoSelectProps) {
    const loading = useBool(true);
    const [options, setOptions] = useState<DefaultOptionType[]>([]);

    const witel = Form.useWatch<Mars.Witel>('witel');
    const { value: rawValue, onChange: rawOnChange, ...others } = props;

    const mapSto = (sto: DTO.Sto, container: Record<Mars.Witel, DefaultOptionType>) => {
        if (sto.witel) {
            if (sto.witel !== witel) return;
        }

        const subOpt = (container[sto.witel] = container[sto.witel] || {
            label: sto.witel,
            options: [],
        });

        subOpt.options.push({
            label: `${sto.alias} - ${sto.name}`,
            value: sto.alias,
        });
    };

    const init = () => {
        if (StoSelect.CACHE.size > 0) {
            const options: Record<Mars.Witel, DefaultOptionType> = {} as any;
            for (const [k, sto] of StoSelect.CACHE) mapSto(sto, options);

            setOptions(Object.values(options));
        } else {
            api.get<DTO.Sto[]>('/sto', { params: { size: 1000 } })
                .then((res) => {
                    const options: Record<Mars.Witel, DefaultOptionType> = {} as any;

                    for (const sto of res.data) {
                        StoSelect.CACHE.set(sto.alias, sto);
                        mapSto(sto, options);
                    }

                    setOptions(Object.values(options));
                })
                .catch(notif.axiosError);
        }
        loading.setValue(false);
    };

    useEffect(() => init(), [witel]);

    return (
        <Select
            showSearch
            id={props.id}
            value={props.value}
            loading={loading.value}
            options={options}
            onChange={props.onChange}
        />
    );
}
StoSelect.CACHE = new Map<string, DTO.Sto>();
export interface StoSelectProps extends BaseInputProps {}

// ==================================================================================================================
export function SettingIssueSelect(props: SettingIssueSelectProps) {
    const [issues, setIssues] = useState<DefaultOptionType[]>([]);

    const init = () => {
        api.get<DTO.Issue[]>('/issue', {
            params: {
                size: 1000,
                deleted: {
                    eq: false,
                },
            },
        })
            .then((res) => {
                setIssues(
                    res.data.map((issue) => ({
                        value: `${issue.id}`,
                        label: issue.alias || issue.name,
                    }))
                );
            })
            .catch(notif.axiosError);
    };

    onAuthenticated(() => {
        init();
    });

    return (
        <Select
            mode="tags"
            options={issues}
            tokenSeparators={['|']}
            value={props.value}
            onChange={props.onChange}
        />
    );
}
export interface SettingIssueSelectProps extends BaseInputProps {}

// ==================================================================================================================
export function SettingAcsolSelect(props: SettingAcsolSelectProps) {
    const [acsols, setAcsols] = useState<DefaultOptionType[]>([]);

    const init = () => {
        api.get<DTO.Solution[]>('/solution', {
            params: {
                size: 1000,
                deleted: {
                    eq: false,
                },
            },
        })
            .then((res) => {
                setAcsols(
                    res.data.map((acsol) => ({
                        value: `${acsol.id}`,
                        label: acsol.name,
                    }))
                );
            })
            .catch(notif.axiosError);
    };

    onAuthenticated(() => {
        init();
    });
    return (
        <Select
            mode="tags"
            options={acsols}
            tokenSeparators={['|']}
            value={props.value}
            onChange={props.onChange}
        />
    );
}
export interface SettingAcsolSelectProps extends BaseInputProps {}
