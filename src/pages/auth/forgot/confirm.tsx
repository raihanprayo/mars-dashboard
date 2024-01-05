import { isDefined, isFn, isNum, isStr, randomString } from "@mars/common";
import { useBool } from "_hook/util.hook";
import notif from "_service/notif";
import {
    Button,
    Card,
    Form,
    Input,
    InputRef,
    Layout,
    Space,
    Typography,
} from "antd";
import axios from "axios";
import dateFns from "date-fns";
import { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ForgotLayout } from ".";

interface OtpForm {
    token: string;
    otp: string;
}
function ForgotConfirmOTP(props: ForgotConfirmOTP.Props) {
    const loading = useBool();
    const reset = useBool(true);

    const router = useRouter();
    const [form] = Form.useForm<OtpForm>();
    const [length, setLength] = useState(props.length);

    const onFinish = (value: OtpForm) => {
        api.post("/auth/forgot/validate", {
            otp: value.otp,
            token: value.token,
        })
            .then((res) => {
                router.push({
                    pathname: "/auth/forgot/reset",
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
        window.location.reload();
        // api.put("/auth/forgot/regenerate", null, {
        //     params: { token: form.getFieldValue("token") },
        // })
        //     .then(({ data }) => {
        //         setLength(data.length);
        //         form.setFieldValue("token", data.token);
        //     })
        //     .catch(notif.axiosError)
        //     .finally(() => loading.setValue(false));
    };

    const currentOtp = Form.useWatch("otp", form);
    console.log("OTP -", currentOtp);
    return (
        <ForgotLayout>
            <Card>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ token: props.token }}
                >
                    <Typography>
                        <Typography.Title level={5}>
                            One Time Password (OTP)
                        </Typography.Title>
                        <Typography.Paragraph>
                            Silahkan masukkan kode OTP yang anda terima pada
                            telegram anda.{" "}
                            <OtpCountDown
                                expiredAt={props.expiredAt}
                                onZeroCountdown={() => reset.setValue(false)}
                            />
                        </Typography.Paragraph>
                    </Typography>

                    <Form.Item name="token" hidden>
                        <Input disabled />
                    </Form.Item>

                    <Form.Item
                        name="otp"
                        rules={[
                            {
                                required: true,
                                len: length,
                                message: "kode otp tidak boleh kosong",
                            },
                        ]}
                    >
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
        expiredAt: number;

        error?: {};
    }

    export enum ErrState {
        UNKNOWN,
        INVALID_USER,
    }

    export async function getInitialProps(ctx: NextPageContext) {
        const username = ctx.query.u;

        const resGenerateOtp = await api.manage(
            api.post("/auth/forgot/generate", {
                with: "TELEGRAM",
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
    const [value, setValue] = useState<number[]>(
        props.value?.split("").map((e) => Number(e)) ?? []
    );
    const otpRef = useRef<InputRef[]>([]);

    const onChange = (index: number, segment: string) => {
        const newValue = [...value];

        if (segment) newValue[index] = Number(segment);
        else newValue[index] = undefined;

        setValue(newValue);
        props.onChange?.(newValue.join(""));

        const next = otpRef.current[index + 1];
        const prev = otpRef.current[index - 1];

        if (segment && next) next.focus();
        else if (!segment && prev) prev.focus();
    };

    const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const text = e.clipboardData.getData("text");
        if (isStr(text) && text.trim().length > 0) {
            const t = text.trim();

            if (t.length > props.length) return;

            const v = t.split("").map((e) => Number(e));
            setValue(v);
            props.onChange?.(t);
        }
    };

    return (
        <Space id={id} align="center">
            {Array(len)
                .fill(1)
                .map((t, i) => {
                    return (
                        <Input
                            ref={(ref) => (otpRef.current[i] = ref)}
                            key={`${id}-otp:${i}`}
                            type="text"
                            maxLength={1}
                            value={value?.[i]}
                            onChange={(event) => {
                                const value = event.currentTarget.value;
                                onChange(i, value);
                            }}
                            onKeyUp={(e) => {
                                const value = e.currentTarget.value;

                                if (!value)
                                    if (e.code === "Backspace") onChange(i, "");
                            }}
                            onPaste={onPaste}
                        />
                    );
                })}
        </Space>
    );
}
interface OtpInputProps {
    value?: string;
    onChange?: (value: string) => void;

    length?: int;
}

const fillZero = (n: number) => n.toString().padStart(2, "0");
function OtpCountDown(props: OtpCountDownProps) {
    const intervalRef = useRef<NodeJS.Timer>();

    const target = useMemo(
        () => new Date(props.expiredAt).getTime(),
        [props.expiredAt]
    );

    const [value, setValue] = useState<string>("0");

    const updateCounter = useCallback(() => {
        const current = new Date();
        const distance = target - current.getTime();

        const hours = Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setValue(
            [hours, minutes, seconds]
                .map((e) => (e >= 0 ? e : 0))
                .filter((e) => !!e)
                .map(fillZero)
                .join(":")
        );
        if (distance < 1 && isFn(props.onZeroCountdown))
            props.onZeroCountdown();
    }, [props.expiredAt, value]);

    useEffect(() => {
        intervalRef.current = setInterval(() => updateCounter(), 1500);
        return () => clearInterval(intervalRef.current);
    }, [props.expiredAt]);

    return (
        <span>
            {props.children} ({value || "00:00"})
        </span>
    );
}
interface OtpCountDownProps extends HasChild {
    expiredAt: number;
    onZeroCountdown?(): void;
}
