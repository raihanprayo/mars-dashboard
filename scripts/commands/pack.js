const { createCommand } = require("commander");
const { ROOT } = require("../constants");
const { join } = require("path");
const { readdirSync, cpSync, existsSync, rmSync, rmdirSync } = require("fs");

const PackCmd = createCommand("pack").action(action);
module.exports = PackCmd;

function action() {
    console.log('packing up build...');

    const standaloneDir = join(ROOT, ".next", "standalone");
    const publicDir = join(ROOT, "public");
    const staticDir = join(ROOT, ".next", "static");

    const targetPublic = join(standaloneDir, "public");
    const targetStatic = join(standaloneDir, ".next", "static");

    if (existsSync(targetPublic))
        rmdirSync(targetPublic, { maxRetries: 3, retryDelay: 200 });
    if (existsSync(targetStatic))
        rmdirSync(targetStatic, { maxRetries: 3, retryDelay: 200 });

    cpSync(publicDir, targetPublic, { force: true, recursive: true });
    cpSync(staticDir, targetStatic, { force: true, recursive: true });
}
