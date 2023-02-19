import { isDefined, isStr } from '@mars/common';
import { Popover, Spin } from 'antd';
import { createElement } from 'react';
import { useBool } from '_hook/util.hook';

const cache = new Map<string, Partial<DTO.Users>>();

export function CreatedBy<T extends map>(props: UserInfoPopupProps<T>) {
    const field = props.field || 'createdBy';
    const createdBy = isStr(props.data) ? props.data : props.data[field];

    const loading = useBool(true);
    const onVisibleChange = (v: bool) => {
        if (!v) return;

        if (!cache.has(createdBy)) {
            api.get<DTO.Users>('/user/detail/' + createdBy)
                .then((res) => {
                    cache.set(createdBy, res.data);
                })
                .catch((err) => cache.set(createdBy, { name: 'Deleted User' }))
                .finally(() => loading.setValue(false));
        } else loading.setValue(false);
    };

    const user = cache.get(createdBy);
    const name = isDefined(user)
        ? user.id
            ? user.name
            : createElement('i', {}, user.name)
        : createElement('i', {}, 'Unknown User');

    const content = <Spin spinning={loading.value}>{name}</Spin>;

    return (
        <Popover
            // title={cache.get(nik)?.name}
            content={content}
            onOpenChange={onVisibleChange}
        >
            <a href="javascript:void(0)">{createdBy}</a>
        </Popover>
    );
}

export interface UserInfoPopupProps<T extends map | string> {
    data: T;
    field?: string;
}
