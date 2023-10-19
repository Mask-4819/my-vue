import { createVNode } from "./vnode";

/**
 * 
 * @param type 
 * @param props 
 * @param children 
 * @returns 
 */
export function h(type, props?, children?) {
    return createVNode(type, props, children);
}
