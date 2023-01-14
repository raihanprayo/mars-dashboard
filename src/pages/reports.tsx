import { AuditOutlined } from '@ant-design/icons';
import { Col, Row, Statistic, Typography } from 'antd';
import axios from 'axios';
import { format, startOfToday } from 'date-fns';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import { createContext, ReactNode, useContext } from 'react';
import dynamic from 'next/dynamic';
import { isBrowser, isServer } from '_utils/constants';

const Pie = dynamic(
    async () => {
        const mod = await import('@ant-design/plots');
        return mod.Pie;
    },
    { ssr: false }
);

const ReportContext = createContext<ReportContext>(null);
interface ReportContext {
    cardSpan: number;
}

function ReportsPage(props: ReportsPageProps) {
    const hGutter = 10;

    if (isServer) return <></>;

    if (props.error) {
        return <>Fail to fetch data</>;
    }

    const data = props.data;
    return (
        <ReportContext.Provider value={{ cardSpan: 3 }}>
            <div className="mars-report">
                <Row>
                    <Col span={24}>
                        <div style={{ display: 'flex' }}>
                            <div style={{ flex: 1 }} />
                            <div style={{ height: '100%' }}>asd</div>
                        </div>
                    </Col>
                </Row>
                <Row gutter={[hGutter, hGutter]}>
                    <CardInfo
                        title="Total Tiket"
                        value={data.count.total}
                        prefix={<AuditOutlined />}
                    />
                    <CardInfo title="IPTV" value={data.count.iptv} />
                    <CardInfo title="INTERNET" value={data.count.internet} />
                    <CardInfo title="VOICE" value={data.count.voice} />
                </Row>
                <Row className="mars-chart-container" gutter={16}>
                    <ChartView title="Umur Tiket" data={data.age} />
                    <ChartView title="Lama Aksi" data={data.actionAge} />
                    <ChartView title="Waktu Respon" data={data.responseAge} />
                </Row>
            </div>
        </ReportContext.Provider>
    );
}

function CardInfo(props: CardInfoProps) {
    const { cardSpan } = useContext(ReportContext) || {};
    return (
        <Col span={cardSpan}>
            <Statistic
                className="mars-stat-card"
                title={props.title}
                value={props.value}
                prefix={props.prefix}
            />
        </Col>
    );
}
function ChartView(props: { data: PieChartData[]; title?: string; span?: number }) {
    const data = props.data;
    return (
        <Col className="mars-chart-view" span={props.span ?? 7}>
            <Typography.Title level={5}>
                <span>{props.title}</span>
            </Typography.Title>

            {isBrowser && (
                <Pie
                    className="mars-chart"
                    angleField="value"
                    colorField="type"
                    data={data}
                    radius={0.9}
                    label={{
                        type: 'inner',
                        offset: '-30%',
                        // content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
                        // content: ({ percent }) => `${percent}`,
                        style: {
                            fontSize: 14,
                            textAlign: 'center',
                        },
                    }}
                    interactions={[
                        { type: 'pie-legend-active' },
                        { type: 'element-active' },
                    ]}
                />
            )}
        </Col>
    );
}

export default ReportsPage;
export async function getServerSideProps(ctx: NextPageContext) {
    const session = await getSession(ctx);

    const now = startOfToday();
    const res = await api
        .get(
            '/chart/ticket/report',
            api.auhtHeader(session, {
                params: {
                    from: format(now, 'dd-MM-yyyy'),
                    to: format(now, 'dd-MM-yyyy'),
                },
            })
        )
        .catch((err) => err);

    if (axios.isAxiosError(res)) {
        return {
            props: { data: res.response?.data, error: true },
        };
    }

    return {
        props: { data: res.data, error: false },
    };
}

interface ReportsPageProps {
    data: PieChartDTO;
    error: boolean;
}

interface CardInfoProps extends HasChild {
    title?: string;
    value: number;
    prefix?: ReactNode;
}

interface PieChartData {
    type: string;
    value: number;
    color?: string;
}

interface PieChartDTO {
    age: PieChartData[];
    actionAge: PieChartData[];
    responseAge: PieChartData[];
    count: {
        total: number;
        iptv: number;
        internet: number;
        voice: number;
    };
}
