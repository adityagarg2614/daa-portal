import { EditorState } from "@codemirror/state";
import { EditorView, lineNumbers, highlightActiveLineGutter } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { keymap } from "@codemirror/view";
import { bracketMatching, indentOnInput, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";

export const customSetup = [
    lineNumbers(),
    highlightActiveLineGutter(),
    history(),
    bracketMatching(),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    EditorState.tabSize.of(2),
    keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
    EditorView.lineWrapping,
];