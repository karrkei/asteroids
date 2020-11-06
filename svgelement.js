"use strict";
/**
 * a little wrapper for creating SVG elements and getting/setting their attributes
 * and observing their events.
 * inspired by d3.js (http://d3js.org)
 */
var Elem = /** @class */ (function () {
    /**
     * @param svg is the parent SVG object that will host the new element
     * @param tag could be "rect", "line", "ellipse", etc.
     */
    function Elem(svg, tag, parent) {
        if (parent === void 0) { parent = svg; }
        this.elem = document.createElementNS(svg.namespaceURI, tag);
        parent.appendChild(this.elem);
    }
    Elem.prototype.attr = function (name, value) {
        if (typeof value === 'undefined') {
            return this.elem.getAttribute(name);
        }
        this.elem.setAttribute(name, value.toString());
        return this;
    };
    /**
     * @returns an Observable for the specified event on this element
     */
    Elem.prototype.observe = function (event) {
        return Observable.fromEvent(this.elem, event);
    };
    return Elem;
}());
