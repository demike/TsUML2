#! /usr/bin/env node

import * as chalk from "chalk";
import * as yargs from "yargs";
import { createNomnomlSVG } from "../core";
import { SETTINGS } from "../core/tsuml2-settings";

(async () => {

    try {

        SETTINGS.fromArgs(yargs);

        if (SETTINGS.glob.length === 0) {
            console.log(chalk.redBright("Missing --glob"));
        } else {
            createNomnomlSVG(SETTINGS);
        }

    } catch(e) {
        console.log(chalk.redBright(e),e);
    }

})();
