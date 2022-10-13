import axios, { Axios } from 'axios';
import qs from 'qs';
import getConfig from 'next/config';
import { isBrowser } from '_utils/constants';

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
});

globalThis.api = api;

declare global {
    var api: Axios;
}
