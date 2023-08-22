import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import config from '_config';
import { IMAGE_FILE_EXT } from '_utils/constants';

const sharedAssetDir = config.directory.shared;
const TICKET_DIR = 'tickets';
const WORKSPACES_DIR = 'workspace';
const WORKLOGS_DIR = 'worklog';
const REQUESTOR_DIR = 'requestor';

// tickets\230221000001\workspace\2\worklog\7\requestor
export function scanAssets(
    tc: DTO.Ticket,
    workspaces: DTO.AgentWorkspace[]
): ScannedAsset {
    const root = join(sharedAssetDir, TICKET_DIR, String(tc.no));

    const assets: string[] = [];
    const worklogs: map<WorklogAsset> = {};

    if (!existsSync(root)) return { assets, worklogs };

    // /<shared>/tickets/<tc-no>/files*
    for (const file of readdirSync(root, 'utf8')) {
        const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
        // if (!IMAGE_FILE_EXT.includes(ext)) continue;
        assets.push(getPath(tc, file));
    }

    for (const ws of workspaces) {
        // /<shared>/tickets/<tc-no>/workspace/<ws-id>/worklog/<wl-id>
        for (const wl of ws.worklogs) {
            const wlPath = join(
                root,
                WORKSPACES_DIR,
                ws.id + '',
                WORKLOGS_DIR,
                wl.id + ''
            );

            const wlReqPath = join(wlPath, REQUESTOR_DIR);

            if (existsSync(wlPath)) {
                worklogs[wl.id] ||= { assets: [], requestor: [] };
                for (const file of readdirSync(wlPath, 'utf8')) {
                    const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
                    worklogs[wl.id].assets.push(getPath(tc, file, ws, wl));
                }
            }

            if (existsSync(wlReqPath)) {
                worklogs[wl.id] ||= { assets: [], requestor: [] };
                for (const file of readdirSync(wlReqPath, 'utf8')) {
                    const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
                    worklogs[wl.id].requestor.push(getPath(tc, file, ws, wl, true));
                }
            }
        }
    }

    return { assets, worklogs };
}

function getPath(
    tc: DTO.Ticket,
    file: string,
    ws?: DTO.AgentWorkspace,
    wl?: DTO.AgentWorklog,
    requestor = false
) {
    const base = `${TICKET_DIR}/${tc.no}`;
    if (ws && wl) {
        const baseWl = `${base}/${WORKSPACES_DIR}/${ws.id}/${WORKLOGS_DIR}/${wl.id}`;
        if (!requestor) return `${baseWl}/${file}`;
        return `${baseWl}/${REQUESTOR_DIR}/${file}`;
    }
    return `${base}/${file}`;
}

export interface ScannedAsset {
    assets: string[];
    worklogs: map<WorklogAsset>;
}
export interface WorklogAsset {
    assets: string[];
    requestor: string[];
}
