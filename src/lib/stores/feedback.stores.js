import { writable } from "svelte/store";

export const feedback = writable({
    show: false,
    type:'info',
    title: '',
    message: '',
    confirmCallback: null
})
