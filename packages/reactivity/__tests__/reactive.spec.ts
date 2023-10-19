import { isReactive, reactive, toRaw } from "../src/reactive"

describe('reactivity/reactive', () => {
    // 响应式对象转化
    test('Object', () => {
        // 响应式源对象
        const original = { foo: 1 }
        // 响应式对象
        const observed = reactive(original)
        expect(observed).not.toBe(original)
        // 判断是否已经进行响应式转化
        expect(isReactive(observed)).toBe(true)
        expect(isReactive(original)).toBe(false)
        // get
        expect(observed.foo).toBe(1)
        // has
        expect('foo' in observed).toBe(true)
        // ownKeys
        expect(Object.keys(observed)).toEqual(['foo'])
    });
    // 响应式对象的深度转化
    test('nested reactives', () => {
        const original = {
            nested: {
                foo: 1
            },
            array: [{ bar: 2 }]
        }
        const observed = reactive(original)
        expect(isReactive(observed.nested)).toBe(true)
        expect(isReactive(observed.array)).toBe(true)
        expect(isReactive(observed.array[0])).toBe(true)
    });

    test('toRaw', () => {
        const original = { foo: 1 }
        const observed = reactive(original)
        expect(toRaw(observed)).toBe(original)
        expect(toRaw(original)).toBe(original)
    })

    test('toRaw on object using reactive as prototype', () => {
        const original = reactive({})
        const obj = Object.create(original)
        const raw = toRaw(obj)
        expect(raw).toBe(obj)
        expect(raw).not.toBe(toRaw(original))
    })
})