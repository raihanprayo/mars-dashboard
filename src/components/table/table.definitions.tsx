import { Button, Tag } from 'antd';
import { ColumnType } from 'antd/lib/table';
import { format } from 'date-fns';
import Link from 'next/link';
import { useCallback, useState, useEffect } from 'react';
import { Render } from '_comp/value-renderer';

export interface TableTickerColumnOptions {
    withActionCol?: boolean;
    withLinkToDetail?: boolean;
    takeOrder(id: string): void | Promise<void>;
}

export const TableTicketColms = (props: TableTickerColumnOptions) => {
    const { takeOrder, withActionCol = true } = props;
    const cols: ColumnType<DTO.Ticket>[] = [
        {
            title: 'No',
            width: 40,
            align: 'center',
            render: (v, r, i) => <b>{`${i + 1}`}</b>,
        },
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
        {
            title: 'Tgl Masuk',
            align: 'center',
            dataIndex: 'createdAt',
            render(value, record, index) {
                const d = new Date(value);
                const f = format(d, 'EEEE, dd MMM yyyy - HH:mm:ss aa');
                return f;
            },
        },
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
                    <Button
                        type="primary"
                        onClick={() => takeOrder(rec.id)}
                        disabled={disabled}
                    >
                        Ambil
                    </Button>
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
