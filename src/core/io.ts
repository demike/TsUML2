import * as glob from "glob";
//@ts-ignore
import * as nomnoml from "nomnoml";

export function renderToSVG(dsl: string) {
    return nomnoml.renderSvg(dsl); 
};
