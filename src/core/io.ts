//@ts-ignore
import * as nomnoml from "nomnoml";

/**
 * render an svg from nomnoml DSL
 * @param nomnomlDSL 
 * @returns a string representing the svg
 */
export function renderNomnomlSVG(nomnomlDSL: string) {
    return nomnoml.renderSvg(nomnomlDSL); 
};
