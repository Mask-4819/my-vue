import { isFunction } from "@my-vue/shared"
import { Dep } from "./dep";
import { ReactiveEffect } from "./effect";
import { triggerRefValue } from "./ref";

class ComputedRefImpl<T> {
    public dep?: Dep = undefined // 依赖存储的容器
    private _value: any // 内部value的属性
    public readonly effect: ReactiveEffect<T> //
    public readonly __v_isRef = true
    public _dirty = true
    constructor(
        getter: ComputedGetter<T>,
        private readonly _setter: ComputedSetter<T>
    ) {
        this.effect = new ReactiveEffect(getter, () => {
            // scheduler调度执行
            if (!this._dirty) {
                this._dirty = true;
                triggerRefValue(this);
            }
        })
    }

    get value() {
        triggerRefValue(this);
        if (this._dirty) {
            this._dirty = false;
            this._value = this.effect.run();
        }
        return this._value
    }
    set value(newValue: T) {
        this._setter(newValue)
    }
}



export type ComputedGetter<T> = (...args: any[]) => T
export type ComputedSetter<T> = (v: T) => void
// 计算属性
export function computed<T>(getterOrOptions) {

    // 如果传入的参数是函数，则说明只有getter
    let onlyGetter = isFunction(getterOrOptions);
    let getter: ComputedGetter<T>
    let setter: ComputedSetter<T>
    // 如果只有getter的话，setter在触发的时候就添加提醒功能。
    if (onlyGetter) {
        getter = getterOrOptions;
        setter = () => {
            console.warn('Write operation failed: computed value is readonly')
        }
    } else {
        // 直接获取传递进来的get和set方法
        getter = getterOrOptions.get
        setter = getterOrOptions.set
    }
    // 创建一个ComputedRefImpl的实例
    const cRef = new ComputedRefImpl(getter, setter);
    // 返回计算属性的结果
    return cRef
}

