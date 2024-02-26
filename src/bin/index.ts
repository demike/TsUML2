#! /usr/bin/env node

import chalk from "chalk";
import { createDiagram } from "../core";
import { TsUML2Settings } from "../core/tsuml2-settings";
import { parseSettingsFromArgs } from "../core/parse-settings";

(async () => {
    try {

        const settings = new TsUML2Settings();
        parseSettingsFromArgs(settings);

        if (settings.glob.length === 0) {
            console.log(chalk.redBright("Missing --glob"));
        } else {
            createDiagram(settings);
        }

    } catch(e) {
        console.log(chalk.redBright(e),e);
    }
})();
