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
    const cols: ColumnType<DTO.Orders>[] = [
        {
            title: 'No',
            width: 40,
            align: 'center',
            render: (v, r, i) => <b>{`${i + 1}`}</b>,
        },
        {
            title: 'Order ID',
            align: 'center',
            dataIndex: 'orderno',
            filterSearch: true,
            render(value, record, index) {
                if (!props.withLinkToDetail) return value;
                return (
                    <Link href={'/order/detail/' + value}>
                        <a>{value}</a>
                    </Link>
                );
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            align: 'center',
            render: (v, r) => {
                const tag = Render.orderStatus(v, true);

                return (
                    <>
                        {tag}
                        {r.gaul ? <Tag>GAUL</Tag> : null}
                    </>
                );
            },
            filterMode: 'tree',
            filters: Object.keys(Mars.Status)
                .filter((e) => e !== Mars.Status.PROGRESS)
                .concat('GAUL')
                .map((e) => {
                    return {
                        text: e,
                        value: e,
                    };
                }),
        },
        {
            title: 'Umur Tiket',
            align: 'center',
            dataIndex: 'opentime',
            render(value, record, index) {
                return <Difference orderno={record.orderno} opentime={value} />;
            },
        },
        {
            title: 'Service No',
            align: 'center',
            dataIndex: 'serviceno',
        },
        {
            title: 'Product',
            align: 'center',
            dataIndex: 'producttype',
            render: Render.product,
        },

        {
            title: 'Witel',
            align: 'center',
            dataIndex: 'witel',
            filters: Object.keys(Mars.Witel).map((e) => ({
                text: e,
                value: e,
            })),
        },
        {
            title: 'STO',
            align: 'center',
            dataIndex: 'sto',
        },
        {
            title: 'Tgl Masuk',
            align: 'center',
            dataIndex: 'opentime',
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
                const disabled = [Mars.Status.CONFIRMATION, Mars.Status.CLOSED].includes(
                    rec.status
                );
                return (
                    <Button
                        type="primary"
                        onClick={() => props.takeOrder(rec.id)}
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
