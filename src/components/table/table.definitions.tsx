import {
    CheckOutlined,
    CloseOutlined,
    CopyOutlined,
    EditOutlined,
} from '@ant-design/icons';
import { isDefined, isFalsy, isFn } from '@mars/common';
import { Button, Space, Tag } from 'antd';
import { ColumnType } from 'antd/lib/table';
import { format } from 'date-fns';
import Link from 'next/link';
import { useCallback, useState, useEffect } from 'react';
import { MarsButton } from '_comp/base/Button';
import { Render } from '_comp/value-renderer';
import { CopyAsGaulTicketEvent } from '_utils/events';

export interface TableTickerColumnOptions {
    takeOrder?(ticket: DTO.Ticket): void;
    withActionCol?: boolean;
    withLinkToDetail?: boolean;
    withCopyToDrawer?: boolean;
    pageable: Pageable;
}
export interface TableUserColumnOptions {
    pageable?: Pageable;
    editUser?(user: DTO.Users): void;
}
export interface TableApprovalColumnOptions {
    pageable?: Pageable;
    onAcceptClick(record: DTO.UserApproval, accepted: boolean): void;
}
export interface TableSolutionColumnOptions {
    pageable?: Pageable;
}

export const TableTicketColms = (opt: TableTickerColumnOptions) => {
    const { takeOrder, withActionCol = true, withCopyToDrawer = false } = opt;
    const cols: ColumnType<DTO.Ticket>[] = [
        DefaultCol.INCREMENTAL_NO_COL(opt.pageable),
        {
            title: 'Order No',
            align: 'center',
            dataIndex: 'no',
            sorter: true,
            render(value, record, index) {
                if (!opt.withLinkToDetail) return value;
                // return <Link href={'/order/detail/' + value}>{value}</Link>;
                return <Link href={'/ticket/' + value}>{value}</Link>;
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            align: 'center',
            sorter: true,
            render: (v, r) => Render.orderStatus(v, true),
        },
        {
            title: 'Gaul',
            dataIndex: 'gaul',
            align: 'center',
            sorter: true,
            render: (v) => Render.bool(v),
        },
        {
            title: 'Umur Tiket',
            align: 'center',
            render(value, record, index) {
                return <Difference orderno={record.no} opentime={record.createdAt} />;
            },
        },
        {
            title: 'Service No',
            align: 'center',
            dataIndex: 'serviceNo',
            sorter: true,
        },
        {
            title: 'Tiket NOSSA',
            align: 'center',
            dataIndex: 'incidentNo',
            sorter: true,
        },
        {
            title: 'Product',
            align: 'center',
            dataIndex: 'product',
            sorter: true,
            render: Render.product,
        },
        {
            title: 'Witel',
            align: 'center',
            dataIndex: 'witel',
            sorter: true,
            render: Render.witel,
        },
        {
            title: 'STO',
            align: 'center',
            dataIndex: 'sto',
            sorter: true,
        },
        {
            title: 'Sumber',
            align: 'center',
            dataIndex: 'source',
            sorter: true,
            render: Render.tags(),
        },
        { ...DefaultCol.CREATION_DATE_COL, sorter: true },
    ];

    if (withActionCol) {
        cols.push({
            title: 'Action',
            align: 'center',
            render(v, rec, index) {
                const disabled = [
                    Mars.Status.CONFIRMATION,
                    Mars.Status.CLOSED,
                    Mars.Status.PENDING,
                ].includes(rec.status);

                return (
                    <Space>
                        {withCopyToDrawer && (
                            <MarsButton
                                type="primary"
                                title="Buat Gangguan Ulang"
                                icon={<CopyOutlined />}
                                onClick={() => CopyAsGaulTicketEvent.emit(rec)}
                                disabledOnRole={MarsButton.disableIfAdmin}
                            />
                        )}
                        {isFn(takeOrder) && (
                            <MarsButton
                                type="primary"
                                onClick={() => takeOrder(rec)}
                                icon={<EditOutlined />}
                                title="Ambil tiket"
                                disabled={disabled}
                                disabledOnRole={MarsButton.disableIfAdmin}
                                children={!withCopyToDrawer ? 'Ambil' : null}
                            />
                        )}
                    </Space>
                );
            },
        });
    }

    return cols;
};

export const TableUserColms = (opt: TableUserColumnOptions = {}) => {
    const noCol = !opt.pageable
        ? DefaultCol.NO_COL
        : DefaultCol.INCREMENTAL_NO_COL(opt.pageable);

    const cols: ColumnType<DTO.Users>[] = [
        noCol,
        {
            title: 'Nama',
            align: 'center',
            dataIndex: 'name',
        },
        {
            title: 'NIK',
            align: 'center',
            dataIndex: 'nik',
        },
        // {
        //     title: 'Group',
        //     align: 'center',
        //     render(value, record, index) {
        //         if (!isDefined(record.group)) return '-';
        //         return (
        //             <Link href={`/group/${record.group.id}`}>{record.group.name}</Link>
        //         );
        //     },
        // },
        {
            title: 'Witel/STO',
            dataIndex: 'witel',
            align: 'center',
            render: (value, record) => {

                return <Space align='center'>
                    {Render.witel(value)}
                    <Tag>{record['sto']}</Tag>
                </Space>
            },
        },
        {
            title: 'Role',
            align: 'center',
            render(value, record, index) {
                const roles: string[] = record.roles as any;
                return (
                    <>
                        {roles.map((role, i) => (
                            <Tag key={`${record.id}:role:${i}`}>
                                <b>{role.toUpperCase()}</b>
                            </Tag>
                        ))}
                    </>
                );
            },
        },
        {
            title: 'Aktif',
            align: 'center',
            dataIndex: 'active',
            width: 150,
            render: (v) =>
                Render.bool(v, {
                    trueText: 'Aktif',
                    falseText: 'Tidak Aktif',
                    reverseColor: true,
                }),
        },
        DefaultCol.CREATION_DATE_COL,
    ];

    if (opt.editUser) {
        cols.push({
            title: 'Action',
            align: 'center',
            render(value, record, index) {
                return (
                    <Space>
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => opt.editUser(record)}
                        >
                            Edit
                        </Button>
                    </Space>
                );
            },
        });
    }

    return cols;
};

export const TableApprovalColms = (opt: TableApprovalColumnOptions) => {
    const noCol = !opt.pageable
        ? DefaultCol.NO_COL
        : DefaultCol.INCREMENTAL_NO_COL(opt.pageable);

    const cols: ColumnType<DTO.UserApproval>[] = [
        noCol,
        {
            title: 'Reg No',
            align: 'center',
            dataIndex: 'no',
        },
        {
            title: 'Nama',
            align: 'center',
            dataIndex: 'name',
        },
        {
            title: 'NIK',
            align: 'center',
            dataIndex: 'nik',
        },
        {
            title: 'Status',
            align: 'center',
            dataIndex: 'status',
            render: Render.tags(),
        },
        {
            title: 'Witel',
            align: 'center',
            dataIndex: 'witel',
            render: Render.witel,
        },
        {
            title: 'STO',
            align: 'center',
            dataIndex: 'sto',
            render: Render.tags(),
        },
        DefaultCol.CREATION_DATE_COL,
        {
            title: 'Action',
            align: 'center',
            render(v, r, i) {
                return (
                    <>
                        <Button
                            size="small"
                            type="primary"
                            icon={<CheckOutlined />}
                            style={{ marginRight: '0.5rem' }}
                            title="Terima Approval"
                            onClick={() => opt.onAcceptClick(r, true)}
                        />
                        <Button
                            size="small"
                            type="primary"
                            icon={<CloseOutlined />}
                            title="Tolak Approval"
                            onClick={() => opt.onAcceptClick(r, false)}
                        />
                    </>
                );
            },
        },
    ];

    return cols;
};

export const TableSolutionColms = (opt: TableSolutionColumnOptions = {}) => {
    const noCol = !opt.pageable
        ? DefaultCol.NO_COL
        : DefaultCol.INCREMENTAL_NO_COL(opt.pageable);

    const cols: ColumnType<DTO.Solution>[] = [
        noCol,
        {
            title: 'Nama',
        },
        DefaultCol.CREATION_DATE_COL,
        {
            title: 'Aksi',
            align: 'center',
            render(v, r, i) {
                return '-';
            },
        },
    ];

    return cols;
};

function Difference(props: { orderno: string | number; opentime: Date | string }) {
    const getTime = useCallback(() => {
        const { hour, minute } = Render.calcOrderAge(props.opentime);
        return `${hour}j ${minute}m`;
    }, []);

    const [time, setTime] = useState(getTime());

    useEffect(() => {
        const t = setInterval(() => setTime(getTime()), 60000);
        return () => clearInterval(t);
    }, []);

    return <span className="diff-time">{time}</span>;
}

export namespace DefaultCol {
    export const NO_COL: ColumnType<any> = {
        title: 'No',
        width: 40,
        align: 'center',
        render: (v, r, i) => <b>{`${i + 1}`}</b>,
    };
    export const INCREMENTAL_NO_COL: (pageable: Pageable) => ColumnType<any> = (
        pageable
    ) => ({
        title: 'No',
        width: 40,
        align: 'center',
        render: (v, r, i) => {
            const { page, size } = pageable;
            const index = page * size + i;
            return <b>{`${index + 1}`}</b>;
        },
    });

    export const CREATION_DATE_COL: ColumnType<any> = {
        title: 'Tgl Masuk',
        align: 'center',
        dataIndex: 'createdAt',
        width: 215,
        render(value, record, index) {
            if (!isDefined(value) || isFalsy(value)) return '-';
            const d = new Date(value);
            const f = format(d, 'EEEE, dd MMM yyyy - HH:mm:ss');
            return f;
        },
    };

    export const UPDATE_DATE_COL: ColumnType<any> = {
        title: 'Tgl Diubah',
        align: 'center',
        dataIndex: 'updatedAt',
        width: 215,
        render(value, record, index) {
            if (!isDefined(value) || isFalsy(value)) return '-';
            const d = new Date(value);
            const f = format(d, 'EEEE, dd MMM yyyy - HH:mm:ss');
            return f;
        },
    };
}
