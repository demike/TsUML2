import { Argv } from "yargs";

export class TsUML2Settings {
    /**
     * required
     */
    glob: string = ""; 

    /**
     * the svg output file (with relative or absolute path)
     */
    outFile: string = "out.svg";

    /**
     * show property types
     */
    propertyTypes= true;

    /**
     * show private, protected, public, static modifiers
     */
    modifiers = true;

    /**
     * nomnoml layouting and styling options
     */
    nomnoml: string[] = [];


    /**
     * parses a json file and merges in the provided options
     * @param json 
     */
    formJSON(json: string) {
        Object.apply(this,JSON.parse(json));
    }

    fromArgs(yargs: Argv<{}>) {

        const argv = yargs.option('glob', {
            alias: "g",
            describe: "pattern to match the source files (i.e.: ./src/**/*.ts)",
            string: true,
            required: true
        }).option('outFile', {
            alias: "o",
            describe: "the path to the output file",
            default: "out.svg",
        }).option('propertyTypes', {
            default: true,
            describe: "show property types and method return types",
            boolean: true
        }).option('modifiers', {
            default: true,
            describe: "show modifiers like public,protected,private,static",
            boolean: true
        }).option('nomnoml', {
            describe: "nomnoml layouting and styling options (an array of strings, each representing a nomnoml line), i.e.: --nomnoml \"#arrowSize: 1\" \"#.interface: fill=#8f8 dashed\" ",
            array: true,
            string: true
        }).option('config', {
            describe: "path to a json config file (command line options can be provided as keys in it)",
            string: true
        }).argv;


        
        if (argv.config) {
            //parse and apply the config file
        }

        if(argv.glob) {
            this.glob = argv.glob;
        }
        if(argv.outFile) {
            this.outFile = argv.outFile;
        }
       
        if(argv.nomnoml) {
            this.nomnoml = argv.nomnoml;
        }

        if(argv.modifiers !== undefined) {
            this.modifiers = argv.modifiers;
        }

        if(argv.propertyTypes !== undefined) {
            this.propertyTypes = argv.propertyTypes;
        }

    }
}

export const SETTINGS = new TsUML2Settings();