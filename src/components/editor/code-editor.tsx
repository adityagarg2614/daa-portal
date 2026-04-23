"use client";

import { useEffect, useMemo, useRef } from "react";
import { EditorView } from "@codemirror/view";
import { oneDark } from "@codemirror/theme-one-dark";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { getLanguageExtension } from "../extensions/ language-extension";
import { customSetup } from "../extensions/custom-setup";

interface Props {
    language: string;
    value?: string;
    onChange: (value: string) => void;
}

export const CodeEditor = ({
    language,
    value = "",
    onChange,
}: Props) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);
    // Keep a stable ref to onChange to avoid unnecessary re-initializations
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const languageExtension = useMemo(() => {
        return getLanguageExtension(language);
    }, [language]);

    // Initialize editor
    useEffect(() => {
        if (!editorRef.current) return;

        if (viewRef.current) {
            viewRef.current.destroy();
        }

        const view = new EditorView({
            doc: value,
            parent: editorRef.current,
            extensions: [
                oneDark,
                customSetup,
                languageExtension,
                indentationMarkers(),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        const currentValue = update.state.doc.toString();
                        onChangeRef.current(currentValue);
                    }
                }),
            ],
        });

        viewRef.current = view;

        return () => {
            view.destroy();
            viewRef.current = null;
        };
        // Re-create the view when language changes (simplest approach for CodeMirror 6)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [languageExtension]); 

    // Sync external value changes to the editor
    useEffect(() => {
        if (viewRef.current) {
            const currentValue = viewRef.current.state.doc.toString();
            if (value !== currentValue) {
                viewRef.current.dispatch({
                    changes: { from: 0, to: currentValue.length, insert: value }
                });
            }
        }
    }, [value]);

    return <div ref={editorRef} className="h-[520px] rounded-[22px] border bg-background md:h-[600px] xl:h-[680px]" />;
};
