"use client";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useEffect, useRef } from "react";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";

type EditorRef = {
  editor: any;
  getContent: () => string;
  isEmpty: () => boolean;
};

type Props = {
  setEditorRef: (ref: EditorRef) => void;
  initialContent?: string;
  editable: boolean;
};

export default function BlockNoteEditorClient({
  setEditorRef,
  initialContent,
  editable,
}: Props) {
  const parsedContent = initialContent
    ? JSON.parse(initialContent)
    : [
        {
          type: "paragraph",
          content: "Расскажите о вашем путешествии...",
        },
      ];

  const editor = useCreateBlockNote({
    initialContent: parsedContent,
  });

  const contentRef = useRef<string>("");

  useEffect(() => {
    if (!editor) return;

    setEditorRef({
      editor,
      getContent: () => contentRef.current,
      isEmpty: () => {
        try {
          const content = JSON.parse(contentRef.current);
          return (
            !content ||
            content.length === 0 ||
            (content.length === 1 &&
              (!content[0].content || content[0].content.length === 0))
          );
        } catch {
          return true;
        }
      },
    });

    const updateContent = async () => {
      const blocks = await editor.document;
      contentRef.current = JSON.stringify(blocks);
    };

    editor.onEditorContentChange(updateContent);
  }, [editor, setEditorRef]);

  return (
    <div
      style={{
        // border: "1px solid #d9d9d9",
        borderRadius: 8,
        padding: 12,
        minHeight: 300,

        backgroundColor: "white",
      }}
    >
      <BlockNoteView editor={editor} editable={editable} />
    </div>
  );
}
