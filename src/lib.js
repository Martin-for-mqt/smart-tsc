import fs from "fs";
import chalk from "chalk";
import { spawnSync } from "child_process";
import path from 'path';

function runSync(args, verbose = true) {
    console.log(`Running ${chalk.yellow("tsc " + args.join(' '))}`);
    const process = spawnSync("tsc", args, {
        shell: true,
        encoding: "utf8",
    });
    if (verbose) {
        console.log(chalk.green(process.stdout));
    }
    return process;
}

function readJsonFile(relativePath, verbose = true) {
    const absolutePath = path.resolve(relativePath);
    if (verbose) {
        console.log(`Trying to read the file ${chalk.yellow(absolutePath)}`);
    }
    return JSON.parse(fs.readFileSync(absolutePath));
}

function isDir(relativePath) {
    // 使用内置的函数获取绝对路径
    const absolutePath = path.resolve(relativePath);
    try {
        var stat = fs.lstatSync(absolutePath);
        return stat.isDirectory();
    } catch (e) {
        // lstatSync throws an error if path doesn't exist
        return false;
    }
}

const randomChars = () => {
    return Math.random().toString(36).slice(2)
}

export {
    isDir,
    randomChars,
    readJsonFile,
    runSync
}
