import { FileAddOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { Form, Input, List, Table } from 'antd';
import { useRouter } from 'next/router';
import { useCallback, useContext } from 'react';
import { DateRangeFilter } from '_comp/table/input.fields';
import { TableSolutionColms } from '_comp/table/table.definitions';
import { TFilter } from '_comp/table/table.filter';
import { THeader } from '_comp/table/table.header';
import { usePage } from '_ctx/page.ctx';
import { MarsTablePagination, MarsTableProvider } from '_ctx/table.ctx';
import { usePageable } from '_hook/pageable.hook';
import { CoreService } from '_service/api';

export default function SolutionsPage(props: SolutionsPageProps) {
    const router = useRouter();
    const pageCtx = usePage();
    const { pageable, setPageable } = usePageable();

    const [filter] = Form.useForm<ICriteria<DTO.Solution>>();

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

    return (
        <MarsTableProvider refresh={refresh}>
            <div className="workspace solution">
                <THeader>
                    <THeader.Action icon={<FileAddOutlined />} title="Buat Solusi Baru">
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
                            
                        />
                    </div>
                    <div className="solution-sider"></div>
                </div>
            </div>

            {/* <TFilter form={filter}>
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
            </TFilter> */}
        </MarsTableProvider>
    );
}

interface SolutionsPageProps extends CoreService.ErrorDTO {
    solutions: DTO.Solution[];
    total: number;
}
