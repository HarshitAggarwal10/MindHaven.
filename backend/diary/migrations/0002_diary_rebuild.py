from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
        ("diary", "0001_initial"),
    ]

    operations = [
        migrations.DeleteModel(name="DiaryUser"),
        migrations.DeleteModel(name="DiaryEntry"),
        migrations.CreateModel(
            name="DiaryEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.TextField(blank=True, default="")),
                ("content", models.TextField(blank=True, default="")),
                ("encrypted_content", models.TextField(blank=True, default="")),
                ("encrypted_key", models.TextField(blank=True, default="")),
                ("key_nonce", models.TextField(blank=True, default="")),
                ("content_nonce", models.TextField(blank=True, default="")),
                ("salt", models.TextField(blank=True, default="")),
                ("favorite", models.BooleanField(default=False)),
                ("deleted", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="diary_entries", to="users.user")),
            ],
            options={"db_table": "diary_entries"},
        ),
    ]
