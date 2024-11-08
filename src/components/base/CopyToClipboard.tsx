import { CopyOutlined } from "@ant-design/icons";
import { isDefined, mergeClassName } from "@mars/common";
import { message, Space } from "antd";
import { useCallback } from "react";

export function CopyToClipboard(props: CopyToClipboardProps) {
    const onClick = useCallback(() => {
        console.debug("copy data to clipboard", props.data)
        navigator.clipboard
            .writeText(String(props.data))
            .then(() => message.success("Copy To Clipboard", 2));
    }, [props.data]);

    const cls = mergeClassName("copyable", props.className);
    if (!isDefined(props.data)) return <></>;
    return (
        <span
            title={"copy " + props.data}
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
