#Test des api :
# voir https://dev.to/koladev/configuring-the-client-for-testing-with-pytest-and-django-rest-1bnk
# voir https://pytest-django.readthedocs.io/en/latest/configuring_django.html
import json
import pytest
from rest_framework.test import APIClient


@pytest.fixture
def server():
	return APIClient()


def call_api(server,url, params="", body=None, method=None, status_must_be=200):
	if not url.startswith("/"): url = "/" + url
	if not url.endswith("/"): url = url+"/"
	if method is None: method = "GET" if body is None else "POST"

	if method == "GET": response = server.get("/api" + url + "?" + params)
	if method == "POST": response = server.post("/api" + url + "?" + params, json=body)
	if method == "DELETE": response = server.delete("/api" + url + "?" + params)

	assert response.status_code == status_must_be
	if str(response.content,"utf8").startswith("{") and str(response.content,"utf8").endswith("}"):
		return json.loads(str(response.content,"utf8"))
	else:
		return response.content

@pytest.mark.django_db
def test_infos_server(server):
	rc=call_api(server,"infos_server")
	assert not rc is None


def test_getyaml(server):
	rc=call_api(server,"get_yaml","name=config")
	assert not rc is None
	assert int(rc["version"])>0

@pytest.mark.django_db
def test_search(server):
	rc=call_api(server,"awards")
	assert not rc is None

	rc=call_api(server,"profils")
	assert not rc is None

	rc=call_api(server,"pows")
	assert not rc is None




