import { track, trigger } from "./effect";
import { ReactiveFlags, Target, reactive, reactiveMap, readonly, readonlyMap } from "./reactive";
import { isObject, hasChanged } from "@my-vue/shared";

const get = createGetter();
const readonlyGet = createGetter(true);

// 创建并返回一个get handler
function createGetter(isReadonly = false) {
    return function get(target: Target, key: string | symbol, receiver: object) {

        //  toRaw转化之后的Reactive
        const isExistInReactiveMap = () =>
            key === ReactiveFlags.RAW && receiver === reactiveMap.get(target);
        //  toRaw转化之后的readonly
        const isExistInReadonlyMap = () =>
            key === ReactiveFlags.RAW && receiver === readonlyMap.get(target);

        // 如果key为 IS_REACTIVE, 则表示是在进行isReactive判断。
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly;
        } else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly;
            // 如果是toRaw，则直接返回结果的内容
        } else if (isExistInReactiveMap() || isExistInReadonlyMap()) {
            return target;
        }

        // Reflect.get会返回属性的值
        const res = Reflect.get(target, key, receiver);

        // 如果不是isReadonly, 则进行依赖的收集
        // 因为readonly是不可以被set的，也就是说不需要进行依赖触发，不需要依赖触发则不用进行收集
        if (!isReadonly) {
            track(target, key);
        }

        // 如果返回的属性的值是对象，则进行深度的响应式转化
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    }
}

const set = createSetter();
// 创建并返回一个set handler
function createSetter() {
    return function set(target: object, key: string | symbol, value: unknown, receiver: object): boolean {
        // 获取修改之前的值
        let oldValue = (target as any)[key];
        // 触发值的修改
        const res = Reflect.set(target, key, value, receiver);
        // 如果值发生改变，则触发trigger
        if (hasChanged(oldValue, value)) {
            // 依赖的触发
            trigger(target, key);
        }
        return res;
    }
}
// reactive的handler
export const mutableHandlers: ProxyHandler<object> = {
    get,
    set,
};

export const readonlyHandlers: ProxyHandler<object> = {
    get: readonlyGet,
    set(target, key) {
        console.warn(
            `Set operation on key "${String(key)}" failed: target is readonly.`,
            target
        );
        return true
    }
}