import { isArray, isFunction } from "@my-vue/shared"
import { ReactiveEffect } from "packages/reactivity/src/effect"
import { isReactive } from "packages/reactivity/src/reactive"
import { isRef } from "packages/reactivity/src/ref"

export interface WatchOptionsBase {
    flush?: 'pre' | 'post' | 'sync'
}

export interface WatchOptions<Immediate = boolean> extends WatchOptionsBase {
    immediate?: Immediate
    deep?: boolean
}

export function watch(source, cb, options) {
    return doWatch(source, cb, options)
}

/**
 * @param source 观测的对象，可能是：1、ref。2、reactive。3、一个函数。4、由前面三个组成的数组。
 * @param cb 侦听到变化之后执行的回调函数
 * @param options 配置参数 immediate, deep, flush
 * @returns stop, 返回一个stop的方法
 * 
 *  主要用到的核心是effect，主要是通过ReactiveEffect和调度执行的方式进行处理
 *  ReactiveEffect的第一个参数接受一个方法，并且是监听变量的变化，所以定义一个getter去把接受到的source转化成方法，作为ReactiveEffect的参数
 * 
 *  根据source的参数类型去决定处理的方式
 * 1、如果是ref，则 getter = () => source.value
 * 2、如果是reactive，则
 */
export function doWatch(source, cb, options) {
    const { immediate, deep, flush } = options;
    let getter = () => { };
    if (isRef(source)) {
        // 如果是ref,则读取.value
        getter = () => source.value;
    } else if (isReactive(source)) {
        // 如果是reactive,则直接读取属性
        getter = () => source
    } else if (isArray(source)) {
        // 如果是数组的话，则直接遍历，判断数组中的事什么数据
        source.map((s) => {
            if (isRef(s)) {
                getter = () => s.value;
            } else if (isReactive(s)) {
                getter = () => s
            } else if (isFunction(s)) {
                getter = cb
            }
        })
    } else if (isFunction(source)) {
        getter = cb
    }
    let scheduler = () => { };
    if (options.immediate) {
        cb();
    }
    const effect = new ReactiveEffect(getter, scheduler);
    return () => {
        effect.stop();
    }
}