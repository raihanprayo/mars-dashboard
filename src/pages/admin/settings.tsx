import {
    EditOutlined,
    MinusCircleOutlined,
    PlusOutlined,
    QuestionCircleOutlined,
    ReloadOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import { isBool, isTruthy } from '@mars/common';
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
import { useApp } from '_ctx/app.ctx';
import { usePage } from '_ctx/page.ctx';
import { CoreService } from '_service/api';
import notif from '_service/notif';
import { RefreshSettingEvent } from '_utils/events';

const SettingItemCtx = createContext<SettingItemCtx>(null);
interface SettingItemCtx {
    readonly hover: boolean;
}

export default function SettingPage() {
    const router = useRouter();
    const app = useApp();
    const page = usePage();
    const [configs] = Form.useForm<map<Setting.Value>>();

    const origin = useMemo<Setting.MapValue>(
        () => Object.fromEntries(app.settings.map(Setting.convert)),
        [app.settings]
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
        const newSets: DTO.Setting[] = [];

        for (const sett of app.settings) {
            let { title, value } = values[sett.name];
            switch (sett.type) {
                case DTO.SettingType.ARRAY:
                    value = (value as string[]).join('|');
                    break;
                case DTO.SettingType.JSON:
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
            .finally(() => {
                RefreshSettingEvent.emit();
                router.reload();
            });
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

            {app.settings.length > 0 && <Form
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
                    dataSource={app.settings}
                    renderItem={(item) => <RenderConfig {...item} />}
                />
            </Form>}

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
export function RenderConfig(config: DTO.Setting & { title?: string }) {
    const [hover, setHover] = useState(false);
    const tooltip = (
        <Tooltip title={config.description}>
            <QuestionCircleOutlined />
        </Tooltip>
    );

    const isObjType = [DTO.SettingType.ARRAY, DTO.SettingType.JSON].includes(config.type);
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


    export function convert(item: DTO.Setting): TuppleValue {
        const get = (value: any) =>
            [item.name, { title: item.title, value }] satisfies TuppleValue;

        switch (item.type) {
            case DTO.SettingType.BOOLEAN:
                return get(['true', 't'].includes(item.value.toLowerCase()));
            case DTO.SettingType.NUMBER:
                return get(Number(item.value));
            case DTO.SettingType.ARRAY:
                const items = item.value.split('|').filter(isTruthy);
                return get(items);
            case DTO.SettingType.JSON:
                return get(JSON.parse(item.value));
        }
        return get(item.value);
    }

    export function EditableTitle(props: {
        config: DTO.Setting;
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
        config: DTO.Setting;
        value?: any;
        onChange?(v: any): void;
    }) {
        const { config } = props;
        let comp: React.ReactElement;

        switch (config.type) {
            case DTO.SettingType.STRING:
                comp = (
                    <Input
                        value={props.value}
                        onChange={(e) => props.onChange(e.currentTarget.value)}
                    />
                );
                break;
            case DTO.SettingType.NUMBER:
                comp = <InputNumber value={props.value} onChange={props.onChange} />;
                break;
            case DTO.SettingType.BOOLEAN:
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
            case DTO.SettingType.ARRAY:
                comp = <InputArray config={config} />;
        }

        return (
            <Space align="baseline">
                {comp}
                {_suffix(config)}
            </Space>
        );
    }

    export function _suffix(config: DTO.Setting): string | undefined {
        switch (config.id) {
            case 1:
                return 'Menit';
            case 5:
                return 'Menit';
            case 6:
                return 'Jam';
        }
    }

    function _rules_arr(config: DTO.Setting): Rule[] {
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
        config: DTO.Setting;
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

// export async function getServerSideProps(ctx: NextPageContext) {
//     const session = await getSession(ctx);
//     const config = api.auhtHeader(session);

//     const res = await api.manage<DTO.Setting[]>(api.get('/app/config', config));
//     if (axios.isAxiosError(res)) return api.serverSideError(res);

//     return {
//         props: {
//             data: res.data
//                 .sort((a, b) => a.id - b.id)
//                 .filter((s) => !Setting.EXCLUDED_IDS.includes(s.id)),
//         },
//     };
// }

// interface SettingPageProps extends CoreService.ErrorDTO {
//     data: DTO.Setting[];
// }

// interface SettingDTO {
//     id: number;
//     name: string;
//     title: string;
//     type: Setting.Type;
//     value: string;
//     description: string;
// }
