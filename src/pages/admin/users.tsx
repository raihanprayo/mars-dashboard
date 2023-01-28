import { AuditOutlined, ReloadOutlined, UserAddOutlined } from '@ant-design/icons';
import { HttpHeader } from '@mars/common';
import { Form, Input, Radio, Table } from 'antd';
import axios from 'axios';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useCallback, useContext, useState } from 'react';
import { AddUserDrawer, EditUserDrawer } from '_comp/admin/index';
import { TableUserColms } from '_comp/table/table.definitions';
import { DateRangeFilter } from '_comp/table/input.fields';
import { TFilter } from '_comp/table/table.filter';
import { THeader } from '_comp/table/table.header';
import { PageContext } from '_ctx/page.ctx';
import { MarsTableProvider } from '_ctx/table.ctx';
import { usePageable } from '_hook/pageable.hook';
import type { CoreService } from '_service/api';

export default function UsersPage(props: UsersPageProps) {
    const router = useRouter();
    const pageCtx = useContext(PageContext);
    const { pageable, setPageable } = usePageable();
    const [filter] = Form.useForm<ICriteria<DTO.Users>>();

    const [openRegister, setOpenRegister] = useState(false);
    const [editor, setEditor] = useState<{ open: bool; user: DTO.Users }>({
        open: false,
        user: null,
    });

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
                    roles: {}
                }),
            })
            .finally(() => pageCtx.setLoading(false));
    }, [pageable.page, pageable.size, pageable.sort]);

    const editUser = useCallback((user: DTO.Users) => {
        setEditor({ open: true, user });
    }, []);

    return (
        <MarsTableProvider>
            <div className="workspace table-view">
                <THeader>
                    {/* <THeader.Action
                        type="primary"
                        title="Registration Approvals"
                        icon={<AuditOutlined />}
                    /> */}
                    <THeader.Action
                        title="Tambah User"
                        icon={<UserAddOutlined />}
                        onClick={() => setOpenRegister(true)}
                    >
                        Tambah User
                    </THeader.Action>

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
                    columns={TableUserColms({ editUser, pageable })}
                    dataSource={props.users ?? []}
                    pagination={{
                        total: props.total,
                        current: pageable.page + 1,
                        pageSizeOptions: [10, 20, 50, 100, 200],
                        hideOnSinglePage: false,
                        onChange(page, pageSize) {
                            if (pageable.page !== page - 1) {
                                setPageable({ page: page - 1 });
                                refresh();
                            }
                        },
                        onShowSizeChange(current, size) {
                            if (current !== size) {
                                setPageable({ size });
                                refresh();
                            }
                        },
                    }}
                />
                <TFilter form={filter} refresh={refresh} title="User Filter">
                    <Form.Item label="ID" name={['id', 'eq']} colon>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Nama" name={['name', 'like']} colon>
                        <Input />
                    </Form.Item>
                    <Form.Item label="NIK" name={['nik', 'like']} colon>
                        <Input />
                    </Form.Item>
                    <Form.Item label="No HP" name={['phone', 'eq']} colon>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Email" name={['email', 'like']} colon>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Aktif" name={['active', 'eq']} colon>
                        <Radio.Group buttonStyle="solid">
                            <Radio.Button value={true}>Ya</Radio.Button>
                            <Radio.Button value={false}>Tidak</Radio.Button>
                        </Radio.Group>
                    </Form.Item>
                    <Form.Item label="Tanggal Dibuat" name="createdAt" colon>
                        <DateRangeFilter allowClear withTime />
                    </Form.Item>
                </TFilter>
                <EditUserDrawer
                    user={editor.user}
                    open={editor.open}
                    onClose={(v, afterUpdate) => {
                        setEditor({ open: v, user: null });
                        if (afterUpdate) refresh();
                    }}
                />
                <AddUserDrawer
                    open={openRegister}
                    onClose={() => setOpenRegister(false)}
                />
            </div>
        </MarsTableProvider>
    );
}

export async function getServerSideProps(ctx: NextPageContext) {
    const session = await getSession(ctx);

    const config = api.auhtHeader(session, {
        params: ctx.query,
    });

    const res = await api.manage(api.get<DTO.Users[]>('/user', config));
    if (axios.isAxiosError(res)) return api.serverSideError(res);

    const total = res.headers[HttpHeader.X_TOTAL_COUNT] || res.data.length;
    return {
        props: {
            total,
            users: res.data,
        },
    };
}

interface UsersPageProps extends CoreService.ErrorDTO {
    users: DTO.Users[];
    total: number;
}
