import {
    EditOutlined,
    FilterOutlined,
    MinusCircleOutlined,
    PlusCircleOutlined,
    PlusOutlined,
    ReloadOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { HttpHeader, isDefined, upperCase } from '@mars/common';
import {
    Button,
    Card,
    Descriptions,
    Divider,
    Drawer,
    Form,
    Input,
    InputNumber,
    message,
    Pagination,
    Select,
    Space,
    Table,
} from 'antd';
// import { FormInstance } from 'antd/es/form/Form';
import type { Rule, FormInstance } from 'antd/lib/form/index';
import type { NamePath } from 'antd/lib/form/interface';
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
import { BooleanInput, DateRangeFilter, EnumSelect } from '_comp/table/input.fields';
import { DefaultCol } from '_comp/table/table.definitions';
import { TFilter } from '_comp/table/table.filter';
import { THeader } from '_comp/table/table.header';
import { Render } from '_comp/value-renderer';
import { usePage } from '_ctx/page.ctx';
import { MarsTableProvider } from '_ctx/table.ctx';
import { usePageable } from '_hook/pageable.hook';
import { useBool } from '_hook/util.hook';
import { CoreService } from '_service/api';
import notif from '_service/notif';
import { PageTitle } from '_utils/conversion';

enum ParamType {
    NOTE = 'NOTE',
    CAPTURE = 'CAPTURE',
}

function IssuePage(props: IssuePageProps) {
    const router = useRouter();
    const page = usePage();
    const { pageable } = usePageable();

    const [filter] = Form.useForm<ICriteria<DTO.Issue>>();
    const [editForm] = Form.useForm<DTO.Issue>();
    const [selected, setSelected] = useState<{ data: DTO.Issue; edit: boolean }>({
        data: null,
        edit: false,
    });
    const addDrawer = useBool();

    const hasSelected = useMemo(() => isDefined(selected.data), [selected.data]);
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
                setSelected({ data: null, edit: false });
            });
    }, []);

    const onRowClick = useCallback(
        (record: DTO.Issue) => {
            if (selected.data) {
                if (selected.data.id === record.id)
                    setSelected({ data: null, edit: false });
                else {
                    setSelected({ data: record, edit: false });
                }
            } else {
                setSelected({ data: record, edit: false });
            }
        },
        [selected.data]
    );

    const onEditSubmit = useCallback(async () => {
        page.setLoading(true);
        await editForm.validateFields().catch(() => page.setLoading(false));
        const value = editForm.getFieldsValue();

        const deletedParams: number[] = [];
        const oldParams = value.params.filter((e) => isDefined(e.id));

        for (const param of selected.data.params) {
            const index = oldParams.findIndex((e) => e.id === param.id);
            if (index === -1) deletedParams.push(param.id);
        }

        api.put('/issue/' + selected.data.id, { ...value, deletedParams })
            .then((res) => message.success('Issue updated'))
            .then(() => refresh())
            .catch(notif.error.bind(notif))
            .finally(() => {
                page.setLoading(false);
                setSelected({ data: null, edit: false });
            });
    }, [editForm, selected]);

    if (props.error) return <>{props.error.message}</>;
    return (
        <MarsTableProvider refresh={refresh}>
            <div className="workspace solution">
                <div className="solution-wrap">
                    <div className="solution-content">
                        <THeader>
                            <THeader.Action
                                title="Buat"
                                icon={<PlusOutlined />}
                                onClick={addDrawer.toggle}
                            >
                                Buat Kendala
                            </THeader.Action>
                            <THeader.FilterAction
                                title="Filter Issue"
                                pos="right"
                                icon={<FilterOutlined />}
                            />
                            <THeader.Action
                                title="Reload Data"
                                pos="right"
                                icon={<ReloadOutlined />}
                                onClick={() => refresh()}
                            />
                        </THeader>
                        <Table<DTO.Issue>
                            size="small"
                            dataSource={props.data}
                            onRow={(data, index) => {
                                return {
                                    onClick: () => onRowClick(data),
                                };
                            }}
                            columns={[
                                DefaultCol.INCREMENTAL_NO_COL(pageable),
                                {
                                    title: 'Kode',
                                    align: 'center',
                                    width: 150,
                                    dataIndex: 'name',
                                },
                                {
                                    title: 'Product',
                                    align: 'center',
                                    dataIndex: 'product',
                                    width: 150,
                                    render: Render.product,
                                },
                                {
                                    title: 'Alias',
                                    align: 'center',
                                    dataIndex: 'alias',
                                },
                                {
                                    title: 'Parameter',
                                    align: 'center',
                                    width: 100,
                                    render(value, record, index) {
                                        return (
                                            <>
                                                {record.params.map((e) => {
                                                    const color = e.required
                                                        ? 'red'
                                                        : undefined;
                                                    return Render.tags({
                                                        bold: true,
                                                        color,
                                                    })(e.type);
                                                })}
                                            </>
                                        );
                                    },
                                },
                                DefaultCol.CREATION_DATE_COL,
                            ]}
                        />
                    </div>
                    <div className="solution-sider">
                        <InfoIssueContext.Provider
                            value={{
                                selected: selected.data,
                                edit: selected.edit,
                                form: editForm,
                            }}
                        >
                            <Card
                                size="small"
                                className='card-editable'
                                title={
                                    'Detail ' +
                                    (selected.data?.name ? selected.data.name : 'Kendala')
                                }
                                hoverable
                                extra={
                                    <Space>
                                        {selected.edit && (
                                            <MarsButton
                                                children="Save"
                                                size="small"
                                                icon={<SaveOutlined />}
                                                onClick={onEditSubmit}
                                            />
                                        )}
                                        <MarsButton
                                            children="Edit"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() =>
                                                setSelected({
                                                    ...selected,
                                                    edit: !selected.edit,
                                                })
                                            }
                                            disabled={!isDefined(selected.data)}
                                        />
                                    </Space>
                                }
                            >
                                {!hasSelected && <i>* No Data Selected</i>}
                                {hasSelected && <InfoIssueView />}
                            </Card>
                        </InfoIssueContext.Provider>
                    </div>
                </div>
            </div>
            <TFilter form={filter} title="Filter Kendala">
                <Form.Item label="Nama" name={['name', 'like']}>
                    <Input />
                </Form.Item>
                <Form.Item label="Product" name={['product', 'in']}>
                    <EnumSelect enums={Mars.Product} />
                </Form.Item>

                <Form.Item label="Dibuat Oleh" name={['createdBy', 'like']}>
                    <Input />
                </Form.Item>
                <Form.Item label="Dibuat Tanggal" name="createdAt">
                    <DateRangeFilter withTime />
                </Form.Item>
            </TFilter>
            <AddIssueDrawer
                open={addDrawer.value}
                onClose={() => addDrawer.setValue(false)}
            />
        </MarsTableProvider>
    );
}

export async function getServerSideProps(ctx: NextPageContext) {
    const session = await getSession(ctx);
    const config = api.auhtHeader(session, {
        params: ctx.query,
    });

    const res = await api.manage(api.get<DTO.Issue[]>('/issue', config));
    if (axios.isAxiosError(res)) return api.serverSideError(res);

    const total = res.headers[HttpHeader.X_TOTAL_COUNT] || res.data.length;
    return {
        props: {
            total,
            data: res.data,
        },
    };
}

export interface IssuePageProps extends CoreService.ErrorDTO {
    data: DTO.Issue[];
    total: number;
}

export default PageTitle("Kendala", IssuePage);

// Drawer ---------------------------------------------------------------------
function AddIssueDrawer(props: AddIssueDrawerProps) {
    const [form] = Form.useForm();
    const loading = useBool();
    const [param, setParam] = useState<ParamType>(ParamType.NOTE);

    const onSubmit = useCallback(async () => {
        await form.validateFields().then(() => loading.setValue(true));
        const values = form.getFieldsValue();

        console.log(values);
        api.post('/issue', values)
            .then(() =>
                message.success(`Berhasil menambah Kendala/Issue "${values.name}"`)
            )
            .catch(notif.error)
            .finally(() => loading.setValue(false));
    }, [form]);

    const onClose = useCallback(() => {
        form.resetFields();
        props.onClose?.();
    }, [props.onClose]);

    const allParams = Form.useWatch<any[]>('params', form) || [];
    const hasNoteParam = allParams.findIndex((e) => e.type === ParamType.NOTE) !== -1;
    const hasCaptureParam =
        allParams.findIndex((e) => (e.type?.value || e.type) === ParamType.CAPTURE) !==
        -1;

    return (
        <Drawer
            title="Tambah Kendala"
            className="solution"
            open={props.open}
            onClose={onClose}
            extra={[
                <Space key="edit-submit-btn">
                    <Button type="primary" loading={loading.value} onClick={onSubmit}>
                        Tambah
                    </Button>
                </Space>,
            ]}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Produk"
                    name="product"
                    rules={[{ required: true, message: 'Produk tidak boleh kosong' }]}
                >
                    <EnumSelect enums={Mars.Product} mode={null} />
                </Form.Item>
                <Form.Item
                    label="Nama"
                    name="name"
                    tooltip="Kode nama kendala"
                    rules={[{ required: true, message: 'Kode Nama tidak boleh kosong' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Cek List"
                    name="description"
                    rules={[{ required: true, message: 'Deskripsi tidak boleh kosong' }]}
                    tooltip="Cek List parameter yang nantinya digunakan sebagai cek list sebelum melakukan pembuatan order"
                >
                    <Input.TextArea />
                </Form.Item>
                <Form.Item
                    label="Alias"
                    name="alias"
                    tooltip="Nama yang nantinya akan ditampilkan dimenu telegram, jika kosong default menggunakan kode nama"
                >
                    <Input />
                </Form.Item>
                <Divider />
                <InfoIssueContext.Provider value={{ form, edit: true }}>
                    <Form.List name="params">
                        {(fields, { add, remove }, meta) => {
                            return (
                                <>
                                    <Space>
                                        <MarsButton
                                            icon={<PlusCircleOutlined />}
                                            onClick={() =>
                                                add({
                                                    type: ParamType.NOTE,
                                                    display: null,
                                                    required: false,
                                                })
                                            }
                                            disabled={hasNoteParam}
                                            title="Hapus Note Param"
                                        >
                                            Note Param
                                        </MarsButton>
                                        <MarsButton
                                            icon={<PlusCircleOutlined />}
                                            onClick={() =>
                                                add({
                                                    type: ParamType.CAPTURE,
                                                    display: null,
                                                    required: false,
                                                })
                                            }
                                            disabled={hasCaptureParam}
                                            title="Hapus Capture Param"
                                        >
                                            Capture Param
                                        </MarsButton>
                                    </Space>
                                    <Divider />
                                    {fields.map((field, index) => {
                                        const { key, name, ...others } = field;
                                        return (
                                            <ParameterDescriptorItem
                                                key={field.key}
                                                name={field.name}
                                                remove={remove}
                                            />
                                        );
                                    })}
                                </>
                            );
                        }}
                    </Form.List>
                </InfoIssueContext.Provider>
            </Form>
        </Drawer>
    );
}
interface AddIssueDrawerProps {
    open?: boolean;
    onClose?(): void;
}

Pagination

// Context --------------------------------------------------------------------
const InfoIssueContext = createContext<InfoIssueContext>(null);
interface InfoIssueContext {
    edit: boolean;
    form: FormInstance<DTO.Issue>;
    selected?: DTO.Issue;
}

// Value Editable -------------------------------------------------------------
function EditableValue(props: EditableValueProps) {
    const { edit } = useContext(InfoIssueContext);

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
function InfoIssueView() {
    const { selected, edit, form } = useContext(InfoIssueContext);

    useEffect(() => {
        if (!edit) form.resetFields();
        else form.setFieldsValue(selected ?? {});
    }, [edit, selected]);

    const params: DTO.IssueParam[] = Form.useWatch(['params'], form) || [];
    const hasCaptureParam = params.findIndex((e) => e.type === ParamType.CAPTURE) !== -1;
    const hasNoteParam = params.findIndex((e) => e.type === ParamType.NOTE) !== -1;

    console.log(selected);
    return (
        <Form form={form} layout="vertical" initialValues={selected}>
            <Descriptions bordered size="small" column={2} labelStyle={{ width: 90 }}>
                <Descriptions.Item span={5} label="Kode">
                    <EditableValue name="name" input={<Input />}>
                        {selected.name}
                    </EditableValue>
                </Descriptions.Item>
                <Descriptions.Item span={5} label="Alias">
                    <EditableValue name="alias" input={<Input />}>
                        {selected.alias || '-'}
                    </EditableValue>
                </Descriptions.Item>
                <Descriptions.Item span={5} label="Produk">
                    <EditableValue
                        name="product"
                        input={<EnumSelect mode="single" enums={Mars.Product} />}
                    >
                        {Render.product(selected.product)}
                    </EditableValue>
                </Descriptions.Item>
                <Descriptions.Item span={5} label="Cek List">
                    <EditableValue name="description" input={<Input.TextArea />}>
                        {selected.description}
                    </EditableValue>
                </Descriptions.Item>
            </Descriptions>
            {(params.length > 0 || edit) && <Divider />}

            <Form.List name="params">
                {(fields, { add, remove }) => {
                    return (
                        <>
                            {fields.map((field, i) => (
                                <ParameterDescriptorItem
                                    key={field.key}
                                    name={field.name}
                                    remove={remove}
                                />
                            ))}
                            {edit && (
                                <Space>
                                    <MarsButton
                                        icon={<PlusCircleOutlined />}
                                        onClick={() =>
                                            add({
                                                type: ParamType.NOTE,
                                                display: null,
                                                required: false,
                                            })
                                        }
                                        disabled={hasNoteParam}
                                    >
                                        Note Param
                                    </MarsButton>
                                    <MarsButton
                                        icon={<PlusCircleOutlined />}
                                        onClick={() =>
                                            add({
                                                type: ParamType.CAPTURE,
                                                display: null,
                                                required: false,
                                            })
                                        }
                                        disabled={hasCaptureParam}
                                    >
                                        Capture Param
                                    </MarsButton>
                                </Space>
                            )}
                        </>
                    );
                }}
            </Form.List>
        </Form>
    );
}
function ParameterDescriptorItem(props: ParameterDescriptorItemProps) {
    const { form, edit } = useContext(InfoIssueContext);
    const param: Partial<DTO.IssueParam> =
        Form.useWatch(['params', props.name], form) || {};

    const extra = !edit ? null : (
        <Space>
            <MinusCircleOutlined
                onClick={() => props.remove(props.name)}
                title="Hapus Parameter"
            />
        </Space>
    );
    return (
        <>
            <Form.Item hidden name={[props.name, 'id']}>
                <InputNumber />
            </Form.Item>
            <Form.Item hidden name={[props.name, 'type']}>
                <Input />
            </Form.Item>
            <Descriptions
                bordered
                key={'issue-param:' + props.name + '_' + param.type}
                title={param.type && upperCase(param.type, true) + ' Parameter'}
                size="small"
                column={2}
                labelStyle={{ width: 90 }}
                extra={extra}
                style={{ marginBottom: '1rem' }}
                // className="issue-param"
            >
                <Descriptions.Item label="Nama Display" span={5}>
                    <EditableValue
                        name={[props.name, 'display']}
                        input={<Input />}
                        rules={[
                            {
                                required: true,
                                message: `Display Name ${
                                    param.type && upperCase(param.type, true)
                                } Parameter, tidak boleh kosong`,
                            },
                        ]}
                    >
                        {param.display}
                    </EditableValue>
                </Descriptions.Item>

                <Descriptions.Item label="Required" span={5}>
                    <EditableValue
                        name={[props.name, 'required']}
                        input={<BooleanInput />}
                    >
                        {Render.bool(param.required)}
                    </EditableValue>
                </Descriptions.Item>
            </Descriptions>
        </>
    );
}

interface ParameterDescriptorItemProps {
    name: number;
    remove(index: number): void;
}
