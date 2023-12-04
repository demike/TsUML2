#! /usr/bin/env node

import chalk from "chalk";
import { createDiagram } from "../core";
import { SETTINGS } from "../core/tsuml2-settings";
import { parseSettingsFromArgs } from "../core/parse-settings";

(async () => {
    try {

        parseSettingsFromArgs(SETTINGS);

        if (SETTINGS.glob.length === 0) {
            console.log(chalk.redBright("Missing --glob"));
        } else {
            createDiagram(SETTINGS);
        }

    } catch(e) {
        console.log(chalk.redBright(e),e);
    }
})();
