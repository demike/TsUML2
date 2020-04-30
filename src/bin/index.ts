#! /usr/bin/env node

import * as chalk from "chalk";
import * as yargs from "yargs";
import { getSVG } from "../core";
import * as fs from 'fs';
import { SETTINGS } from "../core/tsuml2-settings";

(async () => {

    try {

        SETTINGS.fromArgs(yargs);


        if (SETTINGS.glob.length === 0) {
            console.log(chalk.redBright("Missing --glob"));
        } else {
            const svg = getSVG(SETTINGS.tsconfig, SETTINGS.glob);
            fs.writeFile(SETTINGS.outFile,svg,(err) => {
                if(err) {
                    console.log(chalk.redBright("Error writing file: " + err));
                }
            });
           
        }

    } catch(e) {
        console.log(chalk.redBright(e),e);
    }

})();
