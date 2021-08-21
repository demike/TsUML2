<img src="./assets/logo.png" width="150" align="right" />

# TsUML2 [![npm version](https://badge.fury.io/js/tsuml2.svg)](https://badge.fury.io/js/tsuml2) [![Known Vulnerabilities](https://snyk.io/test/npm/tsuml2/badge.svg)](https://snyk.io/test/npm/tsuml2)

Generate UML diagram for your TypeScript applications powered by nomnoml.

TsUML2 works offline, so no third party servers are involved.



## Installation

```sh
npm install -g tsuml2
```

## Usage

```
tsuml2 --glob "./src/**/*.ts" 
```
To avoid getting unwanted interfaces / classes you might want to exclude d.ts and spec.ts files:
```
tsuml2 --glob "./src/**/!(*.d|*.spec).ts"
```

### Options
```
  --help           Show help                                           [boolean]
  --version        Show version number                                 [boolean]
  --glob, -g       pattern to match the source files (i.e.: ./src/**/*.ts)
                                                             [string] [required]
  --tsconfig       the path to tsconfig.json file   [default: "./tsconfig.json"]
  --outFile, -o    the path to the output file              [default: "out.svg"]
  --propertyTypes  show property types and method return types
                                                       [boolean] [default: true]
  --modifiers      show modifiers like public,protected,private,static
                                                       [boolean] [default: true]
  --typeLinks      add links for classes, interface, enums that point to the
                   source files                        [boolean] [default: true]
  --nomnoml        nomnoml layouting and styling options (an array of strings,
                   each representing a nomnoml line), i.e.: --nomnoml
                   "#arrowSize: 1" "#.interface: fill=#8f8 dashed"       [array]
  --config         path to a json config file (command line options can be
                   provided as keys in it)                              [string]
```

an example config.json could look like:
```json
{
  "glob": "./src/**/!(*.d|*.spec).ts",
  "modifiers": false,
  "nomnoml": ["#arrowSize: 1.5","#.interface: fill=#8f8 dashed"]
}
```

> **_NOTE:_** command line arguments override those provided in config.json


## Examples
The diagram generated for the code under the [demo folder](https://github.com/demike/TsUML2/tree/master/src/demo) looks as follows:

![](/assets/uml_diagram.svg?sanitize=true)

A complex command line parameter example:
```
./tsuml2 --glob=./src/demo/**/*.ts --nomnoml "#arrowSize: 1.5" "#.interface: fill=#8f8 dashed" --modifiers false --propertyTypes false
```

![](/assets/alt_uml_diagram.svg?sanitize=true)

With type links enabled: [live example](https://raw.githubusercontent.com/demike/TsUML2/master/assets/uml_diagram.svg)

![](/assets/type_links.gif)
