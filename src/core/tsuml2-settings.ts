export class TsUML2Settings {
    /**
     * the glob pattern defining a scope for typescript files to include (i.e.: a subfolder of the project)
     * required
     */
    glob: string = ""; 

    /**
     * the path to the tsconfig.json file
     */
    tsconfig?: string; // = "./tsconfig.json";


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
     * add type links
     */
    typeLinks = true;

    /**
     * nomnoml layouting and styling options
     */
    nomnoml: string[] = [];


    /**
     * output file contain the DSL (nomnoml)
     */
    outDsl: string = "";

    /**
     * output file containing mermaid DSL
     */
    outMermaidDsl: string = "";

    /**
     * mermaid layouting and styling options
     */
    mermaid: string[] = [];

    /**
     * show associations between classes, interfaces, types and their member types
     */
    memberAssociations = false;

    /**
     * show only exported types, classes, interfaces, enums
     */
    exportedTypesOnly = false;
}

/*
    function isUserSetOption(option: string,yargs: Argv<{}>) {
        function searchForOption(option:string) {
          return (process.argv.indexOf(option) > -1);
        }
    
        if (searchForOption(`-${option}`) || searchForOption(`--${option}`))
          return true;
    
        // Handle aliases for same option
        for (let aliasIndex in yargs.choices().parsed.aliases[option]) {
          let alias = yargs.choices().parsed.aliases[option][aliasIndex];
          if (searchForOption(`-${alias}`) || searchForOption(`--${alias}`))
            return true;
        }
    
        return false;
    }
*/

