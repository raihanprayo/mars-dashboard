import { inlineKey, isArr, isNull, isUndef } from "@mars/common";
import axios, { Axios } from "axios";
import getConfig from "next/config";

const config = getConfig().publicRuntimeConfig;

const api = axios.create({
    baseURL: config.service.url,
    paramsSerializer(params) {
        const o = inlineKey(params, { separateArray: false });
        const result: string[] = [];

        for (let [key, v] of Object.entries(o)) {
            let value: any;

            if (isUndef(v)) continue;
            else if (isNull(v)) value = "null";
            else if (isArr(v)) value = isArr(v) ? v.join(",") : v;
            else if (v instanceof Date) value = v.toJSON();
            else value = v.toString();

            result.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
        }
        return result.join("&");
    },
});

globalThis.api = api;

declare global {
    var api: Axios;
}
