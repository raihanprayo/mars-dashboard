import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { HttpHeader } from '@mars/common';
import { DefaultCol, EnumSelect, TFilter, THeader } from '_comp/table';
import { Render } from '_comp/value-renderer';
import { usePage } from '_ctx/page.ctx';
import { MarsTablePagination, MarsTableProvider } from '_ctx/table.ctx';
import { usePageable } from '_hook/pageable.hook';
import { useBool } from '_hook/util.hook';
import { CoreService } from '_service/api';
import notif from '_service/notif';
import { Button, Drawer, Form, Input, Space, Table } from 'antd';
import axios from 'axios';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function StoPage(props: StoPageProps) {
    const router = useRouter();
    const pageCtx = usePage();
    const { pageable, setPageable } = usePageable();

    const [filter] = Form.useForm();
    const openCreateDrawer = useBool();
    const init = useBool(false);

    const refresh = () => {
        pageCtx.setLoading(true);
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
            .finally(() => pageCtx.setLoading(false));
    };

    useEffect(() => {
        if (init.value) refresh();
        else init.setValue(true);
    }, [pageable.page, pageable.size]);

    return (
        <MarsTableProvider refresh={refresh}>
            <Head>
                <title>Mars - STO</title>
            </Head>
            <div className="workspace table-view">
                <THeader>
                    <THeader.Action
                        title="Tambah/Buat"
                        icon={<PlusOutlined />}
                        onClick={openCreateDrawer.toggle}
                    />
                    <THeader.Action
                        pos="right"
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
                            title: 'Nama',
                            dataIndex: 'name',
                            align: 'center',
                            width: 300,
                            render: (v: string) => v?.toUpperCase(),
                        },
                        {
                            title: 'Code',
                            dataIndex: 'alias',
                            align: 'center',
                            width: 100,
                            render: Render.tags({ bold: true }),
                        },
                        {
                            title: 'Witel',
                            dataIndex: 'witel',
                            align: 'center',
                            width: 150,
                            render: Render.witel,
                        },
                        {
                            title: 'Datel',
                            dataIndex: 'datel',
                            align: 'center',
                        },
                    ]}
                />
                <TFilter form={filter} title="STO Filter">
                    <Form.Item label="Nama" name={['name', 'like']}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Code" name={['alias', 'like']}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Datel" name={['datel', 'like']}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Witel" name={['witel', 'in']}>
                        <EnumSelect enums={Mars.Witel} />
                    </Form.Item>
                </TFilter>
                <AddStoDrawer
                    open={openCreateDrawer.value}
                    onClose={() => {
                        openCreateDrawer.setValue(false);
                    }}
                />
            </div>
        </MarsTableProvider>
    );
}

export async function getServerSideProps(ctx: NextPageContext) {
    const session = await getSession(ctx);
    const config = api.auhtHeader(session, {
        params: {
            page: 0,
            size: 10,
            ...ctx.query,
        },
    });

    console.log(config.params);

    const res = await api.manage(api.get('/sto', config));
    if (axios.isAxiosError(res)) return api.serverSideError(res);
    else {
        console.log(res.data);

        const total = res.headers[HttpHeader.X_TOTAL_COUNT] || res.data.length;
        console.log('Total STO:', total);
        return {
            props: {
                total,
                data: res.data,
            },
        };
    }
}

interface StoPageProps extends CoreService.ErrorDTO {
    data: any[];
    total: number;
}

function AddStoDrawer(props: AddStoDrawerProps) {
    const router = useRouter();
    const loading = useBool();
    const [form] = Form.useForm();

    const onClose = () => {
        form.resetFields();
        props.onClose?.();
    };

    const onSubmit = async () => {
        const result = await form.validateFields();
        loading.setValue(true);
        api.post('/sto', result)
            .then(router.reload)
            .catch((err) => notif.error(err))
            .finally(() => loading.setValue(false));
    };

    const extra = (
        <Space>
            <Button type="primary" loading={loading.value} onClick={onSubmit}>
                Simpan
            </Button>
        </Space>
    );

    return (
        <Drawer
            title="Tambah STO"
            open={props.open}
            onClose={onClose}
            width={550}
            extra={extra}
        >
            <Form form={form} layout="vertical">
                <Form.Item label="Witel" name="witel">
                    <EnumSelect enums={Mars.Witel} mode="single" />
                </Form.Item>
                <Form.Item label="Datel" name="datel">
                    <Input />
                </Form.Item>
                <Form.Item label="Nama" name="name">
                    <Input />
                </Form.Item>
                <Form.Item label="Code" name="alias">
                    <Input />
                </Form.Item>
            </Form>
        </Drawer>
    );
}
interface AddStoDrawerProps {
    open?: boolean;
    onClose?(): void;
}
