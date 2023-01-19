import { NextAuthMiddlewareOptions, withAuth } from 'next-auth/middleware';
import { NextMiddleware } from 'next/server';

const rootMiddleware: NextMiddleware = async (req, event) => {
    const isIgnored =
        IGNORED.findIndex((path) => req.nextUrl.pathname.startsWith(path)) !== -1;

    if (isIgnored) return;
    const authMiddeware: any = withAuth(
        function (req, event) {
            console.log('INCOMING REQUEST TO', req.nextUrl.pathname);
        },
        {
            pages: {
                signIn: '/auth/login',
            },
        } as NextAuthMiddlewareOptions
    );
    await authMiddeware(req, event);
};
export default rootMiddleware;

const IGNORED = ['/api/shared', '/api/info'];
// export default NextAuthMiddleware;
