"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { createApi } from "@/axiosConfig";
import { Typography, Layout, List, Card, Input, Button, message } from "antd";
import MainHeader from "@/components/MainHeader";
import MainFooter from "@/components/MainFooter";
import dynamic from "next/dynamic";

const BlockNoteEditor = dynamic(() => import("@/components/BlockNote"), {
  ssr: false,
});

type Comment = {
  id: number;
  post: number;
  author: number;
  content: string;
  created_at: string;
};

type Post = {
  id: number;
  blog: number;
  title: string;
  content: string;
};

type User = {
  id: number;
  username: string;
};

export default function PostDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();

  const api = useMemo(
    () => (session?.access_token ? createApi(session.access_token) : null),
    [session?.access_token]
  );

  const [post, setPost] = useState<Post>();
  const [comments, setComments] = useState<Comment[]>([]);
  const [usersMap, setUsersMap] = useState<Map<number, string>>(new Map());
  const [newComment, setNewComment] = useState("");
  const [editor, setEditor] = useState<any>(null);

  useEffect(() => {
    if (!api || !id) return;

    const fetchAll = async () => {
      const [postRes, commentsRes, usersRes] = await Promise.all([
        api.get(`/posts/${id}/`),
        api.get("/comments/"),
        api.get("/users/"),
      ]);

      setPost(postRes.data);

      const filteredComments = commentsRes.data.filter(
        (comment: Comment) => comment.post === Number(id)
      );
      setComments(filteredComments);

      const usersArray: User[] = usersRes.data;
      const map = new Map<number, string>();
      usersArray.forEach((u) => map.set(u.id, u.username));
      setUsersMap(map);
    };

    fetchAll();
  }, [api, id]);

  const getUserId = async () => {
    try {
      const res = await api?.get("/users/id/");
      return res?.data.user_id;
    } catch (error) {
      console.error("Ошибка при получении user_id:", error);
      return null;
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const userId = await getUserId();
    if (!userId || !api) return;

    await api.post("/comments/", {
      content: newComment,
      post: Number(id),
      author: userId,
    });

    setNewComment("");

    const res = await api.get("/comments/");
    const updated = res.data.filter(
      (comment: Comment) => comment.post === Number(id)
    );
    setComments(updated);
    message.success("Комментарий добавлен");
  };

  return (
    <Layout
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <MainHeader />

      <div
        style={{
          padding: 24,
          flex: 1,
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",

          // alignItems: "center", // убираем глобальную центровку
        }}
      >
        {/* Центрируем только заголовок и блок контента */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography.Title
            level={1}
            style={{ marginTop: 20, textAlign: "center" }}
          >
            {post?.title}
          </Typography.Title>

          {post?.content && (
            <BlockNoteEditor
              setEditorRef={setEditor}
              initialContent={post.content}
              editable={false}
            />
          )}

          <Typography.Title
            level={4}
            style={{ marginTop: 20, textAlign: "center" }}
          >
            Комментарии
          </Typography.Title>
        </div>

        <div
          style={{
            width: "100%",
            maxWidth: 800,
            margin: "0 auto",
            padding: 65,
          }}
        >
          <List
            dataSource={comments}
            renderItem={(comment) => (
              <List.Item>
                <Card style={{ marginBottom: 12 }}>
                  <p style={{ fontWeight: "500", marginBottom: 4 }}>
                    {usersMap.get(comment.author) ?? "Пользователь"}
                  </p>
                  {comment.content}
                </Card>
              </List.Item>
            )}
          />

          <Input.TextArea
            placeholder="Напишите комментарий..."
            rows={4}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            style={{
              marginBottom: 12,
              width: "100%",
              // marginLeft: 65,
            }}
          />
          <Button
            style={{
              marginBottom: 12,
              width: 200,
              display: "block",
              marginRight: "auto",
            }}
            type="primary"
            onClick={handleAddComment}
          >
            Добавить комментарий
          </Button>
        </div>
      </div>

      <MainFooter />
    </Layout>
  );
}
