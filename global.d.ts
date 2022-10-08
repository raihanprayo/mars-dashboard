interface HasChild {
    children?: React.ReactNode;
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
