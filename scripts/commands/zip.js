// import { exec, execSync } from 'child_process';
// import { join } from 'path';
const { createCommand } = require("commander");
const { exec, execSync } = require("child_process");
const { existsSync, rmSync } = require("fs");
const { ROOT } = require("../constants");

const ZipCmd = createCommand("zip").action(action);
module.exports = ZipCmd;

function action() {
    console.log('compress build into tar.gz');
    // const buildDir = join(__dirname, '..', '.next');
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    function padStart(n, len = 2, fill = "0") {
        const s = String(n);
        return s.padStart(len, fill);
    }

    const dateStr = [year, padStart(month), padStart(day)].join("");
    const archieveName = `mars-ui.${dateStr}.tar.gz`;

    if (existsSync(archieveName)) rmSync(archieveName);

    execSync(`tar -cf ${archieveName} -z .next/standalone`, {
        cwd: ROOT,
        stdio: "pipe",
    });
}
