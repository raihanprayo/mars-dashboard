import { isFn } from '@mars/common';
import { Button, Drawer, Form, FormInstance, Space } from 'antd';
import { NamePath } from 'antd/lib/form/interface';
import { useMarsTable } from '_ctx/table.ctx';

export function TFilter<T = any>(props: TFilterProps<T>) {
    const tableCtx = useMarsTable();
    const { form, refresh, title, open } = props;

    const onClose = () => {
        if (isFn(props.onClose)) props.onClose();
        else tableCtx?.toggleFilter(false);
    };
    const onSearch = () => {
        const res = refresh?.();
        if (res instanceof Promise) res.finally(() => onClose());
        else onClose();
    };

    return (
        <Drawer
            title={title}
            open={open ?? tableCtx?.openFilter}
            onClose={onClose}
            extra={[
                <Space key="filter-search-btn">
                    <Button
                        type="primary"
                        onClick={() => {
                            form.resetFields();
                            refresh();
                        }}
                    >
                        Clear
                    </Button>
                    <Button type="primary" onClick={onSearch}>
                        Search
                    </Button>
                </Space>,
            ]}
        >
            <Form form={form} layout="vertical">
                {props.children}
            </Form>
        </Drawer>
    );
}

interface TFilterProps<T = any> extends HasChild {
    form?: FormInstance<ICriteria<T>>;
    refresh?(): any;

    title?: string;
    open?: boolean;
    onClose?(): void;

    // fields?: FilterField[];
}

export type FilterField = Fields.FieldString | Fields.FieldNumber | Fields.FieldDate;
namespace Fields {
    interface BaseField {
        index: NamePath;
        label?: string;
    }

    export interface FieldString extends BaseField {
        type: 'string';
        enums?: object;
    }
    export interface FieldNumber extends BaseField {
        type: 'number';
    }
    export interface FieldDate extends BaseField {
        type: 'date';
    }

    const OPERATOR = {
        eq: '==',
        notEq: '!=',
        in: '[>]',
        notIn: '![>]',
    } as const;

    export const STR_OPERATOR = {
        ...OPERATOR,
        like: '[=]',
        notLike: '![=]',
    } as const;

    export const RANGE_OPERATOR = {
        ...OPERATOR,
        gt: '>',
        gte: '>=',
        lt: '<',
        lte: '<=',
    } as const;
}
