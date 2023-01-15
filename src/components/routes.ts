import {
    AuditOutlined,
    ScheduleOutlined,
    BarChartOutlined,
    TeamOutlined,
    ApartmentOutlined,
    UserOutlined,
    GroupOutlined,
    SolutionOutlined,
} from '@ant-design/icons';
import { isDefined } from '@mars/common';
import { Session } from 'next-auth';
import { createElement } from 'react';

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
        icon: createElement(ScheduleOutlined),
    },
    {
        type: 'page',
        name: 'Reports',
        path: '/reports',
        icon: createElement(BarChartOutlined),
    },
    {
        type: 'page',
        name: 'Leaderboards',
        icon: createElement(TeamOutlined),
    },
    {
        type: 'group',
        name: 'Application',
        icon: createElement(ApartmentOutlined),
        children: [
            {
                type: 'page',
                name: 'Users',
                path: '/admin/users',
                icon: createElement(UserOutlined),
                access: {
                    hasRole: ['admin'],
                },
            },
            {
                type: 'page',
                name: 'Groups',
                path: '/admin/groups',
                icon: createElement(GroupOutlined),
                access: {
                    hasRole: ['admin'],
                },
            },
            {
                type: 'page',
                name: 'Roles',
                path: '/admin/roles',
                icon: createElement(SolutionOutlined),
                access: {
                    hasRole: ['admin'],
                },
            },
        ],
    },
];

export default PageRoutes;

export function filterRoute(route: PageRoute, session: Session): PageRoute | null {
    if (route.type === 'group') {
        if (!accessible(session, route.access)) return null;
        return {
            ...route,
            children: route.children
                .map((subroute) => filterRoute(subroute, session) as SingleRoute)
                .filter(isDefined),
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
    if (opt.disabled) return false;

    const appRoles = session.roles.map((e) => e.name);
    const checkRole =
        opt.hasRole && opt.hasRole.findIndex((role) => appRoles.includes(role)) !== -1;
    return checkRole;
}

export type PageRoute = GroupRoute | SingleRoute;

interface BaseRoute {
    name: string;
    roles?: string[];
    icon?: React.ReactNode;
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
    disabled?: boolean;
    hasRole?: string[];
    groupOnly?: boolean;
}
