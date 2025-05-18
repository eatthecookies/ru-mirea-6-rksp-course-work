from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from blog.models import Blog, Post, Comment
from faker import Faker
import random
import uuid
import json

fake = Faker()

class Command(BaseCommand):
    help = "Генерирует фейковые пользователи, блоги, посты и комментарии"

    def handle(self, *args, **kwargs):
        self.create_users(5)
        self.create_blogs(10)
        self.create_posts(20)
        self.create_comments(50)
        self.stdout.write(self.style.SUCCESS('✅ Фейковые данные успешно созданы'))

    def create_users(self, count):
        self.users = []
        for _ in range(count):
            username = fake.user_name()
            email = fake.email()
            user = User.objects.create_user(username=username, email=email, password="test1234")
            self.users.append(user)

    def create_blogs(self, count):
        self.blogs = []
        for _ in range(count):
            blog = Blog.objects.create(
                title=fake.catch_phrase(),
                description=fake.paragraph(nb_sentences=3),
                author=random.choice(self.users)
            )
            self.blogs.append(blog)

    def create_posts(self, count):
        self.posts = []
        for _ in range(count):
            blog = random.choice(self.blogs)
            post_content = self.generate_post_content()
            post = Post.objects.create(
                blog=blog,
                title=fake.sentence(nb_words=6),
                content=post_content,  # JSON строка с контентом
                author=blog.author
            )
            self.posts.append(post)

    def create_comments(self, count):
        for _ in range(count):
            post = random.choice(self.posts)
            user = random.choice(self.users)
            Comment.objects.create(
                post=post,
                author=user,
                content=self.generate_crazy_comment()
            )

    def generate_normal_comment(self):
        city = fake.city()
        comments = [
            f"Недавно вернулся из {city} — замечательное место для путешествий!",
            f"Очень интересная статья, добавил {city} в список желаемых поездок.",
            f"Был в {city} несколько лет назад, ностальгия накрыла.",
            f"Спасибо за полезную информацию, обязательно поеду в {city}!",
            f"Прекрасный пост! Вдохновился на поездку в {city}.",
            f"Люблю читать такие истории — чувствуется атмосфера путешествия."
        ]
        return random.choice(comments)


    def generate_post_content(self):
        content = [
            {
                "id": str(uuid.uuid4()),
                "type": "paragraph",
                "props": {
                    "textColor": "default",
                    "backgroundColor": "default",
                    "textAlignment": "left"
                },
                "content": [
                    {"type": "text", "text": "Дата:", "styles": {"bold": True}},
                    {"type": "text", "text": f" {fake.date_between(start_date='-30d', end_date='today').strftime('%d %B %Y')}\n", "styles": {}}
                ],
                "children": []
            },
            {
                "id": str(uuid.uuid4()),
                "type": "heading",
                "props": {
                    "textColor": "default",
                    "backgroundColor": "default",
                    "textAlignment": "left",
                    "level": 2
                },
                "content": [{"type": "text", "text": "📍 Место назначения", "styles": {}}],
                "children": []
            },
            {
                "id": str(uuid.uuid4()),
                "type": "paragraph",
                "props": {
                    "textColor": "default",
                    "backgroundColor": "default",
                    "textAlignment": "left"
                },
                "content": [
                    {"type": "text", "text": "Локация:", "styles": {"bold": True}},
                    {"type": "text", "text": f" {fake.city()}, Россия\n", "styles": {}},
                    {"type": "text", "text": "Как добирался:", "styles": {"bold": True}},
                    {"type": "text", "text": " На машине\n", "styles": {}},
                    {"type": "text", "text": "Погода:", "styles": {"bold": True}},
                    {"type": "text", "text": f" +{random.randint(5,25)}°C, солнечно\n", "styles": {}}
                ],
                "children": []
            }
        ]
        return json.dumps(content, ensure_ascii=False)
