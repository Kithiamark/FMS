from django.utils.deprecation import MiddlewareMixin
from .models import AuditLog
from .utils import get_user_farm

class AuditLogMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        # Log successful mutating API calls. Detailed domain events can still be added in
        # views, but this gives us a reliable farmer activity trail for newsletters,
        # support investigations, and future LLM context retrieval.
        if request.path.startswith('/api/') and request.method in ['POST', 'PUT', 'PATCH', 'DELETE'] and response.status_code < 400:
            user = request.user if request.user.is_authenticated else None
            ip = self.get_client_ip(request)
            farm = get_user_farm(user)
            AuditLog.objects.create(
                user=user,
                farm=farm,
                event_type=AuditLog.EventType.API,
                action=request.method,
                model_name='APIRequest',
                object_id='',
                path=request.path[:255],
                method=request.method,
                ip_address=ip,
                metadata={
                    'status_code': response.status_code,
                    'query': request.META.get('QUERY_STRING', ''),
                    'user_agent': request.META.get('HTTP_USER_AGENT', '')[:180],
                },
            )
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
