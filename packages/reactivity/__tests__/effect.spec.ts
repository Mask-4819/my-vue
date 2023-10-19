import { it, expect, describe, vi } from 'vitest'
import { effect, track, trigger, stop } from "../src/effect";
import { reactive } from '../src/reactive';

describe('reactivity/effect', () => {
    it('should run the passed function once (wrapped by a effect)', () => {
        // 模拟函数
        const fnSpy = vi.fn(() => { })
        // effect副作用函数
        effect(fnSpy)
        // 副作用函数会被调用一次
        expect(fnSpy).toHaveBeenCalledTimes(1);
    });
    it("test proxy", () => {
        const obj = reactive({
            text: "vue3Effect"
        });
        // 使用effect包裹内容
        effect(() => {
            console.log(obj.text);
        });
        // 进行类型断言
        expect(obj.text).toBe("vue3Effect");
        // 修改值，继续进行断言
        obj.text = "hello wz";
        expect(obj.text).toBe("hello wz");
    });
    it("cleanupEffect", () => {
        const obj = reactive({
            text: "vue3Effect",
            status: true,
        });
        // 使用effect包裹内容
        const fnSpy = vi.fn(() => {
            const test = obj.status ? obj.text : "test";
            console.log(test);
        });
        effect(fnSpy);
        // 进行类型断言
        expect(obj.text).toBe("vue3Effect");
        expect(fnSpy).toHaveBeenCalledTimes(1);
        // 
        // 修改值，继续进行断言
        obj.status = false;
        expect(fnSpy).toHaveBeenCalledTimes(2);
        // 修改text的值，并不会触发effect副作用函数的执行，
        obj.text = "text";
        expect(fnSpy).toHaveBeenCalledTimes(2);
    });
    it("嵌套effect", () => {
        const obj = reactive({
            text: "vue3Effect",
            status: true,
            count: 0
        });
        const fn = () => {
            effect(() => {
                console.log("内层执行:", obj.status);
            });
            console.log("外层执行:", obj.text);
        }
        effect(fn);
        obj.text = 'wz';
    })
    it("避免无限递归 ", () => {
        const obj = reactive({
            text: "vue3Effect",
            status: true,
            count: 0
        });
        let dummy1;
        effect(() => { dummy1 = obj.count });
        expect(dummy1).toBe(0);
        obj.count++;
        expect(dummy1).toBe(1);
    });


    it('should discover new branches when running manually', () => {
        const obj = reactive({
            text: "vue3Effect",
            status: true,
            count: 0
        });
        let dummy
        let run = false
        //  effect返回rennder
        const runner = effect(() => {
            dummy = run ? obj.text : 'other'
        });
        // 断言dummy
        expect(dummy).toBe('other');
        // 执行runner
        runner()
        // dummy的值不变
        expect(dummy).toBe('other');

        // 修改run为true, 由于run不是响应式数据，没有进行依赖的收集，所以dummy依旧不变
        run = true;
        // dummy的值不变
        expect(dummy).toBe('other')

        // 执行runnner，会重新收集依赖
        runner()
        // 由于run修改为true，执行runnner之后，会收集text的依赖
        // 所以dummy的值为vue3Effect
        expect(dummy).toBe('vue3Effect');
        // 修改text的值,发现 text的值有被依赖收集到，所以修改text的值会修改dummy
        obj.text = 'World'
        expect(dummy).toBe('World')
    });

    it('scheduler', () => {
        const obj = reactive({
            text: "vue3Effect",
            status: true,
            count: 0
        });
        let dummy;
        let run: any
        // 调度执行函数
        const scheduler = vi.fn(() => {
            run = runner
        });
        // effect返回runnner
        const runner = effect(
            () => {
                dummy = obj.count
            },
            // 接受调度
            { scheduler }
        );
        // 初始化不调用
        expect(scheduler).not.toHaveBeenCalled()
        // obj.count的初始值为0
        expect(dummy).toBe(0)
        // should be called on first trigger
        obj.count++;
        // 在对count进行赋值操作之后，会触发scheduler
        expect(scheduler).toHaveBeenCalledTimes(1)
        // should not run yet
        // 触发调度执行之后，不执行 run方法，先执行调度
        expect(dummy).toBe(0)
        // manually run
        // effect返回run，用于手动执行依赖的操作
        run()
        // should have run
        // 手动执行run之后，触发依赖的修改执行
        expect(dummy).toBe(1)
    });

    it("stop", () => {
        const obj = reactive({
            text: "vue3Effect",
            status: true,
            count: 0
        });
        let dummy;
        const runner = effect(() => {
            dummy = obj.count;
        });
        // 修改count的值，
        obj.count = 2;
        expect(dummy).toBe(2);
        // stop清空依赖
        stop(runner);
        // 修改数值时， 数据不变
        obj.count++;
        expect(dummy).toBe(2);

        // 重新执行runnner，会触发依赖的修改
        runner();
        expect(dummy).toBe(3);
    });
    it("onStop", () => {
        const obj = reactive({
            text: "vue3Effect",
            status: true,
            count: 0
        });
        // onStop模拟事件
        const onStop = vi.fn();
        let dummy;
        const runner = effect(
            () => {
                dummy = obj.count;
            },
            {
                onStop,
            }
        );
        // stop时，会调用onStop方法
        stop(runner);
        expect(onStop).toBeCalledTimes(1);
    });
})