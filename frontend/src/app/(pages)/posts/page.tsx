"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { createApi } from "@/axiosConfig";
import {
  Layout,
  Typography,
  List,
  Card,
  Spin,
  Empty,
  Button,
  message,
} from "antd";
import Link from "next/link";
import MainHeader from "@/components/MainHeader";
import MainFooter from "@/components/MainFooter";
import { CompassOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Title, Paragraph } = Typography;

type Post = {
  id: number;
  blog: number;
  title: string;
  content: string;
};

type Blog = {
  id: number;
  owner: number;
};

export default function PostsPage() {
  const { data: session } = useSession();
  const api = useMemo(
    () => (session?.access_token ? createApi(session.access_token) : null),
    [session?.access_token]
  );

  const [posts, setPosts] = useState<Post[]>([]);
  const [blogs, setBlogs] = useState<Record<number, Blog>>({});
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!api) return;
      try {
        const [postsRes, blogsRes, userRes] = await Promise.all([
          api.get("/posts/"),
          api.get("/blogs/"),
          api.get("/users/id/"),
        ]);

        const blogMap: Record<number, Blog> = {};
        for (const blog of blogsRes.data) {
          blogMap[blog.id] = blog;
        }

        setPosts(postsRes.data);
        setBlogs(blogMap);
        setUserId(userRes.data.user_id);
      } catch (e) {
        message.error("Ошибка при загрузке данных");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [api]);

  const handleDelete = async (id: number) => {
    if (!api) return;
    try {
      await api.delete(`/posts/${id}/`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
      message.success("Пост удалён");
    } catch {
      message.error("Ошибка при удалении поста");
    }
  };

  return (
    <Layout
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <MainHeader />
      <Content style={{ padding: 24, flex: 1 }}>
        <Title level={2}>Все посты</Title>

        {loading ? (
          <Spin size="large" />
        ) : posts.length === 0 ? (
          <Empty description="Постов пока нет" />
        ) : (
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
              >
                <List.Item.Meta
                  avatar={
                    <CompassOutlined
                      style={{ fontSize: 24, color: "#1677ff" }}
                    />
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
        )}
      </Content>
      <MainFooter />
    </Layout>
  );
}
