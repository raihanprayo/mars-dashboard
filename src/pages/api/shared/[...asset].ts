import { HttpHeader, isArr } from '@mars/common';
import { existsSync, readFileSync } from 'fs';
import { NextApiHandler } from 'next';
import { detectContentType } from 'next/dist/server/image-optimizer';
import { join } from 'path';
import config from '_config';

const sharedAssetDir = config.directory.shared;
const SharedAssetRoute: NextApiHandler = (req, res) => {
    const reqPath = isArr(req.query.asset) ? req.query.asset.join('/') : req.query.asset;
    const filePath = join(sharedAssetDir, reqPath);
    if (!existsSync(filePath)) {
        res.status(400).json({
            title: 'Not Found',
            message: `File ${reqPath} not found`,
        });
        return;
    }

    // const ext = filePath.slice(filePath.lastIndexOf('.'));
    const buff = readFileSync(filePath);
    res.setHeader(HttpHeader.CONTENT_TYPE, detectContentType(buff));
    res.setHeader(HttpHeader.CONTENT_LENGTH, buff.length);
    res.send(buff);
};

export default SharedAssetRoute;
// const mapMediaType = {
//     '.jpeg': detectContentType()
// }
