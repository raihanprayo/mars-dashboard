import { AutoComplete, Button, Drawer, Form, Input, Radio, Space } from 'antd';
import { DefaultOptionType } from 'antd/lib/select/index';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { RoleTransfer } from '_comp/table/input.fields';
import { FormRules } from '../rules';

export function AddUserDrawer(props: AddUserDrawerProps) {
    const router = useRouter();
    const [form] = Form.useForm();

    const [groups, setGroups] = useState<DefaultOptionType[]>([]);
    const [loading, setLoading] = useState(false);

    const onClose = () => {
        form.resetFields();
        props.onClose?.();
    };

    const onSubmit = async () => {
        const result = await form.validateFields();
        console.log('Validation', result);

        const {
            name,
            nik,
            phone,
            email,
            username,
            active,
            group,
            roles: { selected },
        } = result;

        const groupId: string = groups.find((e) => e.value === group).id;
        const json = {
            name,
            nik,
            phone,
            email,
            username,
            active,
            group: groupId,
            roles: selected,
        };

        setLoading(true);
        api.post('/user/register', json)
            .then(() => setLoading(false))
            .then(router.reload)
            .catch((err) => err);
    };

    useEffect(() => {
        api.get<DTO.Group[]>('/group')
            .then((res) => {
                setGroups(
                    res.data.map((gr) => {
                        return {
                            id: gr.id,
                            label: gr.name,
                            value: gr.name,
                        };
                    })
                );
            })
            .catch((err) => {});
    }, []);

    const action = (
        <Space>
            <Button type="primary" loading={loading} onClick={onSubmit}>
                Tambah
            </Button>
        </Space>
    );

    return (
        <Drawer
            title="Tambah User"
            open={props.open}
            onClose={onClose}
            extra={action}
            width={550}
        >
            <Form
                form={form}
                layout="vertical"
                // onKeyDownCapture={(e) => {
                //     const key = e.key.toLowerCase();
                //     if (key === 'enter') onSubmit();
                // }}
            >
                <Form.Item label="Nama" name="name" rules={[FormRules.REQUIRED]}>
                    <Input placeholder="nama lengkap" />
                </Form.Item>
                <Form.Item label="NIK" name="nik" rules={[FormRules.REQUIRED]}>
                    <Input placeholder="nik" />
                </Form.Item>
                <Form.Item label="No HP" name="phone" rules={[FormRules.REQUIRED]}>
                    <Input placeholder="no hp" />
                </Form.Item>
                <Form.Item label="Email" name="email" rules={[{ type: 'email' }]}>
                    <Input placeholder="email (optional)" />
                </Form.Item>
                <Form.Item label="Username" name="username">
                    <Input placeholder="preferred username (optional)" />
                </Form.Item>
                <Form.Item label="Witel" name="group">
                    <AutoComplete options={groups} />
                </Form.Item>
                <Form.Item label="Aktif" name="active" rules={[FormRules.REQUIRED]}>
                    <Radio.Group buttonStyle="solid">
                        <Radio.Button value={true}>Ya</Radio.Button>
                        <Radio.Button value={false}>Tidak</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                <Form.Item
                    label="Roles"
                    name="roles"
                    required
                    rules={[FormRules.ROLE_RULE]}
                >
                    <RoleTransfer />
                </Form.Item>
            </Form>
        </Drawer>
    );
}

export interface AddUserDrawerProps {
    title?: string;
    open?: boolean;
    onClose?(): void;
}
