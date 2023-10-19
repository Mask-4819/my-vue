import { h } from "../../dist/my-vue.esm.js";
export const App = {
    render() {
        // ui
        return h(
            "div",
            { id: 'root' },
            [h('p', { class: ['red', 'font-16'] }, "hi "), h('p', { class: 'blue' }, "my-vue")]
        );
    },

    setup() {
        return {
            msg: "my-vue",
        };
    },
};
