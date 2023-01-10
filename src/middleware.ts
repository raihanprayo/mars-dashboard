import NextAuthMiddleware, {
    NextAuthMiddlewareOptions,
    withAuth,
} from 'next-auth/middleware';
import { NextMiddleware } from 'next/server';

export default withAuth(
    function (req) {
        console.log('INCOMING REQUEST TO', req.nextUrl.pathname);
    },
    {
        pages: {
            signIn: '/auth/login',
        },
    } as NextAuthMiddlewareOptions
);

// export default NextAuthMiddleware;
