import { isFalsy, isSymbol } from '@mars/common';
import axios, { Axios, AxiosRequestConfig, AxiosResponse, Method } from 'axios';

const methods = ['get', 'put', 'post', 'delete', 'head', 'options'];

export class RequestPath {
    private baseUrl: string;

    private paths: string[] = [];

    private query: map = {};

    constructor(parent: Axios, baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    request<R = any, D = any>(method: Method, config: AxiosRequestConfig<D>) {
        const url = this.joinPaths();
        const params = Object.assign({}, this.query, config.params ?? {});

        if (isFalsy(config.url)) config.url = url;
        else {
            const cleanedUrl = config.url.startsWith('/')
                ? config.url.slice(1)
                : config.url;

            config.url = `${url}/${cleanedUrl}`;
        }

        this.query = {};
        return axios.request<R, AxiosResponse<R, D>, D>({
            method,
            baseURL: this.baseUrl,
            ...config,
            params,
        });
    }

    get<R = any>(config: AxiosRequestConfig = {}) {
        const { baseURL, ...others } = config;
        return this.request<R>('get', others);
    }
    put<R = any, D = any>(data?: D, config: AxiosRequestConfig<D> = {}) {
        const { baseURL, ...others } = config;
        return this.request<R, D>('put', {
            ...others,
            data,
        });
    }
    post<R = any, D = any>(data?: D, config: AxiosRequestConfig<D> = {}) {
        const { baseURL, ...others } = config;
        return this.request<R, D>('post', {
            ...others,
            data,
        });
    }
    delete<R = any, D = any>(config: AxiosRequestConfig<D> = {}) {
        const { baseURL, ...others } = config;
        return this.request<R, D>('delete', others);
    }
    head<R = any>(config: AxiosRequestConfig<R> = {}) {
        const { baseURL, ...others } = config;
        return this.request<R>('head', others);
    }
    options<R = any>(config: AxiosRequestConfig<R> = {}) {
        const { baseURL, ...others } = config;
        return this.request<R>('options', others);
    }

    private joinPaths() {
        try {
            if (this.paths.length === 0) return '';
            return '/' + this.paths.join('/');
        } finally {
            this.paths = [];
        }
    }

    static r(parent: Axios, baseUrl: string): PathBuilder {
        const rp = new Proxy(new RequestPath(parent, baseUrl), {
            get(target, prop) {
                if (isSymbol(prop))
                    throw new TypeError('Request path must be a readable type');

                switch (prop.toLowerCase()) {
                    case 'p':
                        return (path: string | number | boolean) => {
                            target.paths.push(String(path));
                            return rp;
                        };
                    case 'q':
                        return (query: map = {}) => {
                            target.query = query;
                            return target;
                        };
                    default:
                        if (methods.includes(prop as any))
                            return target[prop].bind(target);
                        else target.paths.push(prop);
                        break;
                }
                return rp;
            },
        }) as PathBuilder;

        return rp;
    }
}

interface RecursePathBuilder extends map<PathBuilder> {}
interface PathHelper {
    p(path: string | boolean | number): PathBuilder;
    P(path: string | boolean | number): PathBuilder;
    q(query: map): RequestPath;
    Q(query: map): RequestPath;
}

export type PathBuilder = RequestPath & PathHelper & RecursePathBuilder;
