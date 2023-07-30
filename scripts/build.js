// import { exec, execSync } from 'child_process';
// import { join } from 'path';
const { exec, execSync } = require('child_process');
const { join } = require('path')

const ROOT = join(__dirname, '..');

// const buildDir = join(__dirname, '..', '.next');
const date = new Date();
const day = date.getDate();
const month = date.getMonth()+1;
const year = date.getFullYear();

function padStart(n, len = 2, fill = '0') {
    const s = String(n);
    return s.padStart(len, fill);
}

const dateStr = [
    year,
    padStart(month),
    padStart(day),
].join('');
const archieveName = `.next.${dateStr}.tar.gz`;
execSync(`tar -cf ${archieveName} -z .next`, {
    cwd: ROOT,
    stdio: 'pipe',
});
