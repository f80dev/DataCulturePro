# Generated by Django 3.2.8 on 2022-01-25 13:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('alumni', '0017_award_state'),
    ]

    operations = [
        migrations.AddField(
            model_name='award',
            name='source',
            field=models.CharField(blank=True, help_text='URL de la source', max_length=150, null=True),
        ),
    ]
