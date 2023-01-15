import { FilterOutlined } from '@ant-design/icons';
import { isDefined, isNum, mergeClassName, randomString } from '@mars/common';
import { Badge, Button, ButtonProps } from 'antd';
import { Children, isValidElement, useMemo } from 'react';
import { useMarsTable } from '_ctx/table.ctx';

export function THeader(props: HasChild) {
    const leftComponents: React.ReactNode[] = [];
    const rightComponents: React.ReactNode[] = [];

    Children.forEach(props.children, (elm) => {
        if (!isValidElement(elm)) return;
        else if (!THeader.VALID_ELM.includes(elm.type as any)) return;
        const pos = elm.props && elm.props.pos === 'right' ? 'right' : 'left';
        (pos === 'left' ? leftComponents : rightComponents).push(elm);
    });

    return (
        <div className="workspace-header">
            <ul className="left">{leftComponents}</ul>
            <ul className="right">{rightComponents.reverse()}</ul>
        </div>
    );
}

export namespace THeader {
    interface ActionItemProps extends ButtonProps {
        pos?: 'left' | 'right';
        badge?: number;
    }

    export function Action(props: ActionItemProps) {
        const { pos, className, badge, ...rest } = props;
        const id = useMemo(() => randomString(), []);

        const cls = mergeClassName('workspace-act', className);
        return (
            <li key={id} className={cls}>
                {!isNum(badge) && <Button {...rest} />}
                {isNum(badge) && (
                    <Badge count={badge}>
                        <Button {...rest} />
                    </Badge>
                )}
            </li>
        );
    }

    export function FilterAction(props: ActionItemProps) {
        const tableCtx = useMarsTable();
        if (!isDefined(tableCtx))
            throw new TypeError('Cannot find MarsTableContext in scope');

        const { onClick, icon, ...others } = props;
        return (
            <Action
                icon={<FilterOutlined />}
                onClick={() => tableCtx.toggleFilter()}
                {...others}
            />
        );
    }

    export const VALID_ELM = [Action, FilterAction];
}
