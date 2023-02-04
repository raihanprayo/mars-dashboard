import {
    DeleteOutlined,
    EditOutlined,
    FilterOutlined,
    PlusOutlined,
    ReloadOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { HttpHeader, isDefined } from '@mars/common';
import {
    Card,
    Descriptions,
    Drawer,
    Form,
    FormInstance,
    Input,
    message,
    Space,
    Table,
} from 'antd';
import { Rule } from 'antd/lib/form/index';
import { NamePath } from 'antd/lib/form/interface';
import axios from 'axios';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    createContext,
    ReactElement,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { MarsButton } from '_comp/base/Button';
import { DateRangeFilter, EnumSelect } from '_comp/table/input.fields';
import { DefaultCol } from '_comp/table/table.definitions';
import { TFilter } from '_comp/table/table.filter';
import { THeader } from '_comp/table/table.header';
import { Render } from '_comp/value-renderer';
import { usePage } from '_ctx/page.ctx';
import { MarsTablePagination, MarsTableProvider } from '_ctx/table.ctx';
import { usePageable } from '_hook/pageable.hook';
import { useBool } from '_hook/util.hook';
import { CoreService } from '_service/api';
import notif from '_service/notif';

export default function SolutionsPage(props: SolutionsPageProps) {
    const router = useRouter();
    const page = usePage();
    const { pageable, setPageable } = usePageable();

    const [filter] = Form.useForm<ICriteria<DTO.Solution>>();
    const [selected, setSelected] = useState<boolean[]>(
        Array(props.data?.length).fill(false)
    );

    const addDrawer = useBool();
    const [editForm] = Form.useForm<DTO.Solution>();
    const [detail, setDetail] = useState<{ data: DTO.Solution; edit: boolean }>({
        data: null,
        edit: false,
    });

    const countSelected = useMemo(() => selected.filter((e) => e).length, [selected]);
    const hasSelected = useMemo(() => countSelected !== 0, [countSelected]);
    const hasFocusDetail = useMemo(() => isDefined(detail.data), [detail.data]);

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
            .finally(() => {
                page.setLoading(false);
                setDetail({ data: null, edit: false });
            });
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
        if (ids.length === 0) return;

        page.setLoading(true);
        api.delete('/solution', { data: ids })
            .then((res) => message.success(`Berhasil menghapus ${ids.length} Solusi`))
            .then(refresh)
            .catch(notif.error.bind(notif))
            .finally(() => page.setLoading(false));
    };

    useEffect(() => {
        if (props.data?.length > 0) setSelected(Array(props.data?.length).fill(false));
    }, [props.data]);

    if (props.error) return <>{props.error.message}</>;
    return (
        <MarsTableProvider refresh={refresh}>
            <Head>
                <title>Mars - Actual Solution</title>
            </Head>
            <div className="workspace solution">
                <div className="solution-wrap">
                    <div className="solution-content">
                        <THeader>
                            <THeader.Action
                                icon={<PlusOutlined />}
                                title="Buat Solusi Baru"
                                onClick={() => addDrawer.setValue(true)}
                            >
                                Buat
                            </THeader.Action>
                            <THeader.Action
                                pos="right"
                                icon={<DeleteOutlined />}
                                title={`Hapus Solusi Terpilih ${countSelected}`}
                                disabled={!hasSelected}
                                onClick={() => actionDelete()}
                            />
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
                                {
                                    title: 'Produk',
                                    align: 'center',
                                    dataIndex: 'product',
                                    width: 130,
                                    render: Render.product,
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
                                                    title={`Hapus ${record.name} `}
                                                    icon={<DeleteOutlined />}
                                                    onClick={() =>
                                                        actionDelete([record.id])
                                                    }
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
                            onRow={(data, index) => {
                                return {
                                    onClick: () => setDetail({ data, edit: false }),
                                };
                            }}
                        />
                    </div>
                    <div className="solution-sider">
                        <InfoSolutionContext.Provider
                            value={{
                                edit: detail.edit,
                                selected: detail.data,
                                form: editForm,
                            }}
                        >
                            <Card
                                size="small"
                                className='card-editable'
                                title={
                                    'Detail ' +
                                    (detail.data?.name ? detail.data.name : 'Kendala')
                                }
                                hoverable
                                extra={
                                    <Space>
                                        {detail.edit && (
                                            <MarsButton
                                                children="Save"
                                                size="small"
                                                icon={<SaveOutlined />}
                                                // onClick={onEditSubmit}
                                            />
                                        )}
                                        <MarsButton
                                            children="Edit"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() =>
                                                setDetail({
                                                    ...detail,
                                                    edit: !detail.edit,
                                                })
                                            }
                                            disabled={!isDefined(detail.data)}
                                        />
                                    </Space>
                                }
                            >
                                {!hasFocusDetail && <i>* No Data Selected</i>}
                                {hasFocusDetail && <InfoSolutionView />}
                            </Card>
                        </InfoSolutionContext.Provider>
                    </div>
                </div>
            </div>

            <TFilter form={filter}>
                <Form.Item label="ID" name={['id', 'eq']}>
                    <Input />
                </Form.Item>
                <Form.Item label="Nama" name={['name', 'like']}>
                    <Input />
                </Form.Item>
                <Form.Item label="Produk" name={['product', 'in']}>
                    <EnumSelect enums={Mars.Product} />
                </Form.Item>
                <Form.Item label="Tanggal Dibuat" name="createdAt">
                    <DateRangeFilter />
                </Form.Item>
                <Form.Item label="Tanggal Diubah" name="updatedAt">
                    <DateRangeFilter />
                </Form.Item>
            </TFilter>
            <AddSolutionDrawer
                open={addDrawer.value}
                onClose={() => addDrawer.setValue(false)}
            />
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
    const router = useRouter();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onSubmit = async () => {
        await form.validateFields();

        const value = form.getFieldsValue();
        setLoading(true);
        api.post('/solution', value)
            .then((res) =>
                message.success(`Berhasil membuat actual solution "${value.name}"`)
            )
            .catch(notif.axiosError)
            .finally(() => router.reload());
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
                <Form.Item
                    label="Nama"
                    name="name"
                    rules={[{ required: true, message: 'Nama tidak boleh kosong' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item label="Produk" name="product">
                    <EnumSelect enums={Mars.Product} mode="single" />
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

// Context --------------------------------------------------------------------
const InfoSolutionContext = createContext<InfoSolutionContext>(null);
interface InfoSolutionContext {
    edit: boolean;
    form: FormInstance<DTO.Solution>;
    selected?: DTO.Solution;
}

// Value Editable -------------------------------------------------------------
function EditableValue(props: EditableValueProps) {
    const { edit } = useContext(InfoSolutionContext);

    const InputElm = props.input.type;
    const InputProps = { ...props.input.props, size: 'small' };
    return (
        <>
            {!edit && props.children}
            {edit && (
                <Form.Item name={props.name} rules={props.rules}>
                    {<InputElm {...InputProps} />}
                </Form.Item>
            )}
        </>
    );
}
interface EditableValueProps extends HasChild {
    name: NamePath;
    input: ReactElement;
    rules?: Rule[];
}

// Details --------------------------------------------------------------------
function InfoSolutionView() {
    const { selected, edit, form } = useContext(InfoSolutionContext);

    useEffect(() => {
        if (!edit) form.resetFields();
        else form.setFieldsValue(selected ?? {});
    }, [edit, selected]);

    console.log(selected);
    return (
        <Form form={form} layout="vertical" initialValues={selected}>
            <Descriptions bordered size="small" column={2} labelStyle={{ width: 90 }}>
                <Descriptions.Item span={5} label="Nama">
                    <EditableValue name="name" input={<Input />}>
                        {selected.name}
                    </EditableValue>
                </Descriptions.Item>
                <Descriptions.Item span={5} label="Product">
                    <EditableValue
                        name="product"
                        input={<EnumSelect mode="single" enums={Mars.Product} />}
                    >
                        {selected.product}
                    </EditableValue>
                </Descriptions.Item>
                <Descriptions.Item span={5} label="Deskripsi">
                    <EditableValue name="description" input={<Input.TextArea />}>
                        {selected.description}
                    </EditableValue>
                </Descriptions.Item>
            </Descriptions>
        </Form>
    );
}
