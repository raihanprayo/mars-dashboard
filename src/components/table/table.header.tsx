import { isNum, mergeClassName } from '@mars/common';
import { Badge, Button, ButtonProps } from 'antd';
import { Children, DetailedHTMLProps, isValidElement, LiHTMLAttributes } from 'react';

export function THeader(props: HasChild) {
    const leftComponents: React.ReactNode[] = [];
    const rightComponents: React.ReactNode[] = [];

    Children.forEach(props.children, (elm) => {
        if (!isValidElement(elm)) return;
        else if (elm.type !== THeader.Action) return;
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

        const cls = mergeClassName('workspace-act', className);
        return (
            <li className={cls}>
                {!isNum(badge) && <Button {...rest} />}
                {isNum(badge) && (
                    <Badge count={badge}>
                        <Button {...rest} />
                    </Badge>
                )}
            </li>
        );
    }
}
