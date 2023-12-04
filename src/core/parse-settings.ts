import yargs from "yargs";
import { TsUML2Settings } from "./tsuml2-settings";
import * as fs  from "fs";


    /**
     * parses a json file and merges in the provided options
     * @param json 
     */
    function fromJSON(settings: TsUML2Settings, json: string) {
        Object.assign(settings,JSON.parse(json));
    }

    export function parseSettingsFromArgs(settings: TsUML2Settings) {

        const argv = yargs.option('glob', {
            describe: "pattern to match the source files (i.e.: ./src/**/*.ts)",
            alias: "g",
            string: true,
            required: true
        }).option('tsconfig',{
            default: settings.tsconfig,
            describe: "the path to tsconfig.json file"
        }).option('outFile', {
            describe: "the path to the output file",
            alias: "o",
            default: settings.outFile,
        }).option('propertyTypes', {
            default: settings.propertyTypes,
            describe: "show property types and method return types",
            boolean: true
        }).option('modifiers', {
            default: settings.modifiers,
            describe: "show modifiers like public,protected,private,static",
            boolean: true
        }).option('typeLinks', {
            default: settings.typeLinks,
            describe: "add links for classes, interface, enums that point to the source files",
            boolean: true
        }).option('nomnoml', {
            describe: "nomnoml layouting and styling options (an array of strings, each representing a nomnoml line), i.e.: --nomnoml \"#arrowSize: 1\" \"#.interface: fill=#8f8 dashed\" ",
            array: true,
            string: true
        }).option('outDsl', {
            describe: "the path to the output DSL file (nomnoml)",
            string: true,
            required: false,
        }).option('outMermaidDsl', {
            describe: "the path to the output mermaid DSL file",
            string: true,
            required: false,
        }).option('memberAssociations', {
            describe: "show associations between classes, interfaces, types and their member types",
            alias: 'm',
            boolean: true,
            required: false,
            default: settings.memberAssociations
        }).option('config', {
            describe: "path to a json config file (command line options can be provided as keys in it)",
            string: true
        }).argv as Partial<TsUML2Settings & { config: string}>;

        if (argv.config) {
            //parse and apply the config file
            const config = fs.readFileSync(argv.config).toString();
            fromJSON(settings, config);
        }

        if(argv.glob) {
            settings.glob = argv.glob;
        }

        if(argv.tsconfig && !(yargs.parsed as any).defaulted.tsconfig) {
            settings.tsconfig = argv.tsconfig;
        }

        if(argv.outFile && !(yargs.parsed as any).defaulted.outFile) {
            settings.outFile = argv.outFile;
        }
       
        if(argv.nomnoml) {
            settings.nomnoml = argv.nomnoml;
        }

        if(argv.modifiers != null && !(yargs.parsed as any).defaulted.modifiers) {
            settings.modifiers = argv.modifiers;
        }

        if(argv.propertyTypes != null && !(yargs.parsed as any).defaulted.propertyTypes) {
            settings.propertyTypes = argv.propertyTypes;
        }

        if(argv.typeLinks != null && !(yargs.parsed as any).defaulted.typeLinks) {
            settings.typeLinks = argv.typeLinks;
        }

        if(argv.outDsl != null && !(yargs.parsed as any).defaulted.outDsl) {
            settings.outDsl = argv.outDsl;
        }

        if(argv.outMermaidDsl != null && !(yargs.parsed as any).defaulted.outMermaidDsl) {
            settings.outMermaidDsl = argv.outMermaidDsl;
        }

        if(argv.memberAssociations != null && !(yargs.parsed as any).defaulted.memberAssociations) {
            settings.memberAssociations = argv.memberAssociations;
        }
    }