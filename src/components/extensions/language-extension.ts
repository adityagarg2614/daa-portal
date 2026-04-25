import { cpp } from "@codemirror/lang-cpp";
import { java } from "@codemirror/lang-java";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";

export const getLanguageExtension = (language: string) => {
    switch (language) {
        case "cpp":
            return cpp();
        case "java":
            return java();
        case "python":
            return python();
        case "javascript":
            return javascript();
        default:
            return cpp();
    }
};
