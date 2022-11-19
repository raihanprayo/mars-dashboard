import axios, { Axios } from 'axios';
import qs from 'qs';
import getConfig from 'next/config';
import { isBrowser, isServer } from '_utils/constants';
import { HttpHeader, isArr, isDefined } from '@mars/common';

const config = getConfig()[isBrowser ? 'publicRuntimeConfig' : 'serverRuntimeConfig'];

const api = axios.create({
    baseURL: config.service.url + (config.service.prefix ?? ''),
    paramsSerializer(params) {
        // const o = inlineKey(params, { separateArray: false });
        // const result: string[] = [];

        const result = qs.stringify(params, {
            allowDots: true,
            arrayFormat: 'repeat',
            charset: 'utf-8',
            skipNulls: false,
            addQueryPrefix: true,
            serializeDate: (d) => d.toJSON(),
            indices: true,
        });

        console.log(result);
        return result.slice(1);
    },

    transformRequest: [
        (data, header) => {
            if (isBrowser)
                header[HttpHeader.AUTHORIZATION] =
                    'Bearer ' + localStorage.getItem('token');
            return data;
        },
        ...transformRequests(),
    ],
    // validateStatus(status) {
    //     if (isServer) return true;
    //     return axios.defaults.validateStatus(status);
    // },
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
