# Generated by Django 4.0.2 on 2022-05-25 13:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('alumni', '0024_alter_profil_options'),
    ]

    operations = [
        migrations.AlterField(
            model_name='award',
            name='description',
            field=models.CharField(blank=True, default='sans titre', help_text='Nom de la récompense obtenue', max_length=250),
        ),
    ]