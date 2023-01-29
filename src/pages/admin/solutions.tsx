import {
    FileAddOutlined,
    FilterOutlined,
    LoginOutlined,
    ReloadOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { HttpHeader } from '@mars/common';
import { Button, Drawer, Form, Input, List, message, Space } from 'antd';
import axios from 'axios';
import { format } from 'date-fns';
import { NextPageContext } from 'next';
import { getSession, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { MarsButton } from '_comp/base/Button';
import { DateRangeFilter } from '_comp/table/input.fields';
import { TFilter } from '_comp/table/table.filter';
import { THeader } from '_comp/table/table.header';
import { Render } from '_comp/value-renderer';
import { usePage } from '_ctx/page.ctx';
import { MarsTableProvider } from '_ctx/table.ctx';
import { usePageable } from '_hook/pageable.hook';
import { CoreService } from '_service/api';
import notif from '_service/notif';

export default function SolutionsPage(props: SolutionsPageProps) {
    const router = useRouter();
    const pageCtx = usePage();
    const { pageable, setPageable } = usePageable();

    const [filter] = Form.useForm<ICriteria<DTO.Solution>>();
    const [openAddDrw, setOpenAddDrw] = useState(false);

    const refresh = useCallback(() => {
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
                    roles: {},
                }),
            })
            .finally(() => pageCtx.setLoading(false));
    }, [pageable.page, pageable.size, pageable.sort]);

    if (props.error) return <>{props.error.message}</>;

    console.log(props.solutions);
    return (
        <MarsTableProvider refresh={refresh}>
            <div className="workspace solution">
                <THeader>
                    <THeader.Action
                        icon={<FileAddOutlined />}
                        title="Buat Solusi Baru"
                        onClick={() => setOpenAddDrw(true)}
                    >
                        Buat
                    </THeader.Action>
                    <THeader.FilterAction
                        pos="right"
                        title="Data Filter"
                        icon={<FilterOutlined />}
                    >
                        Filter
                    </THeader.FilterAction>
                    <THeader.Action
                        pos="right"
                        title="Refresh"
                        icon={<ReloadOutlined />}
                        onClick={(e) => refresh()}
                    />
                </THeader>
                {/* <Table
                    dataSource={props.solutions}
                    columns={TableSolutionColms({ pageable })}
                    pagination={MarsTablePagination({
                        pageable,
                        refresh,
                        setPageable,
                        total: props.total,
                    })}
                /> */}

                <div className="solution-wrap">
                    <div className="solution-content">
                        <List
                            bordered
                            dataSource={props.solutions}
                            itemLayout="vertical"
                            renderItem={(item) => {
                                return (
                                    <List.Item
                                        actions={[
                                            <Space title="Tanggal Dibuat">
                                                <LoginOutlined />
                                                {format(
                                                    new Date(item.createdAt),
                                                    Render.DATE_WITH_TIMESTAMP
                                                )}
                                            </Space>,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            title={item.name}
                                            description={item.description}
                                        />
                                    </List.Item>
                                );
                            }}
                        />
                    </div>
                    <div className="solution-sider"></div>
                </div>
            </div>

            <TFilter form={filter}>
                <Form.Item label="ID" name={['id', 'eq']}>
                    <Input />
                </Form.Item>
                <Form.Item label="Nama" name={['name', 'like']}>
                    <Input />
                </Form.Item>
                <Form.Item label="Tanggal Dibuat" name="createdAt">
                    <DateRangeFilter />
                </Form.Item>
                <Form.Item label="Tanggal Diubah" name="updatedAt">
                    <DateRangeFilter />
                </Form.Item>
            </TFilter>
            <AddSolutionDrawer open={openAddDrw} onClose={() => setOpenAddDrw(false)} />
        </MarsTableProvider>
    );
}
interface SolutionsPageProps extends CoreService.ErrorDTO {
    solutions: DTO.Solution[];
    total: number;
}

export async function getServerSideProps(ctx: NextPageContext) {
    const session = await getSession(ctx);
    const config = api.auhtHeader(session, {
        params: ctx.query,
    });

    const res = await api.manage(api.get<DTO.Solution[]>('/solution', config));
    if (axios.isAxiosError(res)) return api.serverSideError(res);

    console.log(res.data);
    const total = Number(res.headers[HttpHeader.X_TOTAL_COUNT] || res.data.length);
    return {
        props: {
            total,
            solutions: res.data,
        },
    };
}

function AddSolutionDrawer(props: AddSolutionDrawerProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onSubmit = async () => {
        await form.validateFields();

        const value = form.getFieldsValue();
        setLoading(true);
        api.post('/solution', value)
            .then((res) =>
                message.success('berhasil membuat actual solution ' + value.name)
            )
            .catch(notif.axiosError)
            .finally(() => setLoading(false));
    };

    const action = (
        <Space>
            <MarsButton type="primary" onClick={() => form.resetFields()}>
                Reset
            </MarsButton>
            <MarsButton
                type="primary"
                loading={loading}
                onClick={onSubmit}
                // disabledOnRole={(r) => r !== 'admin'}
            >
                Tambah
            </MarsButton>
        </Space>
    );

    return (
        <Drawer
            title="Tambah Solusi"
            open={props.open}
            onClose={props.onClose}
            extra={action}
        >
            <Form form={form} layout="vertical">
                <Form.Item label="Nama" name={'name'}>
                    <Input />
                </Form.Item>
                <Form.Item label="Deskripsi" name={'description'}>
                    <Input.TextArea />
                </Form.Item>
            </Form>
        </Drawer>
    );
}
interface AddSolutionDrawerProps {
    open?: boolean;
    onClose?(): void;
}
