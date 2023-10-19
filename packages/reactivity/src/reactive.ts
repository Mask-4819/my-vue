import { mutableHandlers, readonlyHandlers } from "./baseHandlers"

export const enum ReactiveFlags {
    SKIP = '__v_skip',
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly',
    IS_SHALLOW = '__v_isShallow',
    RAW = '__v_raw'
}

export interface Target {
    [ReactiveFlags.SKIP]?: boolean
    [ReactiveFlags.IS_REACTIVE]?: boolean
    [ReactiveFlags.IS_READONLY]?: boolean
    [ReactiveFlags.IS_SHALLOW]?: boolean
    [ReactiveFlags.RAW]?: any
}
// 存储reactive转换的容器
export const reactiveMap = new WeakMap<Target, any>();
// reactive方法
export function reactive(target: object) {
    // 创建响应式对象并返回
    return createReactiveObject(target, reactiveMap, mutableHandlers)
}
// 检测是否为reactive
export function isReactive(value: unknown): boolean {
    return !!(value as Target)[ReactiveFlags.IS_REACTIVE]
}

// 存储reactive转换的容器
export const readonlyMap = new WeakMap<Target, any>();
// readonly方法
export function readonly(target: object) {
    // 创建响应式对象并返回
    return createReactiveObject(target, readonlyMap, readonlyHandlers)
}
// 检测是否只读
export function isReadonly(value: unknown): boolean {
    return !!(value as Target)[ReactiveFlags.IS_READONLY]
}
// 是否是代理对象
export function isProxy(value: unknown): boolean {
    // reactive和readonly都是代理对象
    return isReactive(value) || isReadonly(value)
}

/**
 * 
 * @param target 需要响应式转化的对象
 * @param proxyMap 响应式存储对象
 * @param baseHandlers proxyHandler
 */
function createReactiveObject(
    target: Target,
    proxyMap: WeakMap<Target, any>,
    baseHandlers: ProxyHandler<any>,
) {
    // 根据对象去获取代理对象
    const existingProxy = proxyMap.get(target);
    // 如果存在，直接返回(无需进行重新代理)
    if (existingProxy) return existingProxy;
    // 代理转化
    const proxy = new Proxy(target, baseHandlers);
    // 存储起来，便重复代理
    proxyMap.set(target, proxy);
    // 返回代理的内容
    return proxy;
}


export function toRaw(observed) {
    const raw = observed[ReactiveFlags.RAW];
    return raw ? raw : observed;
}