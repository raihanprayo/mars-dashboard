import { mergeClassName } from "@mars/common";
import { Pagination, Table, TableProps } from "antd";

export default function MarsTable<T extends object = any>(
    props: TableProps<T>
) {
    const { className, pagination, ...inheritProps } = props;

    const containerClassName = mergeClassName("table-container", className);
    return (
        <div className={containerClassName}>
            <div className="table-wrapper">
                <Table<T> {...inheritProps} pagination={false} />
            </div>
            {pagination && (
                <Pagination {...pagination} className={mergeClassName(
                    'ant-pagination'
                )} />
            )}
        </div>
    );
}
