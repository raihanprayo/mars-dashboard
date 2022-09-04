import axios, { Axios } from "axios";
import getConfig from "next/config";

const api = axios.create({
    baseURL: process.env.SERVICE_URL,
});

globalThis.api = api;

declare global {
    var api: Axios;
}
