import axios, { Axios, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import qs from 'qs';
import { HttpHeader } from '@mars/common';
import { Session } from 'next-auth';
import { isServer } from '_utils/constants';

const baseUrl = process.env.NEXT_PUBLIC_SERVICE_URL;
const api: CoreService = axios.create({
    baseURL: baseUrl,
    paramsSerializer(params) {
        // const o = inlineKey(params, { separateArray: false });
        // const result: string[] = [];
        // const result = qs.stringify(params, {
        //     allowDots: true,
        //     arrayFormat: 'brackets',
        //     charset: 'utf-8',
        //     skipNulls: false,
        //     addQueryPrefix: true,
        //     serializeDate: (d) => d.toJSON(),
        //     indices: true,
        // });

        // return result.slice(1);
        return api.serializeParam(params);
    },
}) as any;

// api.interceptors.response.use(
//     (v) => {
//         if (isServer) return v;

//         if (v.status === 401) {
//             const path = qs.stringify({ callbackUrl: window.location.pathname });
//             window.location.href = '/auth/login?' + path;
//         }
//         return v
//     },
//     (err) => err,
// );
// api.interceptors.request.use(async (c) => {
//     console.log('intercept request');

//     if (isBrowser) {
//         const session = await getSession();
//         if (session && session.bearer) {
//             c.headers[HttpHeader.AUTHORIZATION] = `Bearer ${session.bearer}`;
//         }
//     }
//     if (isServer) {
//         if (c.url?.startsWith('/auth/whoami')) return c;

//         const session = await getSession();
//         if (session && session.bearer)
//             c.headers[HttpHeader.AUTHORIZATION] = `Bearer ${session.bearer}`;
//     }

//     return c;
// });

api.auhtHeader = (session, config = {}) => {
    if (session) {
        config.headers = config.headers ?? {};
        config.headers[HttpHeader.AUTHORIZATION] = `Bearer ${session.bearer}`;
    }
    return config;
};
api.manage = <T = any>(respon: Promise<AxiosResponse<T>>) => {
    return respon.catch((err) => err);
};
api.serverSideError = (err, status) => {
    const data = err.response?.data;
    return {
        props: {
            error: {
                status: data?.status ?? status ?? err.status ?? null,
                title: data?.title ?? err.code,
                message: data?.detail ?? err.message,
            },
        },
    };
};
api.serializeParam = (params = {}) => {
    return qs
        .stringify(params, {
            allowDots: true,
            arrayFormat: 'comma',
            charset: 'utf-8',
            skipNulls: false,
            addQueryPrefix: true,
            serializeDate: (d) => d.toJSON(),
            indices: true,
        })
        .slice(1);
};

globalThis.api = api;

declare global {
    var api: CoreService;
}

export interface CoreService extends Axios {
    auhtHeader<D = any>(
        session: Session,
        config?: AxiosRequestConfig<D>
    ): AxiosRequestConfig<D>;

    manage<T = any>(
        respon: Promise<AxiosResponse<T>> | AxiosResponse<T>
    ): Promise<AxiosResponse<T> | AxiosError<any>>;
    serverSideError(err: AxiosError<any>, status?: number): any;

    serializeParam(o?: map): string;
}
export namespace CoreService {
    export interface ErrorDTO {
        error?: {
            status: number;
            title?: string;
            message: string;
        };
    }
}
