#! /usr/bin/env node

import * as chalk from "chalk";
import * as yargs from "yargs";
import { getSVG } from "../core";
import * as fs from 'fs';

(async () => {

    try {

        if (yargs.argv.help) {
            console.log(chalk.yellowBright("tsuml --glob ./src/**/*.ts"));
        }

        const pattern: string | undefined = yargs.argv.glob as string;
        const outFileName: string = yargs.argv.o as any || 'out.svg'

        if (!pattern) {
            console.log(chalk.redBright("Missing --glob"));
        } else {
            const svg = getSVG("./tsconfig.json", pattern);
            fs.writeFile(outFileName,svg,(err) => {
                if(err) {
                    console.log(chalk.redBright("Error writing file: " + err));
                }
            });
           
        }

    } catch(e) {
        console.log(chalk.redBright(e),e);
    }

})();
