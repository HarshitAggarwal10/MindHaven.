// src/components/QuillEditor.js
"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";

/**
 * Some environments (Next + React 18 variants) don't expose
 * ReactDOM.findDOMNode in the shape react-quill expects.
 * We polyfill it on the client before react-quill is imported.
 *
 * This polyfill is minimal and only attempts to return a DOM node
 * for common component instances; it will not break server rendering
 * because it runs only in the browser (inside useEffect / require).
 */

const ReactQuillClient = dynamic(
  async () => {
    // polyfill as early as possible, on client only
    if (typeof window !== "undefined") {
      try {
        // require react-dom commonjs copy (works in client runtime)
        // eslint-disable-next-line global-require,import/no-extraneous-dependencies
        const reactDom = require("react-dom");

        if (!reactDom.findDOMNode) {
          // best-effort shim: try common React component shapes
          reactDom.findDOMNode = (instance) => {
            if (!instance) return null;

            // if it's a native DOM element already
            if (instance.nodeType) return instance;

            // react-quill sometimes passes the Quill editor instance,
            // which may expose .root/.editor/.container — try them:
            if (instance.root) return instance.root;
            if (instance.editor) return instance.editor.root || instance.editor;
            if (instance.container) return instance.container;
            if (instance.getEditor && typeof instance.getEditor === "function") {
              const ed = instance.getEditor();
              if (ed?.root) return ed.root;
            }

            // lastly attempt to return element property
            if (instance.element) return instance.element;

            // fallback: null (no DOM found)
            return null;
          };
        }
      } catch (e) {
        // require might fail in some setups — silently ignore,
        // react-quill will still try to use findDOMNode and may crash.
        // We'll still attempt to dynamically import react-quill.
        // console.warn("polyfill error", e);
      }
    }

    // dynamic import of react-quill (client-only)
    const mod = await import("react-quill");
    return mod.default ? mod.default : mod;
  },
  {
    ssr: false,
    loading: () => <div className="p-4 text-gray-500">Loading editor…</div>,
  }
);

export default function QuillEditor({ value, onChange, modules, placeholder }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // ensure we are on client and dynamic component has been hydrated
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="p-4 text-gray-400">Loading editor…</div>;
  }

  return (
    <div className="mt-4">
      <ReactQuillClient
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder || "Write whatever's on your mind…"}
        style={{ minHeight: 240 }}
      />
    </div>
  );
}
