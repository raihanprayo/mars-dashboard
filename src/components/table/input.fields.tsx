import { isDefined } from '@mars/common';
import { DatePicker, Radio, Select, SelectProps, Transfer } from 'antd';
import { DefaultOptionType } from 'antd/lib/select/index';
import type { TransferDirection, TransferItem } from 'antd/lib/transfer/index';
import moment, { isMoment, Moment } from 'moment';
import { useEffect, useState } from 'react';
import { useBool } from '_hook/util.hook';
import notif from '_service/notif';

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

    let actualMode = mode === 'multiple' ? mode : mode === 'single' ? null : mode;
    return (
        <Select
            {...rest}
            mode={actualMode}
            options={Object.values(props.enums)
                .filter((e) => {
                    if (/^(\d+)$/i.test(e.toString())) return false;
                    return true;
                })
                .map((en) => ({ label: en, value: en }))}
        />
    );
}
export interface EnumSelectProps
    extends BaseInputProps,
        Omit<SelectProps, 'onChange' | 'options' | 'mode'> {
    enums: Record<string, string | number>;
    mode?: 'multiple' | 'single';
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
