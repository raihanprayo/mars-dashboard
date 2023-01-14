import axios, { Axios, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import qs from 'qs';
import getConfig from 'next/config';
import { isBrowser, isServer } from '_utils/constants';
import { HttpHeader, isArr, isDefined } from '@mars/common';
import { getSession } from 'next-auth/react';
import { NextPageContext } from 'next';
import { Session } from 'next-auth';

const config = (getConfig() as NextAppConfiguration)[
    isBrowser ? 'publicRuntimeConfig' : 'serverRuntimeConfig'
];

const api: CoreService = axios.create({
    baseURL: config.service.url,
    paramsSerializer(params) {
        // const o = inlineKey(params, { separateArray: false });
        // const result: string[] = [];

        const result = qs.stringify(params, {
            allowDots: true,
            arrayFormat: 'comma',
            charset: 'utf-8',
            skipNulls: false,
            addQueryPrefix: true,
            serializeDate: (d) => d.toJSON(),
            indices: true,
        });

        return result.slice(1);
    },
}) as any;

api.interceptors.request.use(async (c) => {
    console.log('intercept request');

    if (isBrowser) {
        const session = await getSession();
        if (session && session.bearer) {
            c.headers[HttpHeader.AUTHORIZATION] = `Bearer ${session.bearer}`;
        }
    }
    if (isServer) {
        if (c.url?.startsWith('/auth/whoami')) return c;

        const session = await getSession();
        if (session && session.bearer)
            c.headers[HttpHeader.AUTHORIZATION] = `Bearer ${session.bearer}`;
    }

    return c;
});

api.auhtHeader = (session, config = {}) => {
    if (session) {
        config.headers = config.headers ?? {};
        config.headers[HttpHeader.AUTHORIZATION] = `Bearer ${session.bearer}`;
    }
    return config;
};

globalThis.api = api;

declare global {
    var api: CoreService;
}

interface CoreService extends Axios {
    auhtHeader<D = any>(
        session: Session,
        config?: AxiosRequestConfig<D>
    ): AxiosRequestConfig<D>;
}
