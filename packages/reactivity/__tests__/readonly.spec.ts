import { isProxy, isReactive, isReadonly, readonly } from "../src/reactive";

describe("readonly", () => {
  it("should make nested values readonly", () => {
    const original = { foo: 1, bar: { baz: 2 } };
    const wrapped = readonly(original);
    // 源对象与代理对象不相等
    expect(wrapped).not.toBe(original);
    // 检测是否是代理对象
    expect(isProxy(wrapped)).toBe(true);

    // 转化后的不是 reactive是readonly
    expect(isReactive(wrapped)).toBe(false);
    expect(isReadonly(wrapped)).toBe(true);
    // 转化前的不是reactive也不是readonly
    expect(isReactive(original)).toBe(false);
    expect(isReadonly(original)).toBe(false);
    // 转化是深度嵌套转化的
    expect(isReactive(wrapped.bar)).toBe(false);
    expect(isReadonly(wrapped.bar)).toBe(true);
    expect(isReactive(original.bar)).toBe(false);
    expect(isReadonly(original.bar)).toBe(false);
    // get
    expect(wrapped.foo).toBe(1);
  });
});
