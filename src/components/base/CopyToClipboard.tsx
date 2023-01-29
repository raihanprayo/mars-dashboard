import { CopyOutlined } from '@ant-design/icons';
import { mergeClassName } from '@mars/common';
import { message, Space } from 'antd';
import { useState } from 'react';

export function CopyToClipboard(props: CopyToClipboardProps) {
    const onClick = () =>
        navigator.clipboard
            .writeText(String(props.data))
            .then(() => message.success('Text Copied', 2));

    const cls = mergeClassName('copyable', props.className);
    return (
        <span
            title={'copy ' + props.data}
            // align="baseline"
            className={cls}
            onClickCapture={onClick}
        >
            {props.children || props.data}
            {props.withIcon && <CopyOutlined />}
        </span>
    );
}

type Readable = string | number;
export interface CopyToClipboardProps extends HasChild {
    data: Readable;
    withIcon?: boolean;

    className?: string;
}
