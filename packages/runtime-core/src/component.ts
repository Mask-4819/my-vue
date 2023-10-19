import { isObject } from "@my-vue/shared";

export function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type
    };
    return component;
};

/**
 * 初始化设置组件内容
 * @param instance 组件的实例，vnode
 */
export function setupComponent(instance) {
    // TODO
    // initProps() 初始化props传参
    // initSlots() 初始化slots插槽
    setupStatefulComponent(instance);
}
/**
 * 
 * @param instance { type, props, children }, 
 * type: 其中type为组件 export出的所有内容
 * props: 为组件传递的参数
 * 
 */
function setupStatefulComponent(instance) {
    // 获取组件
    const Component = instance.type;
    // 获取组件中的 setup
    const { setup } = Component;
    // 如果setup存在，则处理setup的结果
    if (setup) {
        // 获取setup 执行返回的结果
        const setupResult = setup();
        handleSetupResult(instance, setupResult)
    }
}
/**
 * 处理setup返回的内容
 * @param instance 
 * @param setupResult 
 */
function handleSetupResult(instance, setupResult) {
    if (isObject(setupResult)) {
        // 如果setup返回的是对象，则在原型下
        instance.setupState = setupResult
    }
    // 完成组件的setup阶段
    finishComponentSetup(instance);
}
// 完成组件的setupe流程
function finishComponentSetup(instance) {
    // 提取组件的内容
    const Component = instance.type;
    // 将组件的render赋值给实例的render，用于组件后续的挂载
    instance.render = Component.render;
}
