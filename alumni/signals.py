from django.db.models.signals import post_delete, pre_init
from django.dispatch import receiver

@receiver(pre_init)
def preinit_app():
    pass


@receiver(post_delete)
def delete_document(sender, **kwargs):
    app_label = sender._meta.app_label
    model_name = sender._meta.model_name
    instance = kwargs['instance']
