# Generated by Django 3.2 on 2021-09-21 13:18

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('alumni', '0004_pieceofwork_dtlastsearch'),
    ]

    operations = [
        migrations.AddField(
            model_name='profil',
            name='company',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.DO_NOTHING, to='alumni.company'),
        ),
    ]
