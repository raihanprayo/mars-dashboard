import axios, { Axios } from "axios";
import getConfig from "next/config";

const config = getConfig().publicRuntimeConfig

const api = axios.create({
    baseURL: config.service.url,
});

globalThis.api = api;

declare global {
    var api: Axios;
}
