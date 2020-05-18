
//@ts-ignore
import * as nomnoml from "nomnoml";

export function renderNomnomlSVG(dsl: string) {
    return nomnoml.renderSvg(dsl); 
};
