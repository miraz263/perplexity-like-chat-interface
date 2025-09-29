from django.urls import path
from .views import stream_campaign

urlpatterns = [
    path("stream/", stream_campaign),
]
