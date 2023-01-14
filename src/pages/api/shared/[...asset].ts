import { HttpHeader, isArr } from '@mars/common';
import { existsSync, readFileSync } from 'fs';
import { NextApiHandler } from 'next';
import getConfig from 'next/config';
import { detectContentType } from 'next/dist/server/image-optimizer';
import { join } from 'path';

const SharedAssetRoute: NextApiHandler = (req, res) => {
    const publicConfig = getConfig().publicRuntimeConfig;
    const sharedAssetDir: string = publicConfig.directory.shared;

    const reqPath = isArr(req.query.asset) ? req.query.asset.join('/') : req.query.asset;

    console.log(req.query);

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
    // res.setHeader(200, {
    //     [HttpHeader.CONTENT_TYPE]: detectContentType(buff),
    //     'Content-Length': buff.length,
    // });
    res.setHeader(HttpHeader.CONTENT_TYPE, detectContentType(buff));
    res.setHeader(HttpHeader.CONTENT_LENGTH, buff.length);
    res.send(buff);
};

export default SharedAssetRoute;
// const mapMediaType = {
//     '.jpeg': detectContentType()
// }
