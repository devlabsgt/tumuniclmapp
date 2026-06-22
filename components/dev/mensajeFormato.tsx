'use client';

import { useEffect, useRef, type RefObject } from 'react';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function mensajeToHtml(text: string): string {
  if (!text) return '';
  const escaped = escapeHtml(text);
  const formatted = escaped
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong class="font-bold">$1</strong>')
    .replace(/\*([\s\S]+?)\*/g, '<em class="italic">$1</em>');
  return formatted.replace(/\n/g, '<br />');
}

export function htmlToMensaje(html: string): string {
  if (!html || html === '<br>') return '';

  const walk = (element: HTMLElement): string => {
    let result = '';
    element.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent ?? '';
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const el = node as HTMLElement;
      const tag = el.tagName;
      const inner = walk(el);

      if (tag === 'BR') {
        result += '\n';
      } else if (tag === 'STRONG' || tag === 'B') {
        result += `**${inner}**`;
      } else if (tag === 'EM' || tag === 'I') {
        result += `*${inner}*`;
      } else if (tag === 'DIV' || tag === 'P') {
        result += inner;
        if (el.nextSibling) result += '\n';
      } else {
        result += inner;
      }
    });
    return result;
  };

  const div = document.createElement('div');
  div.innerHTML = html;
  return walk(div).replace(/\n{3,}/g, '\n\n').trim();
}

type MensajeFormateadoProps = {
  texto: string;
  className?: string;
};

export function MensajeFormateado({ texto, className }: MensajeFormateadoProps) {
  if (!texto) return null;

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: mensajeToHtml(texto) }}
    />
  );
}

type MensajeEditorProps = {
  initialMarkdown: string;
  onChange: (value: string) => void;
  resetKey: string;
  className?: string;
  editorRef?: RefObject<HTMLDivElement | null>;
};

export function MensajeEditor({
  initialMarkdown,
  onChange,
  resetKey,
  className,
  editorRef,
}: MensajeEditorProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = editorRef ?? internalRef;

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = initialMarkdown ? mensajeToHtml(initialMarkdown) : '<br>';
  }, [resetKey, initialMarkdown, ref]);

  const sync = () => {
    if (!ref.current) return;
    onChange(htmlToMensaje(ref.current.innerHTML));
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={sync}
      className={className}
    />
  );
}

export function applyEditorFormat(editor: HTMLDivElement | null, command: 'bold' | 'italic') {
  if (!editor) return;
  editor.focus();
  document.execCommand(command, false);
}
