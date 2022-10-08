import axios, { Axios } from 'axios';
import qs from 'qs';
import getConfig from 'next/config';

const config = getConfig().publicRuntimeConfig;

const api = axios.create({
    baseURL: config.service.url + '/api/mars',
    paramsSerializer(params) {
        // const o = inlineKey(params, { separateArray: false });
        // const result: string[] = [];

        const result = qs.stringify(params, {
            allowDots: true,
            arrayFormat: 'repeat',
            charset: 'utf-8',
            skipNulls: false,
            addQueryPrefix: true,
            serializeDate: d => d.toJSON(),
            indices: true
        });

        console.log(result);
        return result.slice(1);
    },
});

globalThis.api = api;

declare global {
    var api: Axios;
}
