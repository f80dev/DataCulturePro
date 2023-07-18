#Document utilisé par elasticSearch


from django_elasticsearch_dsl import Document, fields
from django_elasticsearch_dsl.registries import registry
from django_elasticsearch_dsl_drf.compat import StringField
from elasticsearch_dsl import analyzer
from alumni.models import Profil, Work, PieceOfWork, Festival

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
        "description": fields.TextField(),
        "year":fields.IntegerField()
    })

    links = fields.NestedField(properties={"url": fields.TextField(), "text": fields.TextField()})
    class Index:
        name='pows'
        settings={"number_of_shards":1,"number_of_replicas":0}

    class Django(object):
        model=PieceOfWork
        fields=["id","year","visual","title","nature","category","production","reference"]


@registry.register_document
class FestivalDocument(Document):
    award = fields.ObjectField(properties={
        "profil":fields.ObjectField(properties={
            "firstname":fields.TextField(),
            "lastname":fields.TextField(),
        }),
        "pow":fields.ObjectField(properties={
            "title":fields.TextField(),
            "year":fields.TextField(),
        }),
        "description":fields.TextField(),
        "year":fields.TextField()
    })
    class Index:
        name='festivals'
        settings={"number_of_shards":1,"number_of_replicas":0}

    class Django(object):
        model=Festival
        fields=["id","title","country","url"]


@registry.register_document
class ProfilDocument(Document):
    works = fields.ObjectField(properties={
        "job":fields.TextField(),
        "source":fields.TextField(),
        "public":fields.BooleanField(),
        "pow":fields.ObjectField(properties={
            "title":fields.TextField(),
            "year":fields.IntegerField()
        }),
    })

    awards=fields.ObjectField(properties={
        "festival":fields.ObjectField(properties={
            "title":fields.TextField()
        }),
        "description":fields.TextField(),
        "year":fields.TextField()
    })

    class Index:
        name='profils'
        settings={"number_of_shards":1,"number_of_replicas":0}

    class Django(object):
        model=Profil
        fields=["id","firstname",
                "lastname","gender",
                "acceptSponsor",
                "school",
                "email",
                "department",
                "department_pro",
                "department_category",
                "cp","cursus",
                "mobile","photo","address",
                "town","degree_year","dtLastUpdate"]

    def get_queryset(self):
        return super().get_queryset().select_related('extrauser')



