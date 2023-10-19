import { hasChanged, isObject } from "@my-vue/shared"
import { Dep, createDep } from "./dep"
import { ReactiveEffect, isTracking, trackEffects, triggerEffects } from "./effect"
import { isReactive, reactive, Target } from './reactive';

declare const RefSymbol: unique symbol
export interface Ref<T = any> {
    value: T
    /**
     * Type differentiator only.
     * We need this to be in public d.ts but don't want it to show up in IDE
     * autocomplete, so we use a private Symbol instead.
     */
    [RefSymbol]: true
}
type RefBase<T> = {
    deps?: Dep
    value: T
}
// ref方法
export function ref(value?: unknown) {
    return createRef(value)
}

// 用于创建并返回ref的方法
export function createRef(rawValue: any) {
    let _ref = new RefImpl(rawValue);
    return _ref;
}

/**
 *  用于创建ref的接口类
 *  由于ref调用的时候，总是有一个 (.value)，所以使用class的getter value方式去处理
 */
class RefImpl<T> {
    private _value: T // 内部属性值
    private _rawValue: T;
    public deps?: Dep = undefined // 依赖收集的数组
    public readonly __v_isRef = true
    constructor(value: T) {
        this._rawValue = value;
        //  响应式转化，如果ref中传入的是独享类型，则进行reactive的转化
        this._value = convert(value);
    }
    // getter，用于属性的获取，依赖的收集，.value方式获取数据的根本所在
    get value() {
        trackRefValue(this);
        return this._value;
    }
    // setter
    set value(newVal) {
        if (hasChanged(this._rawValue, newVal)) {
            this._value = convert(newVal);
            this._rawValue = newVal;
            triggerRefValue(this);
        }
    }
}
// 判断是否是ref
export function isRef(ref) {
    return !!ref.__v_isRef;
}
// ref解开
export function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}

// reactive转化
function convert(value) {
    return isObject(value) ? reactive(value) : value
}

// 收集ref的依赖
export function trackRefValue(ref: RefBase<any>) {
    // 如果不是可收集的话，直接返回空
    if (!isTracking()) return;
    // 
    const effects = ref.deps || (ref.deps = createDep());
    // 收集 ref中的deps依赖
    trackEffects(effects)
}

// 触发ref的依赖
export function triggerRefValue(ref: RefBase<any>) {
    // 用容器作为暂时处理,可以避免无限递归(跟之前的reactive一样的)
    const effects: ReactiveEffect[] = [];
    const { deps } = ref;
    //遍历获取
    deps?.forEach((item) => {
        effects.push(item)
    });
    triggerEffects(effects)
}

// 这里没有处理 objectWithRefs 是 reactive 类型的时候
// TODO reactive 里面如果有 ref 类型的 key 的话， 那么也是不需要调用 ref.value 的
export function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, shallowUnwrapHandlers)
}


// 这个函数的目的是
// 帮助解构 ref
// 比如在 template 中使用 ref 的时候，直接使用就可以了
// 例如： const count = ref(0) -> 在 template 中使用的话 可以直接 count
// 解决方案就是通过 proxy 来对 ref 做处理
const shallowUnwrapHandlers: ProxyHandler<any> = {
    // 进ref进行解包，如果是ref，返回.value， 如果不是ref，直接返回结果
    get: (target, key, receiver) => unRef(Reflect.get(target, key, receiver)),
    set: (target, key, value, receiver) => {
        // 获取修改前的值
        const oldValue = target[key];
        // 如果修改前的是ref，并且修改后重新赋值的不是ref，则直接修改ref的值
        if (isRef(oldValue) && !isRef(value)) {
            oldValue.value = value
            return true
        } else {
            // 如果都是ref修改，那就直接触发修改
            return Reflect.set(target, key, value, receiver)
        }
    }
}
