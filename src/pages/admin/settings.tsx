import { Checkbox, Form, type FormProps, Input, InputNumber, Switch } from 'antd';
import axios from 'axios';
import { NextPageContext } from 'next';
import { getSession } from 'next-auth/react';
import { CoreService } from '_service/api';

enum SettingType {
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',
    DATE = 'DATE',
    JSON = 'JSON',
}

export default function SettingPage(props: SettingPageProps) {
    if (props.error) {
        return <>{props.error.message}</>;
    }

    const closeExpire = props.data[0];
    const registrationApproval = props.data[2];
    const pendingExpire = props.data[4];

    const onChange: FormProps['onValuesChange'] = (changed, values) => {
        console.log('Cahnged', changed);
        console.log('Values', values);
    };

    const initials = Object.fromEntries(
        props.data.map((item, index) => {
            if (item.type === SettingType.BOOLEAN)
                return [item.name, Boolean(item.value)] as const;
            if (item.type === SettingType.NUMBER)
                return [item.name, Number(item.value)] as const;
            return [item.name, item.value] as const;
        })
    );

    console.log(initials);
    return (
        <div className="workspace">
            <Form
                layout="vertical"
                size="small"
                onValuesChange={onChange}
                initialValues={initials}
                labelCol={{ span: 30 }}
            >
                <Form.Item
                    label="Reply Durasi Expire"
                    name={props.data[0].name}
                    tooltip={props.data[0].description}
                >
                    <InputNumber />
                </Form.Item>
                <Form.Item
                    label="Registrasi Approval"
                    name={props.data[2].name}
                    valuePropName="checked"
                    tooltip={props.data[2].description}
                >
                    <Switch
                        size="default"
                        checkedChildren="Ya"
                        unCheckedChildren="Tidak"
                    />
                </Form.Item>
                <Form.Item
                    label="Reply Durasi Pending"
                    name={props.data[4].name}
                    tooltip={props.data[4].description}
                >
                    <InputNumber />
                </Form.Item>
            </Form>
        </div>
    );
}

export async function getServerSideProps(ctx: NextPageContext) {
    const session = await getSession(ctx);
    const config = api.auhtHeader(session);

    const res = await api.manage(api.get('/app/config', config));
    if (axios.isAxiosError(res)) return api.serverSideError(res);

    return {
        props: {
            data: res.data,
        },
    };
}

interface SettingPageProps extends CoreService.ErrorDTO {
    data: SettingDTO[];
}

interface SettingDTO {
    id: number;
    name: string;
    type: SettingType;
    value: any;
    description: string;
}
