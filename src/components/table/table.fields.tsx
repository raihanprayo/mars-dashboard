import { DatePicker, Transfer } from 'antd';
import type { TransferDirection, TransferItem } from 'antd/lib/transfer/index';
import type { Moment } from 'moment';
import { useEffect, useState } from 'react';

interface BaseInputProps {
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
export interface DateFilterProps extends BaseInputProps {
    allowClear?: boolean;
    withTime?: boolean;
    greaterEqualName?: string;
    lessThanEqualName?: string;
}

export function RoleTransfer(props: RoleTransferProps) {
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
            removed: roles.filter((e) => !nextTargetKeys.includes(e.id)).map((e) => e.id),
            selected: nextTargetKeys,
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
}
interface RoleSelectionItem extends TransferItem {
    id: string;
}
