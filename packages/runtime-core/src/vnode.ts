/**
 * 用于创建vnode
 * @param type 传入的类型，如果是组件则为object，如果是string，就是节点
 * @param props attribute属性或props
 * @param children 子节点
 * @returns  返回一个vnode
 */
export function createVNode(type, props?, children?) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode
}