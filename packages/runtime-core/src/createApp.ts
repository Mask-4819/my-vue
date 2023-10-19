import { render } from "./renderer";
import { createVNode } from "./vnode"

/**
 * 
 * @param rootComponent 组件内容
 * @returns  返回一个mount，用于后续的挂载调用
 */
export function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 根据传入的组件返回vnode,用于挂载
            const vnode = createVNode(rootComponent);
            // 渲染得到的vnode
            render(vnode, rootContainer);
        }
    }
}