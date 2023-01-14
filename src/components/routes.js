"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterRoute = void 0;
const icons_1 = require("@ant-design/icons");
const common_1 = require("@mars/common");
const react_1 = require("react");
const Groups = [];
const PageRoutes = [
    {
        type: 'group',
        name: 'General',
        icon: (0, react_1.createElement)(icons_1.BookOutlined),
        children: [
            {
                type: 'page',
                name: 'Tickets',
                path: '/',
                icon: (0, react_1.createElement)(icons_1.AuditOutlined),
            },
            {
                type: 'page',
                name: 'Inbox',
                path: '/inbox',
                icon: (0, react_1.createElement)(icons_1.ScheduleOutlined),
            },
            {
                type: 'page',
                name: 'Reports',
                path: '/reports',
                icon: (0, react_1.createElement)(icons_1.BarChartOutlined),
            },
            {
                type: 'page',
                name: 'Leaderboards',
                icon: (0, react_1.createElement)(icons_1.TeamOutlined),
            },
        ],
    },
    {
        type: 'group',
        name: 'Application',
        icon: (0, react_1.createElement)(icons_1.ApartmentOutlined),
        children: [
            {
                type: 'page',
                name: 'Setting',
                icon: (0, react_1.createElement)(icons_1.SettingOutlined)
            }
        ],
    },
];
exports.default = PageRoutes;
function filterRoute(route, session) {
    if (route.type === 'group') {
        if (!accessible(session, route.access))
            return null;
        return {
            ...route,
            children: route.children
                .map((subroute) => filterRoute(subroute, session))
                .filter(common_1.isDefined),
        };
    }
    else {
        if (!accessible(session, route.access))
            return null;
        return {
            ...route,
        };
    }
}
exports.filterRoute = filterRoute;
function accessible(session, opt) {
    if (!opt)
        return true;
    if (opt.disabled)
        return false;
    const appRoles = session.roles.map((e) => e.name);
    const checkRole = opt.hasRole && opt.hasRole.findIndex((role) => appRoles.includes(role)) !== -1;
    return checkRole;
}
