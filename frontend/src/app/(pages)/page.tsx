"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { createApi } from "@/axiosConfig";
import {
  Layout,
  Typography,
  List,
  Card,
  Button,
  Modal,
  Input,
  message,
} from "antd";
import Link from "next/link";
import MainHeader from "@/components/MainHeader";
import MainFooter from "@/components/MainFooter";

const { Content } = Layout;

type Blog = {
  id: number;
  title: string;
  description: string;
  author: number;
};

export default function BlogsPage() {
  const { data: session } = useSession();

  const api = useMemo(
    () => (session?.access_token ? createApi(session.access_token) : null),
    [session?.access_token]
  );

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [open, setOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Получение ID текущего пользователя
  const getUserId = async (): Promise<number | null> => {
    try {
      const res = await api?.get("/users/id/");
      return res?.data.user_id ?? null;
    } catch (error) {
      console.error("Ошибка при получении ID пользователя:", error);
      return null;
    }
  };

  // Получаем блоги и ID пользователя
  useEffect(() => {
    if (!api) return;

    const fetchData = async () => {
      try {
        const [blogsRes, userId] = await Promise.all([
          api.get("/blogs/"),
          getUserId(),
        ]);
        setBlogs(blogsRes.data);
        setCurrentUserId(userId);
      } catch (error) {
        message.error("Ошибка при загрузке блогов");
        console.error(error);
      }
    };

    fetchData();
  }, [api]);

  // Добавление блога
  const handleAdd = async () => {
    if (!api || !title.trim()) return;

    const userId = await getUserId();
    if (!userId) return;

    try {
      const res = await api.post("/blogs/", {
        title,
        description: desc,
        author: userId,
      });

      setBlogs((prev) => [...prev, res.data]);
      setOpen(false);
      setTitle("");
      setDesc("");
      message.success("Блог добавлен");
    } catch (error) {
      console.error("Ошибка при создании блога:", error);
      message.error("Не удалось создать блог");
    }
  };

  // Удаление блога
  const handleDelete = async (id: number) => {
    if (!api) return;
    try {
      await api.delete(`/blogs/${id}/`);
      setBlogs((prev) => prev.filter((b) => b.id !== id));
      message.success("Блог удалён");
    } catch (error) {
      console.error("Ошибка при удалении блога:", error);
      message.error("Не удалось удалить блог");
    }
  };

  return (
    <Layout
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      <MainHeader />
      <Content style={{ padding: 24, flex: 1 }}>
        <Typography.Title>Блоги</Typography.Title>

        {/* Кнопка создания видна только авторизованному пользователю */}
        {session && (
          <Button
            style={{ marginBottom: 24 }}
            type="primary"
            onClick={() => setOpen(true)}
          >
            Добавить блог
          </Button>
        )}

        <List
          grid={{ gutter: 16, column: 2 }}
          dataSource={blogs}
          renderItem={(blog) => (
            <List.Item>
              <Card
                title={<Link href={`/blogs/${blog.id}`}>{blog.title}</Link>}
                extra={
                  currentUserId === blog.author && (
                    <Button danger onClick={() => handleDelete(blog.id)}>
                      Удалить
                    </Button>
                  )
                }
              >
                {blog.description}
              </Card>
            </List.Item>
          )}
        />

        <Modal
          title="Новый блог"
          open={open}
          onOk={handleAdd}
          onCancel={() => setOpen(false)}
          okText="Создать"
          cancelText="Отмена"
        >
          <Input
            placeholder="Заголовок"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <Input.TextArea
            placeholder="Описание"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
          />
        </Modal>
      </Content>
      <MainFooter />
    </Layout>
  );
}
