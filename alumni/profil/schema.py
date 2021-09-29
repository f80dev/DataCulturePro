import graphene
from graphene_django import DjangoObjectType
from alumni.models import Profil


class ProfilType(DjangoObjectType):
    class Meta:
        model=Profil


#http://localhost:8000/graphql/
class Query(object):
    all_profils=graphene.List(ProfilType)
    profil = graphene.Field(ProfilType,
                              id=graphene.String(),
                              lastname=graphene.String(),
                                firstname=graphene.String()
                            )

    def resolve_all_profils(self,info,**kwargs):
        return Profil.objects.all()

    # def resolve_profil(self, info, **kwargs):
    #     id = kwargs.get('id')
    #     lastname = kwargs.get('lastname')
    #     firstname = kwargs.get('firstname')
    #
    #     if id is not None:
    #         return Profil.objects.get(pk=id)
    #
    #     if lastname is not None:
    #         return Profil.objects.get(lastname=lastname)
    #
    #     if firstname is not None:
    #         return Profil.objects.get(firstname=firstname)
    #
    #     return None