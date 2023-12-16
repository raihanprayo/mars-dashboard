import "./src/libs"
import { BaseContext, NextPageContext } from 'next/dist/shared/lib/utils';
import { ComponentType } from 'react';

declare global {
    interface HasChild<T = React.ReactNode> {
        children?: T;
    }

    interface NextServerSideProps<T extends object> {
        props: Partial<T>;
    }

    type NextServerSidePropsAsync<T extends object> = Promise<NextServerSideProps<T>>;

    interface NextAppConfiguration {
        publicRuntimeConfig: AppConfiguration;
        serverRuntimeConfig: AppConfiguration;
    }
    interface AppConfiguration extends map {
        service?: map & {
            url: string;
            api_url: string;
            file_url: string;
        };
    }

    interface MarsPageContext extends NextPageContext {
        token: string;
    }

    type MarsPage<P = any> = ComponentType<P> & {
        /**
         * Used for initial page load data population. Data returned from `getInitialProps` is serialized when server rendered.
         * Make sure to return plain `Object` without using `Date`, `Map`, `Set`.
         * @param ctx Context of `page`
         */
        getInitialProps?(context: MarsPageContext): any | Promise<any>;
    };

    type Tupple<T> = [T, T];
}
