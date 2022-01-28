#Document utilisé par elasticSearch


from django_elasticsearch_dsl import Document, fields
from django_elasticsearch_dsl.registries import registry
from django_elasticsearch_dsl_drf.compat import StringField
from elasticsearch_dsl import analyzer
from alumni.models import Profil, Work, PieceOfWork

#
# See Elasticsearch Indices API reference for available settings

html_strip = analyzer(
    'html_strip',
    tokenizer="standard",
    filter=["standard", "lowercase", "stop", "snowball"],
    char_filter=["html_strip"]
)




@registry.register_document
class PowDocument(Document):
    works=fields.NestedField(properties={
        "job":fields.TextField(),
        "lastname":fields.TextField(),
    })
    award = fields.ObjectField(properties={
        "festival": fields.ObjectField(properties={
            "title": fields.TextField()
        }),
        "description": fields.TextField()
    })

    links = fields.NestedField(properties={"url": fields.TextField(), "text": fields.TextField()})
    class Index:
        name='pows'
        settings={"number_of_shards":1,"number_of_replicas":0}

    class Django(object):
        model=PieceOfWork
        fields=["id","year","visual","title","nature","category","production","reference"]


@registry.register_document
class ProfilDocument(Document):
    works = fields.ObjectField(properties={
        "job":fields.TextField(),
        "source":fields.TextField(),
        "pow":fields.ObjectField(properties={
            "title":fields.TextField()
        }),
    })

    award=fields.ObjectField(properties={
        "festival":fields.ObjectField(properties={
            "title":fields.TextField()
        }),
        "description":fields.TextField()
    })

    class Index:
        name='profils'
        settings={"number_of_shards":1,"number_of_replicas":0}

    class Django(object):
        model=Profil
        fields=["id","firstname","lastname","gender",
                "acceptSponsor",
                "school",
                "email",
                "department","department_category",
                "cp","cursus",
                "mobile","photo","address",
                "town","degree_year","dtLastUpdate"]

    def get_queryset(self):
        return super().get_queryset().select_related('extrauser')

    # def get_instances_from_related(self, related_instance):
    #     """If related_models is set, define how to retrieve the Car instance(s) from the related model.
    #     The related_models option should be used with caution because it can lead in the index
    #     to the updating of a lot of items.
    #     """
    #     if isinstance(related_instance, Work):
    #         return related_instance.pow.works


