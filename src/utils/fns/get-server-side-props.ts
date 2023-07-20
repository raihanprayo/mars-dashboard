import { AxiosRequestConfig } from 'axios';
import { NextPageContext } from 'next';
import { Session } from 'next-auth';
import { getSession } from 'next-auth/react';

export function getServerSidePropsWrapper(cb: ServerSideCallback) {
    return async (ctx: NextPageContext) => {
        const session = await getSession(ctx);
        const config = api.auhtHeader(session);
        return cb(ctx, session, config);
    };
}

export interface ServerSideCallback {
    (ctx: NextPageContext, session: Session, config: AxiosRequestConfig): any;
}
