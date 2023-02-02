import {
    EditOutlined,
    MinusCircleOutlined,
    PlusOutlined,
    QuestionCircleOutlined,
    ReloadOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { isTruthy } from '@mars/common';
import {
    Input,
    InputNumber,
    Switch,
    Card,
    Typography,
    Divider,
    List,
    Tooltip,
    message,
    Form,
    Space,
    Button,
} from 'antd';
import { Rule } from 'antd/lib/form/index';
import axios from 'axios';
import deepEqual from 'deep-equal';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { createContext, useContext, useMemo, useState } from 'react';
import { THeader } from '_comp/table/table.header';
import { usePage } from '_ctx/page.ctx';
import { CoreService } from '_service/api';
import notif from '_service/notif';

const SettingItemCtx = createContext<SettingItemCtx>(null);
interface SettingItemCtx {
    readonly hover: boolean;
}

export default function SettingPage(props: SettingPageProps) {
    if (props.error) {
        return <>{props.error.message}</>;
    }

    const router = useRouter();
    const page = usePage();
    const [configs] = Form.useForm<map<Setting.Value>>();

    const origin = useMemo<Setting.MapValue>(
        () => Object.fromEntries(props.data.map(Setting.convert)),
        [props.data]
    );

    const [hasValueChanged, setHasValueChanged] = useState(false);

    const onResetClick = () => {
        configs.resetFields();
        setHasValueChanged(false);
    };

    const onSaveClick = async () => {
        if (!hasValueChanged) return message.warn('No content changed');

        await configs.validateFields();

        const values = configs.getFieldsValue();
        const newSets: SettingDTO[] = [];

        for (const sett of props.data) {
            let { title, value } = values[sett.name];
            switch (sett.type) {
                case Setting.Type.ARRAY:
                    value = (value as string[]).join('|');
                    break;
                case Setting.Type.JSON:
                    value = JSON.stringify(value);
                    break;
                default:
                    value = String(value);
                    break;
            }
            newSets.push({ ...sett, title: title, value });
        }

        console.log(values);

        page.setLoading(true);
        api.put('/app/config', newSets)
            .then((res) => message.success('Updated'))
            .catch((err) => notif.axiosError(err))
            .finally(() => router.reload());
    };

    return (
        <div className="workspace settings">
            <Head>
                <title>Mars - Application Setting</title>
            </Head>
            <THeader
                title={
                    <>
                        <Typography.Title level={3}>Setting Aplikasi</Typography.Title>
                        <Divider />
                    </>
                }
            />

            <Form
                form={configs}
                size="small"
                initialValues={origin}
                className="workspace-setting-content"
                onReset={() => {
                    console.log('reset');
                    const values = configs.getFieldsValue();
                    const result = deepEqual(origin, values);
                    setHasValueChanged(!result);
                }}
                onValuesChange={(changed, values) => {
                    const result = deepEqual(origin, values);
                    setHasValueChanged(!result);
                }}
            >
                <List
                    grid={{ gutter: 16, column: 3 }}
                    dataSource={props.data}
                    renderItem={(item) => <RenderConfig {...item} />}
                />
            </Form>

            <THeader className="footer bg-primary">
                <THeader.Action
                    pos="right"
                    type="default"
                    icon={<ReloadOutlined />}
                    onClick={onResetClick}
                    disabled={!hasValueChanged}
                >
                    Reset
                </THeader.Action>
                <THeader.Action
                    pos="right"
                    type="default"
                    icon={<SaveOutlined />}
                    onClick={onSaveClick}
                    disabled={!hasValueChanged}
                >
                    Save
                </THeader.Action>
            </THeader>
        </div>
    );
}
export function RenderConfig(config: SettingDTO & { title?: string }) {
    const [hover, setHover] = useState(false);
    const tooltip = (
        <Tooltip title={config.description}>
            <QuestionCircleOutlined />
        </Tooltip>
    );

    const isObjType = [Setting.Type.ARRAY, Setting.Type.JSON].includes(config.type);
    const path = isObjType ? config.name : [config.name, 'value'];
    return (
        <List.Item>
            <SettingItemCtx.Provider value={{ hover }}>
                <Card
                    hoverable
                    size="small"
                    extra={tooltip}
                    title={
                        <Form.Item name={[config.name, 'title']} noStyle>
                            <Setting.EditableTitle config={config} />
                        </Form.Item>
                    }
                    onMouseOver={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                >
                    {!isObjType && (
                        <Form.Item name={[config.name, 'value']}>
                            <Setting.ConfigInput config={config} />
                        </Form.Item>
                    )}

                    {isObjType && <Setting.ConfigInput config={config} />}
                </Card>
            </SettingItemCtx.Provider>
        </List.Item>
    );
}

namespace Setting {
    export type Value<T = any> = { title: string; value: T };
    export type TuppleValue = [string, Value];
    export type MapValue = map<Value>;

    export const EXCLUDED_IDS = [2, 4];

    export enum Type {
        STRING = 'STRING',
        NUMBER = 'NUMBER',
        BOOLEAN = 'BOOLEAN',
        JSON = 'JSON',
        ARRAY = 'ARRAY',
    }

    export function convert(item: SettingDTO): TuppleValue {
        const get = (value: any) =>
            [item.name, { title: item.title, value }] satisfies TuppleValue;

        switch (item.type) {
            case Type.BOOLEAN:
                return get('true' === item.value);
            case Type.NUMBER:
                return get(Number(item.value));
            case Type.ARRAY:
                const items = item.value.split('|').filter(isTruthy);
                return get(items);
            case Type.JSON:
                return get(JSON.parse(item.value));
        }
        return get(item.value);
    }

    export function EditableTitle(props: {
        config: SettingDTO;
        value?: string;
        onChange?(t: string): void;
    }) {
        const itemCtx = useContext(SettingItemCtx);
        const [edit, setEdit] = useState(false);

        return (
            <Space>
                {!edit && props.value}
                {edit && (
                    <Input
                        size="small"
                        value={props.value}
                        onChange={(v) => props.onChange(v.currentTarget.value)}
                    />
                )}
                <EditOutlined
                    title="Edit Nama"
                    style={{ opacity: edit ? 1 : !itemCtx.hover ? 0 : 1 }}
                    onClick={() => setEdit(!edit)}
                />
            </Space>
        );
    }
    export function ConfigInput(props: {
        config: SettingDTO;
        value?: any;
        onChange?(v: any): void;
    }) {
        const { config } = props;
        let comp: React.ReactElement;

        switch (config.type) {
            case Type.STRING:
                comp = (
                    <Input
                        value={props.value}
                        onChange={(e) => props.onChange(e.currentTarget.value)}
                    />
                );
                break;
            case Type.NUMBER:
                comp = <InputNumber value={props.value} onChange={props.onChange} />;
                break;
            case Type.BOOLEAN:
                comp = (
                    <Switch
                        size="default"
                        checked={props.value}
                        checkedChildren="Ya"
                        unCheckedChildren="Tidak"
                        onChange={(c) => props.onChange(c)}
                    />
                );
                break;
            case Type.ARRAY:
                comp = <InputArray config={config} />;
        }

        return (
            <Space align="baseline">
                {comp}
                {_suffix(config)}
            </Space>
        );
    }

    export function _suffix(config: SettingDTO): string | undefined {
        switch (config.id) {
            case 1:
                return 'Menit';
            case 5:
                return 'Menit';
            case 6:
                return 'Jam';
        }
    }

    function _rules_arr(config: SettingDTO): Rule[] {
        switch (config.id) {
            case 7:
                return [
                    {
                        type: 'email',
                        required: true,
                        message: 'Email tidak boleh kosong',
                    },
                ];
        }
        return null;
    }

    interface ObjectInput {
        config: SettingDTO;
    }

    function InputJson() {}

    function InputArray(props: ObjectInput) {
        return (
            <Form.List name={[props.config.name, 'value']}>
                {(fields, { add, remove }, meta) => (
                    <>
                        {fields.map((field) => {
                            const { key, name, ...others } = field;
                            return (
                                <Space key={key} align="baseline">
                                    <Form.Item
                                        {...others}
                                        name={name}
                                        rules={_rules_arr(props.config)}
                                    >
                                        <Input allowClear />
                                    </Form.Item>
                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                </Space>
                            );
                        })}
                        <Form.Item>
                            <Button onClick={() => add()} icon={<PlusOutlined />}>
                                Tambah
                            </Button>
                        </Form.Item>
                    </>
                )}
            </Form.List>
        );
    }
}

export async function getServerSideProps(ctx: NextPageContext) {
    const session = await getSession(ctx);
    const config = api.auhtHeader(session);

    const res = await api.manage<SettingDTO[]>(api.get('/app/config', config));
    if (axios.isAxiosError(res)) return api.serverSideError(res);

    return {
        props: {
            data: res.data
                .sort((a, b) => a.id - b.id)
                .filter((s) => !Setting.EXCLUDED_IDS.includes(s.id)),
        },
    };
}

interface SettingPageProps extends CoreService.ErrorDTO {
    data: SettingDTO[];
}

interface SettingDTO {
    id: number;
    name: string;
    title: string;
    type: Setting.Type;
    value: string;
    description: string;
}
