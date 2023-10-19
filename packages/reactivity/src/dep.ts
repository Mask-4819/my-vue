import { ReactiveEffect } from "./effect";

// dep的类型为Set，里面保存的是 ReactiveEffect
export type Dep = Set<ReactiveEffect>
export function createDep(effects?: ReactiveEffect[]): Dep {
    const dep = new Set<ReactiveEffect>(effects) as Dep;
    return dep;
}