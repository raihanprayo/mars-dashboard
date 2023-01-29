import { FilterOutlined } from '@ant-design/icons';
import { isDefined, isFalsy, isNum, mergeClassName, randomString } from '@mars/common';
import { Badge, Button, ButtonProps } from 'antd';
import { Children, isValidElement, ReactElement, ReactNode, useMemo } from 'react';
import { MarsButton, MarsButtonProps } from '_comp/base/Button';
import { useMarsTable } from '_ctx/table.ctx';

function rerender(index: number, element: ReactElement) {
    const Type = element.type;
    return <Type {...element.props} />;
}

export function THeader(props: THeaderProps) {
    const cls = mergeClassName('workspace-header', props.className);
    return (
        <div className={cls}>
            {props.title}
            <div className="workspace-header-menu">
                <ul
                    className="menu left"
                    children={Children.map(props.children, (node, index) => {
                        if (!isValidElement(node)) return null;
                        else if (node.props.pos === 'right') return null;
                        return rerender(index, node);
                    })}
                />
                <ul
                    className="menu right"
                    children={Children.map(props.children, (node, index) => {
                        if (!isValidElement(node)) return null;
                        else if (isFalsy(node.props.pos) || node.props.pos === 'left')
                            return null;
                        return rerender(index, node);
                    })}
                />
            </div>
        </div>
    );
}

export namespace THeader {
    export interface HasPositionProps {
        pos?: 'left' | 'right';
    }

    interface ActionItemProps extends MarsButtonProps, HasPositionProps {
        badge?: number;
    }

    export function Action(props: ActionItemProps) {
        const { pos, className, badge, type = 'primary', ...rest } = props;
        const id = useMemo(() => randomString(), []);

        const cls = mergeClassName('workspace-act', className);
        const btn = <MarsButton type={type} {...rest} />;
        return (
            <li key={id} className={cls}>
                {!isNum(badge) && btn}
                {isNum(badge) && <Badge count={badge}>{btn}</Badge>}
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

export interface THeaderProps extends HasChild {
    className?: string;
    title?: ReactNode;
    // children?: ReactElement<THeader.HasPositionProps> | ReactElement<THeader.HasPositionProps>[];
}

// export class ActionItem {
//     abc: string;
// }
