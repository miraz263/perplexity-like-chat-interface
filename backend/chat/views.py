import json, time
from django.http import StreamingHttpResponse

def stream_campaign(request):
    def event_stream():
        messages = [
            {"status": "collecting data", "source": "Website"},
            {"status": "collecting data", "source": "CRM"},
            {"status": "collecting data", "source": "Google Ads Tag"},
            {"status": "building payload"},
            {
                "audience": "retargeted users",
                "channel": "Email",
                "message": "Special Offer for you!",
                "time": "2025-09-29 20:00"
            }
        ]
        for msg in messages:
            yield f"data: {json.dumps(msg)}\n\n"
            time.sleep(1)

    return StreamingHttpResponse(event_stream(), content_type="text/event-stream")
