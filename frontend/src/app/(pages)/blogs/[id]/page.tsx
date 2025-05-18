"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { createApi } from "@/axiosConfig";
import {
  Typography,
  List,
  Spin,
  Empty,
  Button,
  Modal,
  Input,
  Layout,
  message,
} from "antd";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import MainFooter from "@/components/MainFooter";
import MainHeader from "@/components/MainHeader";
import { CompassOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

const BlockNoteEditor = dynamic(() => import("@/components/BlockNote"), {
  ssr: false,
});

type Post = {
  id: number;
  blog: number;
  title: string;
  content: string;
};

type Blog = {
  id: number;
  title: string;
  description: string;
  author: number;
};

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();

  const [editor, setEditor] = useState<any>(null);
  const [postTitle, setPostTitle] = useState("");
  const [ownerUsername, setOwnerUsername] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const api = useMemo(
    () => (session?.access_token ? createApi(session.access_token) : null),
    [session?.access_token]
  );

  const fetchData = async () => {
    if (!api || !id) return;
    setLoading(true);
    try {
      const [blogRes, postsRes] = await Promise.all([
        api.get(`/blogs/${id}/`),
        api.get("/posts/"),
      ]);
      const blogData = blogRes.data;
      setBlog(blogData);

      if (blogData.author) {
        try {
          const userRes = await api.get(`/users/${blogData.author}/`);
          setOwnerUsername(userRes.data.username);
        } catch (err) {
          console.error("Ошибка при получении username", err);
        }
      }

      const filteredPosts = postsRes.data.filter(
        (post: Post) => post.blog === Number(id)
      );
      setPosts(filteredPosts);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUserId = async () => {
    if (!api) return null;
    try {
      const res = await api.get("/users/id/");
      return res.data.user_id;
    } catch (error) {
      console.error("Ошибка при получении ID пользователя", error);
      return null;
    }
  };

  useEffect(() => {
    fetchData();
  }, [api, id]);

  useEffect(() => {
    if (api) {
      getCurrentUserId().then((id) => setCurrentUserId(id));
    }
  }, [api]);

  const isAuthor = useMemo(() => {
    return (
      currentUserId !== null && blog !== null && currentUserId === blog.author
    );
  }, [currentUserId, blog]);

  const handleAddPost = async () => {
    if (!api || !id) return;

    if (!postTitle.trim()) {
      message.error("Пожалуйста, введите заголовок");
      return;
    }

    if (!editor || editor.isEmpty?.()) {
      message.error("Пожалуйста, введите текст");
      return;
    }

    const content = editor.getContent();

    try {
      const res = await api.post("/posts/", {
        title: postTitle,
        content: content,
        blog: Number(id),
      });

      setPosts((prev) => [...prev, res.data]);
      setOpen(false);
      setPostTitle("");
      editor.editor.replaceBlocks([]);
      message.success("Пост успешно создан");
    } catch (error: any) {
      console.error("Ошибка при создании поста:", error);
      message.error("Ошибка при создании поста");
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!api) return;
    try {
      await api.delete(`/posts/${postId}/`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      message.success("Пост удалён");
    } catch (error) {
      console.error("Ошибка при удалении поста:", error);
      message.error("Ошибка при удалении поста");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div style={{ padding: 24 }}>
        <Empty description="Блог не найден" />
      </div>
    );
  }

  return (
    <Layout
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <MainHeader />

      <div style={{ padding: 24, flex: 1 }}>
        <Title level={2}>{blog.title}</Title>
        <Paragraph>{blog.description}</Paragraph>
        <Paragraph>Автор блога: {ownerUsername}</Paragraph>

        <Title level={3}>Путешествия</Title>

        {isAuthor && (
          <Button
            type="primary"
            onClick={() => setOpen(true)}
            style={{ marginBottom: 16 }}
          >
            Добавить путешествие
          </Button>
        )}

        <List
          itemLayout="horizontal"
          dataSource={posts}
          renderItem={(post) => (
            <List.Item
              style={{
                backgroundColor: "#fff",
                borderRadius: 8,
                boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
                padding: 16,
                marginBottom: 12,
                transition: "all 0.2s",
                cursor: "pointer",
              }}
              actions={
                isAuthor
                  ? [
                      <Button
                        danger
                        onClick={() => handleDeletePost(post.id)}
                        key="delete"
                        size="small"
                      >
                        Удалить
                      </Button>,
                    ]
                  : []
              }
            >
              <List.Item.Meta
                avatar={
                  <CompassOutlined style={{ fontSize: 24, color: "#1677ff" }} />
                }
                title={
                  <Link
                    href={`/posts/${post.id}`}
                    style={{
                      fontSize: "18px",
                      fontWeight: 500,
                      color: "#1a1a1a",
                    }}
                  >
                    {post.title}
                  </Link>
                }
                description={null}
              />
            </List.Item>
          )}
        />

        <Modal
          open={open}
          onOk={handleAddPost}
          onCancel={() => setOpen(false)}
          width={800}
          okText="Создать"
          cancelText="Отмена"
        >
          <div
            style={{
              backgroundColor: "white",
              marginBottom: 16,
              marginTop: 16,
            }}
          >
            <Input
              placeholder="Введите заголовок путешествия..."
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              style={{
                fontSize: "40px",
                fontWeight: 500,
                border: "none",
                boxShadow: "none",
                padding: "8px 0",
                marginLeft: "65px",
              }}
              bordered={false}
            />
          </div>

          <BlockNoteEditor setEditorRef={setEditor} editable={true} />
        </Modal>
      </div>

      <MainFooter />
    </Layout>
  );
}
