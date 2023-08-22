import { CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import { HttpHeader, isDefined } from '@mars/common';
import { Form, Input, Radio, Table } from 'antd';
import axios from 'axios';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DateRangeFilter } from '_comp/table/input.fields';
import { TableApprovalColms } from '_comp/table/table.definitions';
import { TFilter } from '_comp/table/table.filter';
import { THeader } from '_comp/table/table.header';
import { PageContext } from '_ctx/page.ctx';
import { MarsTablePagination, MarsTableProvider, MarsTableSorter } from '_ctx/table.ctx';
import { usePageable } from '_hook/pageable.hook';
import { CoreService } from '_service/api';
import { useBool } from '_hook/util.hook';

export default function UserApprovalPage(props: UserApprovalPageProps) {
    const router = useRouter();
    const page = useContext(PageContext);
    const { pageable, setPageable, updateSort } = usePageable();

    const [filter] = Form.useForm<ICriteria<DTO.UserApproval>>();
    const [selected, setSelected] = useState<string[]>([]);
    const hasSelected = useMemo(() => selected.length > 0, [selected]);

    const refresh = useCallback(() => {
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
                    roles: {},
                }),
            })
            .finally(() => page.setLoading(false));
    }, [pageable.page, pageable.size, pageable.sort]);

    const onSelectedChanged = (
        selectedRowKeys: React.Key[],
        selectedRows: DTO.UserApproval[]
    ) => {
        // const bools = [...selected];
        // for (let index = 0; index < props.data.length; index++) {
        //     const dto = props.data[index];

        //     const isSelected = selectedRows.findIndex((e) => e.id === dto.id) !== -1;
        //     bools[index] = isSelected;
        // }

        const s = selectedRows.map((e) => e.id);
        setSelected(s);
    };

    const onAcceptClick = useCallback((r: DTO.UserApproval, approved: boolean) => {
        approvalBulkAccept(approved, [r.id]);
    }, []);

    const approvalBulkAccept = useCallback((approved: boolean, ids?: string[]) => {
        ids ||= selected;

        page.setLoading(true);
        api.post('/user/approvals', ids, { params: { approved } })
            .then(() => refresh())
            .catch((err) => {})
            .finally(() => page.setLoading(false));
    }, []);

    if (props.error) return <>{props.error.message}</>;

    const init = useBool();
    useEffect(() => {
        if (init.value) refresh();
        else init.setValue(true);
    }, [pageable.page, pageable.size, pageable.sort]);

    return (
        <MarsTableProvider refresh={refresh}>
            <Head>
                <title>Mars - User Approval</title>
            </Head>
            <div className="workspace table-view">
                <THeader>
                    <THeader.Action
                        icon={<CheckOutlined />}
                        disabled={!hasSelected}
                        title={
                            hasSelected
                                ? 'Terima Permintaan'
                                : 'Check salah 1 data terlebih dahulu'
                        }
                    >
                        Terima
                    </THeader.Action>
                    <THeader.Action
                        icon={<CloseOutlined />}
                        disabled={!hasSelected}
                        title={
                            hasSelected
                                ? 'Tolak Permintaan'
                                : 'Check salah 1 data terlebih dahulu'
                        }
                    >
                        Tolak
                    </THeader.Action>
                    <THeader.Action
                        pos="right"
                        type="primary"
                        title="Refresh"
                        icon={<ReloadOutlined />}
                        onClick={refresh}
                    />
                </THeader>
                <Table
                    size="small"
                    columns={TableApprovalColms({
                        pageable,
                        onAcceptClick,
                    })}
                    dataSource={props.data}
                    rowSelection={{
                        type: 'checkbox',
                        selectedRowKeys: selected,
                        onChange: onSelectedChanged,
                    }}
                    pagination={MarsTablePagination({
                        pageable: pageable,
                        setPageable,
                        total: props.total,
                    })}
                    onChange={MarsTableSorter({ updateSort })}
                />
                <TFilter form={filter} title="Approval Filter">
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
            </div>
        </MarsTableProvider>
    );
}

export async function getServerSideProps(ctx: NextPageContext) {
    const session = await getSession(ctx);
    const config = api.auhtHeader(session);

    const res = await api.manage<DTO.UserApproval[]>(api.get('/user/approvals', config));
    if (axios.isAxiosError(res)) return api.serverSideError(res);

    const total = res.headers[HttpHeader.X_TOTAL_COUNT] || res.data.length;
    return {
        props: {
            total,
            data: res.data.map((e) => {
                e['key'] = e.id;
                return e;
            }),
            // data: res.data,
        },
    };
}

interface UserApprovalPageProps extends CoreService.ErrorDTO {
    total: number;
    data: DTO.UserApproval[];
}
