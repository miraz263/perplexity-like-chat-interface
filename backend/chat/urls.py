# urls.py
from django.urls import path
from .views import stream_weather

urlpatterns = [
    path('api/stream_weather/', stream_weather, name='stream_weather'),
]
