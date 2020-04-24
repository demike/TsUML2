<img src="./assets/logo.png" width="150" align="right" />

# TsUML2

:construction: WORK IN PROGRESS :construction:

Generate UML diagram for your TypeScript applications powered by nomnoml.

TsUML2 works offline, so no third party servers are involved.



## Installation

```sh
npm install -g tsuml2
```

## Usage

```
tsuml2 --glob ./src/**/*.ts 
```
To avoid getting unwanted interfaces / classes you might want to exclude d.ts and spec.ts files:
```
tsuml2 --glob ./src/**/!(*.d|*.spec).ts
```

### Arguments
 - --glob ./src/**/*ts
 - -o result.svg


The diagram generated for the code under the [demo folder](https://github.com/demike/TsUML2/tree/master/src/demo) looks as follows:

![](/assets/uml_diagram.svg?sanitize=true)
