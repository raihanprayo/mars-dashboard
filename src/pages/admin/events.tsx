import { ReloadOutlined } from '@ant-design/icons';
import { HttpHeader } from '@mars/common';
import { DateRangeFilter, DefaultCol, TFilter, THeader } from '_comp/table';
import { Render } from '_comp/value-renderer';
import { usePage } from '_ctx/page.ctx';
import { MarsTablePagination, MarsTableProvider } from '_ctx/table.ctx';
import { usePageable } from '_hook/pageable.hook';
import { CoreService } from '_service/api';
import { getServerSidePropsWrapper } from '_utils/fns/get-server-side-props';
import { Form, Input, Table } from 'antd';
import axios from 'axios';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';

export default function UserEventPage(props: UserEventPageProps) {
    const page = usePage();
    const router = useRouter();
    const { pageable, setPageable } = usePageable();

    const [filter] = Form.useForm();

    const refresh = () => {
        page.setLoading(true);
        return router
            .push({
                pathname: router.pathname,
                query: api.serializeParam({
                    page: pageable.page,
                    size: pageable.size,
                    sort:
                        pageable.sort === Pageable.Sorts.UNSORT
                            ? undefined
                            : pageable.sort,
                    ...filter.getFieldsValue(),
                }),
            })
            .finally(() => page.setLoading(false));
    };

    if (props.error) return <>{props.error.message}</>;

    return (
        <MarsTableProvider refresh={refresh}>
            <div className="workspace table-view">
                <THeader>
                    <THeader.Action
                        pos="right"
                        type="primary"
                        title="Refresh"
                        icon={<ReloadOutlined />}
                        onClick={refresh}
                    />
                    <THeader.FilterAction pos="right" title="Filter">
                        Filter
                    </THeader.FilterAction>
                </THeader>
                <Table
                    size="small"
                    dataSource={props.data}
                    pagination={MarsTablePagination({
                        pageable,
                        setPageable,
                        total: props.total,
                    })}
                    columns={[
                        DefaultCol.INCREMENTAL_NO_COL(pageable),
                        {
                            title: 'Username',
                            align: 'center',
                            dataIndex: 'createdBy',
                            width: 120,
                        },
                        {
                            title: 'Jenis',
                            align: 'center',
                            dataIndex: 'type',
                            width: 180,
                        },
                        DefaultCol.CREATION_DATE_COL,
                        {
                            title: 'Konteks',
                            render(value, record, index) {
                                const json = JSON.stringify(
                                    JSON.parse(record.details),
                                    null,
                                    4
                                );
                                const breaks = json.split('\n');
                                return (
                                    <div
                                        style={{
                                            margin: '0 25px',
                                            padding: '5px 25px',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        <pre
                                            dangerouslySetInnerHTML={{
                                                __html: breaks.join('<br />'),
                                            }}
                                        />
                                    </div>
                                );
                            },
                        },
                    ]}
                />
                <TFilter form={filter} title="Event Filter">
                    <Form.Item label="Jenis" name={['type', 'like']}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Username" name={['createdBy', 'like']}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Tanggal Dibuat" name="createdAt">
                        <DateRangeFilter allowClear withTime />
                    </Form.Item>
                </TFilter>
            </div>
        </MarsTableProvider>
    );
}

export const getServerSideProps = getServerSidePropsWrapper(
    async (ctx, session, config) => {
        const res = await api.manage(api.get('/user/event', config));
        if (axios.isAxiosError(res)) return api.serverSideError(res);
        const total = res.headers[HttpHeader.X_TOTAL_COUNT] || res.data.length;
        return {
            props: {
                total,
                data: res.data.map((e) => {
                    e['key'] = e.id;
                    return e;
                }),
            },
        };
    }
);

interface UserEventPageProps extends CoreService.ErrorDTO {
    total: number;
    data: any[];
}
