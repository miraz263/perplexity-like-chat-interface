# views.py
import json
import time
import requests
from django.http import StreamingHttpResponse
from django.utils.encoding import smart_str

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"

def stream_weather(request):
    """
    SSE endpoint that polls Open-Meteo and streams current weather as JSON SSE `data:` messages.

    Query params:
      - lat (default 23.8103)   : latitude
      - lon (default 90.4125)   : longitude
      - interval (default 30)   : polling interval in seconds (min 10)
      - timezone (default auto)  : timezone string (optional)

    Notes:
      - Keep interval >= 10 to be polite.
      - Sets headers to reduce buffering in proxies (X-Accel-Buffering).
    """
    # parse params with sensible defaults
    try:
        lat = float(request.GET.get("lat", "23.8103"))
        lon = float(request.GET.get("lon", "90.4125"))
    except ValueError:
        lat, lon = 23.8103, 90.4125

    try:
        interval = int(request.GET.get("interval", "30"))
    except ValueError:
        interval = 30

    if interval < 10:
        interval = 10  # throttle to minimum 10 seconds

    timezone = request.GET.get("timezone")  # optional e.g. "Asia/Dhaka"

    def get_weather():
        params = {
            "latitude": lat,
            "longitude": lon,
            "current_weather": "true",
            # optionally include hourly fields or timezone if passed
        }
        if timezone:
            params["timezone"] = timezone

        resp = requests.get(OPEN_METEO_URL, params=params, timeout=10)
        resp.raise_for_status()
        return resp.json()

    def event_stream():
        # send an initial "connected" message
        yield f"data: {json.dumps({'type': 'connected', 'lat': lat, 'lon': lon})}\n\n"

        while True:
            try:
                weather_json = get_weather()

                # transform to a compact message you want to stream
                current = weather_json.get("current_weather", {})
                # create a structured payload
                payload = {
                    "type": "weather",
                    "timestamp": int(time.time()),
                    "latitude": lat,
                    "longitude": lon,
                    "temperature": current.get("temperature"),      # Celsius
                    "windspeed": current.get("windspeed"),          # km/h or m/s depending on API
                    "winddirection": current.get("winddirection"),
                    "weathercode": current.get("weathercode"),
                    "raw": current  # optional: include full current object for debugging
                }

                # yield SSE data message
                yield f"data: {json.dumps(payload)}\n\n"
            except requests.RequestException as e:
                err = {"type": "error", "msg": "fetch_failed", "detail": str(e)}
                yield f"data: {json.dumps(err)}\n\n"
            except Exception as e:
                err = {"type": "error", "msg": "internal_error", "detail": str(e)}
                yield f"data: {json.dumps(err)}\n\n"

            # heartbeat (keep connection alive) between polls
            # we already waited interval seconds for next poll; send comment lines each 10s to keep proxies alive
            # but simpler: sleep interval and then poll again
            time.sleep(interval)

    response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
    # recommended headers for SSE
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'   # for nginx: disable buffering so clients get events immediately
    # Allow EventSource/CORS if you have a separate frontend origin (see note below)
    return response
