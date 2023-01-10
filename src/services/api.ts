import axios, { Axios } from 'axios';
import qs from 'qs';
import getConfig from 'next/config';
import { isBrowser, isServer } from '_utils/constants';
import { HttpHeader, isArr, isDefined } from '@mars/common';

const config = (getConfig() as NextAppConfiguration)[
    isBrowser ? 'publicRuntimeConfig' : 'serverRuntimeConfig'
];

const api = axios.create({
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

    transformRequest: [
        (data, header) => {
            if (isBrowser) {
                const token = localStorage.getItem('token');
                if (token) {
                    header[HttpHeader.AUTHORIZATION] =
                        'Bearer ' + localStorage.getItem('token');
                }
            }
            return data;
        },
        ...transformRequests(),
    ],
});

globalThis.api = api;

declare global {
    var api: Axios;
}

function transformRequests() {
    const t = axios.defaults.transformRequest;
    if (isArr(t)) return t;
    return [t].filter(isDefined);
}
