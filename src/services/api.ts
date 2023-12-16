import axios, { Axios, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import qs from 'qs';
import { HttpHeader, isArr, Properties } from '@mars/common';
import { Session } from 'next-auth';
import { isBrowser, isServer } from '_utils/constants';
import config from '_config';
import { PathBuilder, RequestPath } from './service';

const api: CoreService = axios.create({
    baseURL: isServer ? config.service.url : null,
    withCredentials: isBrowser,
    paramsSerializer(params) {
        return api.serializeParam(params);
    },
}) as any;

if (isServer) {
    api.defaults.baseURL = config.service.url;
    let transformRequest = api.defaults.transformRequest;
    if (!isArr(transformRequest)) transformRequest = [transformRequest];

    // api.defaults.transformRequest =[
    //     ...transformRequest,
    //     (data, headers) => {

    //     }
    // ]
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
    // const { sort, ...others } = params;
    let query = qs
        // .stringify(others, {
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

    // if (isArr(sort)) {
    //     const multipleSort = (s: PageableSortTupple[]) => {
    //         for (const [prop, direction] of s) query += `&sort=${prop},${direction.toLowerCase()}`;
    //     };

    //     const s: PageableSort = sort;
    //     if (s.length === 2) {
    //         const isSubArray = isArr(s[0]);
    //         if (!isSubArray) {
    //             const [prop, direction] = s;
    //             query += `&sort=${prop},${direction}`;
    //         }
    //         else multipleSort(s);
    //     }
    //     else multipleSort(s);
    // }

    return query;
};
api.setAuthorization = (bearer) => {
    if (bearer)
        api.defaults.headers.common[HttpHeader.AUTHORIZATION] = `Bearer ${bearer}`;
    else delete api.defaults.headers.common[HttpHeader.AUTHORIZATION];
};

globalThis.api = Object.assign(api, {
    get ticket() {
        return RequestPath.r(api, api.defaults.baseURL).ticket;
    },
    get auth() {
        return RequestPath.r(api, api.defaults.baseURL).auth;
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
    ): Promise<AxiosResponse<T> | AxiosError>;
    serverSideError(err: AxiosError<any>, status?: number): any;
    serverSideErrorLog(err: any): any;

    serializeParam(o?: map): string;

    setAuthorization(bearer: string): void;

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
