# Generated by Django 3.2.8 on 2021-12-07 12:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('alumni', '0002_auto_20211206_1320'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profil',
            name='email',
            field=models.EmailField(help_text='@email du profil', max_length=254, null=True, unique=True),
        ),
    ]
