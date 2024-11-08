import { Form, message, Drawer, Space, Button, Input, Radio } from 'antd';
import { useState, useEffect } from 'react';
import { EnumSelect, RoleTransfer, StoSelect } from '_comp/table/input.fields';
import notif from '_service/notif';
import { Mars } from '@mars/common/types/mars';

export function EditUserDrawer(props: UserDetailDrawerProps) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const onClose = (afterUpdate: boolean) => () => {
        props.onClose?.(false, afterUpdate);
    };

    const onSaveClick = () => {
        // const { id, nik, phone, active, roles } = form.getFieldsValue();
        const values = form.getFieldsValue();
        const { id, ...metadata } = values;

        console.log(values);
        setLoading(true);
        api.put('/user/partial/' + id, metadata)
            .then((res) => message.success('Success'))
            .then(onClose(true))
            .catch((err) => notif.axiosError(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (props.user) form.setFieldsValue({ ...props.user });
        else form.setFieldsValue({});
    }, [props.user]);

    return (
        <Drawer
            title="Edit User"
            open={props.open}
            width={500}
            onClose={onClose(false)}
            extra={[
                <Space key="edit-submit-btn">
                    <Button type="primary" loading={loading} onClick={onSaveClick}>
                        Save
                    </Button>
                </Space>,
            ]}
        >
            <Form form={form} layout="vertical" initialValues={props.user}>
                <Form.Item label="ID" name="id">
                    <Input disabled />
                </Form.Item>
                <Form.Item label="NIK" name="nik">
                    <Input disabled />
                </Form.Item>
                <Form.Item label="Nama" name="name">
                    <Input />
                </Form.Item>
                <Form.Item label="No HP" name="phone">
                    <Input />
                </Form.Item>
                <Form.Item label="Witel" name="witel">
                    <EnumSelect enums={Mars.Witel} mode="single" />
                </Form.Item>
                <Form.Item label="STO" name="sto">
                    <StoSelect />
                </Form.Item>
                <Form.Item label="Aktif" name="active">
                    <Radio.Group buttonStyle="solid">
                        <Radio.Button value={true}>Ya</Radio.Button>
                        <Radio.Button value={false}>Tidak</Radio.Button>
                    </Radio.Group>
                </Form.Item>
                <Form.Item
                    label="Roles"
                    name="roles"
                    rules={[
                        {
                            validator(rule, value, callback) {
                                if (!value || value.length <= 0)
                                    return callback('minimal 1 role terpilih');

                                callback();
                            },
                        },
                    ]}
                >
                    <RoleTransfer userId={props.user?.id} />
                </Form.Item>
            </Form>
        </Drawer>
    );
}
export interface UserDetailDrawerProps {
    user?: DTO.Users;

    open?: bool;
    onClose?(open: bool, afterUpdate: boolean): void;
}
