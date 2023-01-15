import { FilterOutlined, ReloadOutlined, UserAddOutlined } from '@ant-design/icons';
import { HttpHeader } from '@mars/common';
import { Drawer, Form, FormInstance, Input, Radio, Table } from 'antd';
import axios from 'axios';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useCallback, useContext, useState } from 'react';
import { TableUserColms } from '_comp/table/table.definitions';
import { DateRangeFilter } from '_comp/table/table-filter.fields';
import { TFilter } from '_comp/table/table.filter';
import { THeader } from '_comp/table/table.header';
import { PageContext } from '_ctx/page.ctx';
import { MarsTableProvider } from '_ctx/table.ctx';
import { usePageable } from '_hook/pageable.hook';
import type { CoreService } from '_service/api';

export default function UsersPage(props: UsersPageProps) {
    const router = useRouter();
    const cols = TableUserColms();

    const pageCtx = useContext(PageContext);
    const { pageable, setPageable } = usePageable();
    const [filter] = Form.useForm();

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
                }),
            })
            .finally(() => pageCtx.setLoading(false));
    }, [pageable.page, pageable.size, pageable.sort]);

    return (
        <MarsTableProvider>
            <div className="workspace table-view">
                <THeader>
                    <THeader.Action
                        type="primary"
                        title="Add User"
                        icon={<UserAddOutlined />}
                    >
                        Add User
                    </THeader.Action>

                    <THeader.Action
                        pos="right"
                        type="primary"
                        title="Refresh"
                        icon={<ReloadOutlined />}
                        onClick={refresh}
                    />
                    <THeader.FilterAction pos="right" type="primary" title="Filter" />
                </THeader>
                <Table
                    size="small"
                    columns={cols}
                    dataSource={props.users ?? []}
                    pagination={{
                        total: props.total,
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
            </div>
        </MarsTableProvider>
    );
}

export async function getServerSideProps(ctx: NextPageContext) {
    const session = await getSession(ctx);

    console.log(ctx.query);
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
