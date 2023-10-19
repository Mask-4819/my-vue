import { isArray, isObject } from "@my-vue/shared";
import { createComponentInstance, setupComponent } from "./component";


/**
 *  render执行渲染
 * 
 * @param vnode vnode
 * @param container 挂载的容器
 */
export function render(vnode, container) {
    // 提交操作
    patch(vnode, container);
}

/**
 * 提交更新
 * @param vnode 
 * @param container 
 */
function patch(vnode, container) {
    const { type } = vnode;
    // 如果是string类型，则说明是 element，进行element流程的处理
    if (typeof type === 'string') {
        processElement(vnode, container);
    } else if (isObject(type)) {
        // 如果是object类型，则说明是组件，进行组件流程的处理
        processComponent(vnode, container);
    }
}
/**
 * 处理component组件的问题
 * @param vnode 
 * @param container 
 */
function processComponent(vnode, container) {
    // 挂载组件
    mountComponent(vnode, container);
}
/**
 * 处理element流程
 * @param vnode 
 * @param container 
 */
function processElement(vnode, container) {
    // 挂载element
    mountElement(vnode, container);
}

/**
 * 挂载element
 * @param vnode 
 * @param container 
 * props的处理问题，(如class设置为数组的问题[],或者是对象{}),
 */
function mountElement(vnode, container) {
    const { type, children, props } = vnode
    const el = document.createElement(type);
    if (typeof children === 'string') {
        el.textContent = children;
    } else if (isArray(children)) {
        mountChildren(vnode, container);
    }
    for (const key in props) {
        el.setAttribute(key, props[key])
    }
    container.append(el);
}

function mountChildren(vnode, container) {
    vnode?.children?.forEach(v => patch(v, container));
}
/**
 * 挂载组件
 * @param vnode 
 * @param container 
 * createComponentInstance:
 *  1.
 */
function mountComponent(vnode, container) {
    // 根据vode创建组件实例, 
    const instance = createComponentInstance(vnode);
    // 进行组件参数的初始化设置(最后一步将redner提取到instance中)
    setupComponent(instance);
    // 进行组件的拆包渲染过程
    setupRenderEffect(instance, container);
}

/**
 * 进行组件拆包渲染的过程，主要是处理组件内部的各个需要渲染的内容
 * 因为组件本身是一个对象，所以需要拿到组件内的 element 内容进行渲染的提交
 * @param instance 组件实例
 * @param container 渲染的容器
 */
function setupRenderEffect(instance, container) {
    /**
     * 获取vue中的 render方法包含的html渲染内容
     * 触发 h 的调用 ->  createVNode处理传递的 props 和 children
     * subTree 为 h中包含的东西
     */
    const subTree = instance.render();
    // 递交渲染流程
    patch(subTree, container)
}