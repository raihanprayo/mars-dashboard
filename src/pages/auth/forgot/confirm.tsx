import { isStr, randomString } from '@mars/common';
import { useBool } from '_hook/util.hook';
import notif from '_service/notif';
import { Button, Card, Form, Input, Layout, Space } from 'antd';
import axios from 'axios';
import { NextPageContext } from 'next';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { ForgotLayout } from '.';

function ForgotConfirmOTP(props: ForgotConfirmOTP.Props) {
    const loading = useBool();
    const reset = useBool(true);

    const router = useRouter();
    const [form] = Form.useForm();
    const [length, setLength] = useState(props.length);

    const onFinish = (value: any) => {
        api.post('/auth/forgot/validate', {
            otp: value.otp,
            token: value.token,
        })
            .then((res) => {
                router.push({
                    pathname: '/auth/forgot/reset',
                    query: {
                        u: router.query.u,
                        token: value.token,
                    },
                });
            })
            .catch(notif.axiosError);
    };

    const resetOtp = () => {
        loading.setValue(true);
        api.put('/auth/forgot/regenerate', null, {
            params: { token: form.getFieldValue('token') },
        })
            .then(({ data }) => {
                setLength(data.length);
                form.setFieldValue('token', data.token);
            })
            .catch(notif.axiosError)
            .finally(() => loading.setValue(false));
    };

    return (
        <ForgotLayout>
            <Card>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ token: props.token }}
                >
                    <Form.Item name="token" hidden>
                        <Input disabled />
                    </Form.Item>

                    <Form.Item name="otp">
                        <OtpInput length={length} />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button onClick={resetOtp} disabled={reset.value}>
                                Reset OTP
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading.value}
                            >
                                Submit
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </ForgotLayout>
    );
}

namespace ForgotConfirmOTP {
    export interface Props {
        length: number;
        token: string;

        error?: {};
    }

    export enum ErrState {
        UNKNOWN,
        INVALID_USER,
    }

    export async function getInitialProps(ctx: NextPageContext) {
        const username = ctx.query.u;

        const resGenerateOtp = await api.manage(
            api.post('/auth/forgot/generate', {
                with: 'TELEGRAM',
                username,
            })
        );

        if (axios.isAxiosError(resGenerateOtp)) {
            return api.serverSideError(resGenerateOtp).props;
        }

        // ctx.res.
        return resGenerateOtp.data;
    }
}

export default ForgotConfirmOTP;

function OtpInput(props: OtpInputProps) {
    const id = useMemo(() => randomString(5), []);
    const len = useMemo(() => props.length, [props.length]);
    const [value, setValue] = useState<string>(props.value);

    const onChange = (index: number, segment: string) => {
        const newValue = Array(len)
            .fill(1)
            .map((t, i) => value?.[i]);

        newValue[index] = segment;
        setValue(newValue.join(''));
        props.onChange?.(newValue.join(''));
    };

    const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const text = e.clipboardData.getData('text');
        if (isStr(text) && text.trim().length > 0) {
            const t = text.trim();

            if (t.length > props.length) return;
            setValue(t);
            props.onChange?.(t);
        }
    };

    return (
        <>
            <Space id={id} align="center">
                {Array(len)
                    .fill(1)
                    .map((t, i) => {
                        return (
                            <Input
                                key={`${id}-otp:${i}`}
                                type="text"
                                maxLength={1}
                                value={value?.[i]}
                                onChange={(event) =>
                                    onChange(i, event.currentTarget.value)
                                }
                                onPaste={onPaste}
                            />
                        );
                    })}
            </Space>
        </>
    );
}
interface OtpInputProps {
    value?: any;
    onChange?: (value: string) => void;

    length?: int;
}
