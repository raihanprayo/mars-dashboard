import {
    DeleteOutlined,
    FilterOutlined,
    PlusOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { HttpHeader } from '@mars/common';
import { Button, Drawer, Form, Input, message, Space, Table } from 'antd';
import axios from 'axios';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { MarsButton } from '_comp/base/Button';
import { DateRangeFilter } from '_comp/table/input.fields';
import { DefaultCol } from '_comp/table/table.definitions';
import { TFilter } from '_comp/table/table.filter';
import { THeader } from '_comp/table/table.header';
import { usePage } from '_ctx/page.ctx';
import { MarsTablePagination, MarsTableProvider } from '_ctx/table.ctx';
import { usePageable } from '_hook/pageable.hook';
import { CoreService } from '_service/api';
import notif from '_service/notif';

export default function SolutionsPage(props: SolutionsPageProps) {
    const router = useRouter();
    const pageCtx = usePage();
    const { pageable, setPageable } = usePageable();

    const [filter] = Form.useForm<ICriteria<DTO.Solution>>();
    const [selected, setSelected] = useState<boolean[]>(
        Array(props.data?.length).fill(false)
    );

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

    const onSelectedChanged = (
        selectedRowKeys: React.Key[],
        selectedRows: DTO.Solution[]
    ) => {
        const bools = [...selected];
        for (let index = 0; index < props.data.length; index++) {
            const dto = props.data[index];

            const isSelected = selectedRows.findIndex((e) => e.id === dto.id) !== -1;
            bools[index] = isSelected;
        }

        setSelected(bools);
    };

    const actionDelete = (ids?: number[]) => {
        ids ||= selected.map((s, i) => props.data[i].id);
    };

    console.log(props.data);
    if (props.error) return <>{props.error.message}</>;
    return (
        <MarsTableProvider refresh={refresh}>
            <div className="workspace solution">
                <div className="solution-wrap">
                    <div className="solution-content">
                        <THeader>
                            <THeader.Action
                                icon={<PlusOutlined />}
                                title="Buat Solusi Baru"
                                onClick={() => setOpenAddDrw(true)}
                            >
                                Buat
                            </THeader.Action>
                            <THeader.Action
                                icon={<DeleteOutlined />}
                                title="Hapus Solusi"
                                disabled={selected.filter(e => e).length !== 0}
                            >
                                Hapus
                            </THeader.Action>
                            <THeader.FilterAction
                                pos="right"
                                title="Data Filter"
                                icon={<FilterOutlined />}
                            />
                            <THeader.Action
                                pos="right"
                                title="Refresh"
                                icon={<ReloadOutlined />}
                                onClick={(e) => refresh()}
                            />
                        </THeader>
                        <Table
                            size="small"
                            dataSource={props.data}
                            columns={[
                                DefaultCol.INCREMENTAL_NO_COL(pageable),
                                {
                                    title: 'Nama',
                                    align: 'center',
                                    dataIndex: 'name',
                                },
                                DefaultCol.CREATION_DATE_COL,
                                {
                                    title: 'Aksi',
                                    align: 'center',
                                    width: 100,
                                    render(value, record, index) {
                                        return (
                                            <Space align="baseline">
                                                <MarsButton
                                                    type="primary"
                                                    title={`Hapus ${record.id} `}
                                                    icon={<DeleteOutlined />}
                                                />
                                            </Space>
                                        );
                                    },
                                },
                            ]}
                            rowSelection={{
                                type: 'checkbox',
                                onChange: onSelectedChanged,
                            }}
                            pagination={MarsTablePagination({
                                pageable,
                                setPageable,
                                refresh,
                                total: props.total,
                            })}
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
    data: DTO.Solution[];
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
            data: res.data,
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
