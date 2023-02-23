#!/usr/bin/env node

// 需要解决的问题：
// 1. 【P0】解决 exclude 文件夹或文件问题，要支持相对路径的方式
// 2. 【P1】解决没有办法对单个文件进行 tsc-check 的问题
// 3. 【P2】近似 ts 原生的输出
// 4. 【Nice To Have】自定义输出？

import chalk from 'chalk';
import minimatchAll from "minimatch-all";
import path from 'path';
import fs from "fs";
import formatOutput from './output.js'
import { runSync, readJsonFile, isDir, randomChars } from "./lib.js";

function tscCheck() {
    const args = process.argv.slice(2);
    const argsProjectIndex = args.findIndex(arg => ['-p', '--project'].includes(arg));
    const tsconfigPath = argsProjectIndex !== -1 ? args[argsProjectIndex + 1] : "tsconfig.json";
    const tsconfig = readJsonFile(tsconfigPath);
    const errorExclude = Array.isArray(tsconfig.smartTscErrorExclude) ? tsconfig.smartTscErrorExclude : []
    const errorExcludePaths = errorExclude.map((path) =>
        isDir(path) ? `${path}/**` : path
    );

    const files = args.filter(file => /\.(ts|tsx)$/.test(file))

    let tmpTsConfigPath = '';

    let restArg = [...args];

    if (argsProjectIndex !== -1) {
        restArg.splice(argsProjectIndex, 2)
    }

    if (files.length) {
        restArg = restArg.filter(arg => !files.includes(arg));
        tmpTsConfigPath = path.resolve(`tsconfig.${randomChars()}.json`)
        const tmpTsConfig = {
            ...tsconfig,
            compilerOptions: {
                ...tsconfig.compilerOptions,
                skipLibCheck: true,
            },
            files,
            include: [],
            includes: []
        }

        fs.writeFileSync(tmpTsConfigPath, JSON.stringify(tmpTsConfig, null, 2))
    }

    const argsSmartIncludeIndex = restArg.findIndex(arg => arg === '--smart-include');
    let smartTscIncludePaths = [];
    if (argsSmartIncludeIndex !== -1) {
        smartTscIncludePaths = restArg[argsSmartIncludeIndex + 1].split(',').map((path) => isDir(path) ? `${path}/**`: path);
        restArg.splice(argsSmartIncludeIndex, 2)
    }

    const tsc = runSync(['-p', tmpTsConfigPath || tsconfigPath, ...restArg], false);
    const lines = tsc.stdout.split("\n");
    const regexp = /^(?<filepath>.*)\((?<line>\d+),(?<column>\d+)\): (?<category>.*) (?<type>TS\d+): (?<message>.*)$/gm;

    const errors = [];
    lines.forEach((line) => {
        const matches = regexp.exec(line.trim());
        regexp.lastIndex = 0;
        if (matches) {
            const [output, filepath, line, column, category, type, message] =
                matches;
            const error = {
                output,
                filepath,
                line: parseInt(line),
                column: parseInt(column),
                category,
                type,
                message,
            };
            
            if (!smartTscIncludePaths.length) {
                if (!minimatchAll(filepath, errorExcludePaths)) {
                    errors.push(error);
                }
            } else {
                if (minimatchAll(filepath, smartTscIncludePaths) && !minimatchAll(filepath, errorExcludePaths)) {
                    errors.push(error);
                }
            }
        }
    });

    if (tmpTsConfigPath) {
        fs.unlinkSync(tmpTsConfigPath)
    }

    if (errors.length === 0) {
        process.exitCode = 0; // success
        console.log(chalk.green("No TypeScript errors were found."));
    } else {
        process.exitCode = 1; // error
        formatOutput(errors);
        console.log(chalk.yellow(`${errors.length} TypeScript errors were found.`));
    }
}

tscCheck();