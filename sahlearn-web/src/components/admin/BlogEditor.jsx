import { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'react-quill/dist/quill.snow.css';

const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'code-block'],
  ['link', 'image'],
  ['clean'],
];

export default function BlogEditor({ value, onChange }) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || quillRef.current) return;

    const editorDiv = document.createElement('div');
    container.appendChild(editorDiv);

    const quill = new Quill(editorDiv, {
      theme: 'snow',
      modules: { toolbar: TOOLBAR },
    });

    quillRef.current = quill;

    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }

    quill.on('text-change', () => {
      onChangeRef.current(quill.root.innerHTML);
    });

    return () => {
      quillRef.current = null;
      container.innerHTML = '';
    };
  }, []);

  // Sync external value changes (e.g. loading edit data) without cursor jump
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const current = quill.root.innerHTML;
    if (value !== current) {
      quill.clipboard.dangerouslyPasteHTML(value || '');
    }
  }, [value]);

  return (
    <div>
      <div ref={containerRef} className="blog-editor-container" />
      <style>{`
        .blog-editor-container .ql-toolbar { border-top-left-radius: 0.5rem; border-top-right-radius: 0.5rem; border-color: #d1d5db; }
        .blog-editor-container .ql-container { border-bottom-left-radius: 0.5rem; border-bottom-right-radius: 0.5rem; border-color: #d1d5db; min-height: 320px; font-size: 15px; }
        .blog-editor-container .ql-editor { min-height: 320px; }
      `}</style>
    </div>
  );
}
