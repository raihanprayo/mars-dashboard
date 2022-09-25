interface HasChild {
    children?: React.ReactNode;
}

interface Pageable {
    page: number;
    size: number;
}

interface NextAppConfiguration {
    publicRuntimeConfig: AppConfiguration;
    serverRuntimeConfig: AppConfiguration;
}
interface AppConfiguration extends map {
    service?: map & {
        url: string;
    };
}
