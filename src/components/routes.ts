import {
    AuditOutlined,
    ScheduleOutlined,
    BarChartOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import { createElement } from 'react';

const PageRoutes: PageRoute[] = [
    {
        name: 'Tickets',
        path: '/',
        icon: createElement(AuditOutlined),
    },
    {
        name: 'Inbox',
        path: '/inbox',
        icon: createElement(ScheduleOutlined),
    },
    {
        name: 'Reports',
        path: '/reports',
        icon: createElement(BarChartOutlined),
    },
    {
        name: 'Leaderboards',
        icon: createElement(TeamOutlined),
    },
];

export default PageRoutes;


export interface PageRoute extends PageRouteChild {
    children?: PageRouteChild[];
}

export interface PageRouteChild {
    name: string;
    path?: string;
    icon?: React.ReactNode;
    badge?: { value: number };
}