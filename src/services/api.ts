import axios, { Axios, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import qs from 'qs';
import { HttpHeader, isArr, Properties } from '@mars/common';
import { isDate } from 'date-fns';
import { Session } from 'next-auth';
import { isServer } from '_utils/constants';
import config from '_config';
import { PathBuilder, RequestPath } from './service';

const api: CoreService = axios.create({
    baseURL: isServer ? config.service.url : null,
    paramsSerializer(params) {
        return api.serializeParam(params);
    },
}) as any;

if (isServer) {
    api.defaults.baseURL = config.service.url;
}

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
api.serverSideErrorLog = (err) => {
    console.error(err);
    return err;
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

globalThis.api = Object.assign(api, {
    get ticket() {
        return RequestPath.r(api.defaults.baseURL).ticket;
    },
    get auth() {
        return RequestPath.r(api.defaults.baseURL).auth;
    },
});

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
    serverSideErrorLog(err: any): any;

    serializeParam(o?: map): string;

    readonly auth: PathBuilder;
    readonly ticket: PathBuilder;
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