import {
    AuditOutlined,
    BarChartOutlined,
    ApartmentOutlined,
    UserOutlined,
    GroupOutlined,
    SolutionOutlined,
    InboxOutlined,
    SettingOutlined,
    BulbOutlined,
    BugOutlined,
    StarOutlined,
} from '@ant-design/icons';
import { isDefined } from '@mars/common';
import { Session } from 'next-auth';
import { createElement } from 'react';
import { ROLE_ADMIN, ROLE_AGENT, ROLE_USER } from '_utils/constants';

const PageRoutes: PageRoute[] = [
    {
        type: 'page',
        name: 'Tickets',
        path: '/',
        icon: createElement(AuditOutlined),
    },
    {
        type: 'page',
        name: 'Inbox',
        path: '/inbox',
        icon: createElement(InboxOutlined),
        access: {
            hasRole: [ROLE_AGENT],
        },
    },
    {
        type: 'page',
        name: 'Reports',
        path: '/statistik/reports',
        icon: createElement(BarChartOutlined),
    },
    {
        type: 'page',
        name: 'Leaderboards',
        path: '/statistik/leaderboard',
        icon: createElement(StarOutlined),
    },
    {
        type: 'group',
        name: 'Miscellaneous',
        icon: createElement(ApartmentOutlined),
        access: {
            hasRole: [ROLE_ADMIN]
        },
        children: [
            {
                type: 'page',
                name: 'Jenis Kendala',
                path: '/misc/issue',
                icon: createElement(BugOutlined),
            },
            {
                type: 'page',
                name: 'Actual Solution',
                path: '/misc/solution',
                icon: createElement(BulbOutlined),
                // access: {
                //     hasRole: ['admin']
                // }
            },
        ],
    },
    {
        type: 'group',
        name: 'Application',
        icon: createElement(ApartmentOutlined),
        children: [
            {
                type: 'page',
                name: 'Settings',
                path: '/admin/settings',
                icon: createElement(SettingOutlined),
                access: {
                    hasRole: [ROLE_ADMIN],
                },
            },
            {
                type: 'page',
                name: 'Users',
                path: '/admin/users',
                icon: createElement(UserOutlined),
                access: {
                    hasRole: [ROLE_ADMIN],
                },
            },
            {
                type: 'page',
                name: 'User Approvals',
                path: '/admin/approvals',
                icon: createElement(AuditOutlined),
                access: {
                    hasRole: [ROLE_ADMIN],
                },
            },
            {
                type: 'page',
                name: 'Groups',
                path: '/admin/groups',
                icon: createElement(GroupOutlined),
                access: {
                    disable: true,
                    hasRole: [ROLE_ADMIN],
                },
            },
            {
                type: 'page',
                name: 'Roles',
                path: '/admin/roles',
                icon: createElement(SolutionOutlined),
                access: {
                    disable: true,
                    hasRole: [ROLE_ADMIN],
                },
            },
        ],
    },
];

export default PageRoutes;

export function filterRoute(route: PageRoute, session: Session): PageRoute | null {
    if (route.type === 'group') {
        if (!accessible(session, route.access)) return null;

        const childs = route.children
            .map((subroute) => filterRoute(subroute, session) as SingleRoute)
            .filter(isDefined);

        if (childs.length === 0) return null;
        return {
            ...route,
            children: childs,
        };
    } else {
        if (!accessible(session, route.access)) return null;
        return {
            ...route,
        };
    }
}

function accessible(session: Session, opt?: RouteAccessOpt) {
    if (!opt) return true;
    if (opt.disable) return false;

    const appRoles = session.roles;
    const checkRole =
        opt.hasRole && opt.hasRole.findIndex((role) => appRoles.includes(role)) !== -1;
    return checkRole;
}

export type PageRoute = GroupRoute | SingleRoute;

interface BaseRoute {
    name: string;
    roles?: string[];
    icon?: React.ReactElement;
    access?: RouteAccessOpt;
}

export interface GroupRoute extends BaseRoute {
    type: 'group';
    children: SingleRoute[];
}
export interface ChildRoute extends BaseRoute {}
export interface SingleRoute extends BaseRoute {
    type: 'page';
    path?: string;
    badge?: { value: number };
}
export interface RouteAccessOpt {
    disable?: boolean;
    hasRole?: string[];
    groupOnly?: boolean;
}
