import { CopyOutlined, EditOutlined } from '@ant-design/icons';
import { isDefined, isFalsy } from '@mars/common';
import { Button, Space, Tag } from 'antd';
import { ColumnType } from 'antd/lib/table';
import { format } from 'date-fns';
import Link from 'next/link';
import { useCallback, useState, useEffect } from 'react';
import { MarsButton } from '_comp/base/Button';
import { Render } from '_comp/value-renderer';
import { CopyAsGaulTicketEvent } from '_utils/events';

export interface TableTickerColumnOptions {
    withActionCol?: boolean;
    withLinkToDetail?: boolean;
    withCopyToDrawer?: boolean;
    takeOrder(ticket: DTO.Ticket): void | Promise<void>;
    pageable: Pageable;
}
export interface TableUserColumnOptions {
    pageable?: Pageable;
    editUser?(user: DTO.Users): void;
}

export const TableTicketColms = (props: TableTickerColumnOptions) => {
    const { takeOrder, withActionCol = true, withCopyToDrawer = false } = props;
    const cols: ColumnType<DTO.Ticket>[] = [
        DefaulCol.INCREMENTAL_NO_COL(props.pageable),
        {
            title: 'Order No',
            align: 'center',
            dataIndex: 'no',
            filterSearch: true,
            render(value, record, index) {
                if (!props.withLinkToDetail) return value;
                // return <Link href={'/order/detail/' + value}>{value}</Link>;
                return <Link href={'/ticket/' + value}>{value}</Link>;
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            align: 'center',
            render: (v, r) => Render.orderStatus(v, true),
        },
        {
            title: 'Ga Ul',
            dataIndex: 'gaul',
            align: 'center',
            render: (v) => Render.bool(v),
        },
        {
            title: 'Umur Tiket',
            align: 'center',
            dataIndex: 'createdAt',
            render(value, record, index) {
                return <Difference orderno={record.no} opentime={value} />;
            },
        },
        {
            title: 'Service No',
            align: 'center',
            dataIndex: 'serviceNo',
        },
        {
            title: 'Tiket NOSSA',
            align: 'center',
            dataIndex: 'incidentNo',
        },
        {
            title: 'Product',
            align: 'center',
            dataIndex: 'product',
            render: Render.product,
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
        },
        DefaulCol.CREATION_DATE_COL,
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
                        <MarsButton
                            type="primary"
                            onClick={() => takeOrder(rec)}
                            icon={<EditOutlined />}
                            title="Ambil tiket"
                            disabled={disabled}
                            disabledOnRole={MarsButton.disableIfAdmin}
                        />
                    </Space>
                );
            },
        });
    }

    return cols;
};

export const TableUserColms = (opt: TableUserColumnOptions = {}) => {
    const noCol = !opt.pageable
        ? DefaulCol.NO_COL
        : DefaulCol.INCREMENTAL_NO_COL(opt.pageable);

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
        {
            title: 'Group',
            align: 'center',
            render(value, record, index) {
                if (!isDefined(record.group)) return '-';
                return (
                    <Link href={`/group/${record.group.id}`}>{record.group.name}</Link>
                );
            },
        },
        {
            title: 'Aktif',
            align: 'center',
            dataIndex: 'active',
            render: (v) =>
                Render.bool(v, {
                    trueText: 'Aktif',
                    falseText: 'Tidak Aktif',
                    reverseColor: true,
                }),
        },
        DefaulCol.CREATION_DATE_COL,
    ];

    const actions: JSX.Element[] = [];

    if (opt.editUser) {
        cols.push({
            title: 'Action',
            align: 'center',
            render(value, record, index) {
                return (
                    <>
                        <Button
                            icon={<EditOutlined />}
                            onClick={() => opt.editUser(record)}
                        >
                            Edit
                        </Button>
                    </>
                );
            },
        });
    }

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

namespace DefaulCol {
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
