import { createDep, Dep } from "./dep";

// 全局 effect 栈
const effectStack: ReactiveEffect[] = [];
let shouldTrack = false; // 依赖是否收集，默认不收集
// depsMap的类型为Set，里面保存的是 Dep
type KeyToDepMap = Map<any, Dep>;
// 全局依赖的存储容器
const targetMap = new WeakMap<any, KeyToDepMap>();
// 全局变量，用于保存当前的 reactiveEffect，用于收集
export let activeEffect: ReactiveEffect | undefined
// 依赖收集
export class ReactiveEffect<T = any> {
    active = true; // 用于stop的判断，避免重复
    public deps: Dep[] = []; // 用于依赖的双向收集
    onStop?: () => void; // onStop的方法
    constructor(
        public fn: () => T,
        public scheduler: EffectScheduler | null = null
    ) { }
    // run 依赖的执行，
    run() {
        // 执行fn，但不进行依赖收集，用于stop后，手动触发依赖
        if (!this.active) return this.fn();
        // 可以开始收集依赖了
        shouldTrack = true;
        // 使用栈的调用，避免出现嵌套effect时，导致的外部effect无法调用到的问题
        if (!effectStack.includes(this)) {
            // 清除副作用的影响， 把所有收集到的 effecet
            cleanupEffect(this);
            // 全局存储当前的实例
            activeEffect = this;
            // 压栈
            effectStack.push(this);
            // 执行当前正在运行的方法，会去触发getter操作
            const res = this.fn();
            // 执行之后弹栈
            effectStack.pop();
            // 将activeEffect指向栈顶
            activeEffect = effectStack[effectStack.length - 1];

            // 重置
            shouldTrack = false;
            return res;
        }
    }
    // stop功能
    stop() {
        // 进行stop之后，将active设置为false，
        // 添加判断条件是为了防止重复执行
        if (this.active) {
            // stop后，清空依赖
            cleanupEffect(this);
            // 执行effect的onStop方法
            if (this.onStop) {
                this.onStop()
            }
            // 设置为fasle，避免再次stop时，执行重复的操作
            this.active = false;
        }
    }
}
/** 
 * 
 *  清空依赖， 用于处理分支切换的问题，
 * @param effect 
 */
function cleanupEffect(effect: ReactiveEffect) {
    // 获取 ReactiveEffect 中保存起来的deps
    let { deps } = effect;
    // 如果有长度
    if (deps.length) {
        console.log("cleanupEffect清空依赖");
        for (let i = 0; i < deps.length; i++) {
            deps[i].delete(effect)
        }
        deps.length = 0;
    }
}
// stop，
export function stop(runner: ReactiveEffectRunner) {
    runner.effect.stop();
}

export type EffectScheduler = (...args: any[]) => any

export interface ReactiveEffectOptions {
    lazy?: boolean
    scheduler?: EffectScheduler
    allowRecurse?: boolean
    onStop?: () => void
}
export interface ReactiveEffectRunner<T = any> {
    (): T
    effect: ReactiveEffect
}

// effect副作用函数
export function effect<T = any>(fn: () => T, options?: ReactiveEffectOptions): ReactiveEffectRunner {
    // 实例化类   
    const _effect = new ReactiveEffect(fn);
    if (options) {
        // 合并配置项 ReactiveEffectOptions
        Object.assign(_effect, options);
    }
    // 如果 lazy为true的时候，就不执行effect传入的fn
    if (!options || !options.lazy) {
        // 执行fn，在此之前可以执行其他的操作
        _effect.run();
    }
    // 将当前实例化的ReactiveEffect进行返回，用于外部手动执行
    let runner = _effect.run.bind(_effect) as ReactiveEffectRunner;
    // 反向关联，用于在返回runnner之后，用于在外部调用
    runner.effect = _effect;
    return runner;
}

/**
 *  依赖的收集：
 *  targetMap:weakMap { taegt: depsMap }
 *      ——> depsMap:Map { key: deps}
 *          ——> deps:Set [activeEffect]
 * 
 * 1、按照上面的结构进行层层的收集
 * 2、activeEffect进行反向收集，用于cleanupEffect
 * @param target 收集的对象
 * @param key 收集的字段
 */
export function track(target: object, key: unknown) {
    // 如果不是收集状态，则不进行收集
    if (!isTracking()) return
    // 获取depsMap: Map
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        // 如果depsMap为空，则创建一个map，并添加到targetMap
        depsMap = new Map();
        targetMap.set(target, depsMap);
    };
    // 获取deps:Set
    let deps = depsMap.get(key);
    if (!deps) {
        // 如果deps获取不到，则直接创建一个set，并添加到depsMap中去
        deps = new Set();
        depsMap.set(key, deps)
    }
    // 提取方法进行复用
    trackEffects(deps);
}
export function trackEffects(deps: Dep) {
    // 如果deps中不包含当前的依赖，则进行收集
    if (!deps.has(activeEffect!)) {
        // 收集当前的 ReactiveEffect的实例
        deps.add(activeEffect!);
        // 反向收集，把deps存储到activeEffect中，用于cleanup
        activeEffect?.deps.push(deps);
    }
}
/**
 * 进行依赖的触发
 *  targetMap:weakMap { taegt: depsMap }
 *      ——> depsMap:Map { key: deps}
 *          ——> deps:Set [activeEffect]
 * 
 * 1、按照上述的数据结构，获取activeEffect
 * 2、effects避免 cleanupEffect导致的递归问题
 * 3、effect !== activeEffect判断，避免 ++导致的递归问题
 * 
 * @param target 触发的对象
 * @param key 触发的对象的关键字
 * @returns 
 */
export function trigger(target: object, key: unknown) {
    // 获取依赖
    let depsMap = targetMap.get(target);
    if (!depsMap) return;
    // 获取收集到的 ReactiveEffect
    let deps = depsMap.get(key);
    // 创建一个新的数组，用于保存依赖
    const effects: ReactiveEffect[] = [];
    if (key !== void 0) {
        deps?.forEach((effect) => {
            // 如果effect与当前的activeEffect不同，则存入effects用于执行(避免 ++)导致的无限递归问题
            if (effect !== activeEffect) {
                effects.push(effect);
            }
        })
    };
    // 触发effect运行
    triggerEffects(createDep(effects));
}

export function triggerEffects(deps: Dep | ReactiveEffect[]) {
    deps?.forEach(effect => {
        if (effect.scheduler) {
            // scheduler 可以让用户自己选择调用的时机
            // 这样就可以灵活的控制调用了
            // 在 runtime-core 中，就是使用了 scheduler 实现了在 next ticker 中调用的逻辑
            effect.scheduler();
        } else {
            // 如果没有调度，则直接运行依赖
            effect.run();
        }
    });
}

export function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
