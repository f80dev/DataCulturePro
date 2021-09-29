#Document utilisé par elasticSearch


from django_elasticsearch_dsl import Document, fields
from django_elasticsearch_dsl.registries import registry
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
class ProfilDocument(Document):
    name = fields.TextField(fielddata=True,attr='lastname',fields={'suggest': fields.Completion(),})
    works= fields.NestedField(properties={"job":fields.TextField(),"title":fields.TextField()})
    promo=fields.TextField(attr="promo")
    links=fields.NestedField(properties={"url":fields.TextField(),"text":fields.TextField()})
    public_url=fields.TextField(attr="public_url")

    class Index:
        name='profils'
        settings={"number_of_shards":1,"number_of_replicas":0}

    class Django(object):
        model=Profil
        fields=["id","firstname","lastname",
                "acceptSponsor","school",
                "email","department",
                "cp","cursus","blockchain",
                "mobile","photo","address",
                "town","degree_year","dtLastUpdate"]

    def get_queryset(self):
        return super().get_queryset().select_related('extrauser')




@registry.register_document
class PowDocument(Document):
    works=fields.NestedField(properties={
        "job":fields.TextField(),
        "lastname":fields.TextField(),
    })
    links = fields.NestedField(properties={"url": fields.TextField(), "text": fields.TextField()})
    class Index:
        name='pows'
        settings={"number_of_shards":1,"number_of_replicas":0}

    class Django(object):
        model=PieceOfWork
        fields=["id","year","visual","title","nature","category","production","reference"]
