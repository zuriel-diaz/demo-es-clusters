import os
from elasticsearch6 import Elasticsearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth
import boto3
import structlog
from configure_logging import configure_logging

ES_HOST = os.environ["ES_HOST"]
AWS_REGION = os.environ["AWS_REGION"]
AWS_SERVICE = "es"
ONE_SECOND_IN_NS = 1000000000

configure_logging()
LOGGER = structlog.getLogger()


def convert_to_seconds(nanoseconds):
    return nanoseconds / ONE_SECOND_IN_NS


def get_clusters():
    if not ES_HOST:
        raise KeyError('Missing the `ES_HOST` variable.')

    clusters_arr = ES_HOST.split(",")
    clusters = [{"host": cluster, "port": 443} for cluster in clusters_arr]
    return clusters


def get_connection():
    credentials = boto3.Session().get_credentials()
    awsauth = AWS4Auth(
        credentials.access_key,
        credentials.secret_key,
        AWS_REGION,
        AWS_SERVICE,
        session_token=credentials.token,
    )
    connection = Elasticsearch(
        hosts=get_clusters(),
        http_auth=awsauth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
    )
    return connection


def get_tasks():
    connection = get_connection()
    tasks_obj = connection.tasks.list(group_by="none", detailed=True)

    if len(tasks_obj) == 0 or not tasks_obj['tasks']:
        raise KeyError('Problems getting the `tasks` from the ES Tasks API')

    return tasks_obj['tasks']


def detect_slow_queries(tasks):
    max_time_in_seconds = int(os.environ["MAX_TIME_IN_SECONDS"])
    for task in tasks:
        if convert_to_seconds(task['running_time_in_nanos']) > max_time_in_seconds:
            LOGGER.info('detect_slow_queries::task', task=str(task))


def lambda_handler(event, context):
    tasks = get_tasks()
    detect_slow_queries(tasks)
