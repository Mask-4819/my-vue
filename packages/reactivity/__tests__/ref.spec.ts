import { effect } from "../src/effect";
import { reactive } from "../src/reactive";
import { isRef, ref, unRef, proxyRefs } from "../src/ref";
describe("ref", () => {
    it("should be reactive", () => {
        // ref转化
        const a = ref(1);
        let dummy;
        let calls = 0;
        // effect响应式核心收集，进行依赖的收集
        effect(() => {
            calls++;
            dummy = a.value;
        });
        // 初次调用，calls自增， dummy赋值
        expect(calls).toBe(1);
        expect(dummy).toBe(1);
        // 修改响应式的值，触发ref的依赖，执行trigger
        a.value++
        expect(calls).toBe(2);
        expect(dummy).toBe(2);
        // 相同的赋值，不触发依赖的执行
        a.value = 2;
        expect(calls).toBe(2);
        expect(dummy).toBe(2);
        // 自增校验
        a.value++
        expect(calls).toBe(3);
        expect(dummy).toBe(3);
    });

    it("should make nested properties reactive", () => {
        // 如果ref传入的不是基础数据类型，则会进行reactive的转化
        const a = ref({
            count: 1,
        });
        let dummy;
        // 响应式收集
        effect(() => {
            // .value的方式获取可以获取ref转化后的值，如果是对象，则通过 .value之后再获取属性的值
            dummy = a.value.count;
        });
        expect(dummy).toBe(1);
        // 响应式修改
        a.value.count = 2;
        expect(dummy).toBe(2);
    });

    it("isRef", () => {
        const a = ref(1);
        const user = reactive({
            age: 1,
        });
        expect(isRef(a)).toBe(true);
        expect(isRef(1)).toBe(false);
        expect(isRef(user)).toBe(false);
    });
    it("unRef", () => {
        const a = ref(1);
        expect(unRef(a)).toBe(1);
        expect(unRef(1)).toBe(1);
    });
    // proxyRefs用于在ref的使用时候，处理template中不用.value的模式
    it("proxyRefs", () => {
        const user = {
            age: ref(10),
            name: "xiaohong",
        };
        // 对user进行proxy处理
        const proxyUser = proxyRefs(user);
        // 通过.value的模式进行读取
        expect(user.age.value).toBe(10);
        // 处理后的对象，不需要.value也可以进行读取
        expect(proxyUser.age).toBe(10);
        expect(proxyUser.name).toBe("xiaohong");

        // 修改proxyRefs处理后的对象，也可以修改ref源对象
        (proxyUser as any).age = 20;
        expect(proxyUser.age).toBe(20);
        expect(user.age.value).toBe(20);
        // proxyRefs的值直接修改为ref，读取也可以无需.value
        proxyUser.age = ref(10);
        expect(proxyUser.age).toBe(10);
        expect(user.age.value).toBe(10);
    });
});
