import { message } from 'antd';
import axios, { AxiosError } from 'axios';

class Notifier {
    axiosError(err: AxiosError, duration = 5) {
        const errData = err.response?.data as any;
        if (errData) {
            message.error(
                <ErrorFormat
                    code={errData.status}
                    title={errData.title || err.message}
                    message={errData.detail || errData.message}
                />,
                duration
            );
        } else {
            message.error(
                <ErrorFormat title={err.code} message={err.message} />,
                duration
            );
        }
    }

    error(err: Error, duration = 5) {
        if (axios.isAxiosError(err)) this.axiosError(err, duration);
        else message.error(<ErrorFormat title={err.name} message={err.message} />, 5);
    }
}

const notif = new Notifier();
export default notif;

function ErrorFormat(props: ErrorFormatProps) {
    return (
        <div>
            {props.title && (
                <h6>
                    {props.code} {props.title}
                </h6>
            )}
            <p>{props.message}</p>
        </div>
    );
}

interface ErrorFormatProps {
    code?: number;
    title?: string;
    message: string;
}
