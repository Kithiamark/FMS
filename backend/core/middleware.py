import logging
from django.utils.deprecation import MiddlewareMixin
from urllib.parse import parse_qsl, urlencode
from .models import AuditLog
from .utils import get_user_farm

logger = logging.getLogger('fms')

class AuditLogMiddleware(MiddlewareMixin):
    SENSITIVE_PARAM_KEYWORDS = {'password', 'token', 'otp', 'secret', 'key', 'pin', 'auth', 'cvv'}

    def sanitize_query_string(self, query_string):
        if not query_string:
            return ''
        try:
            pairs = parse_qsl(query_string, keep_blank_values=True)
            sanitized = [
                (k, '***' if any(keyword in k.lower() for keyword in self.SENSITIVE_PARAM_KEYWORDS) else v)
                for k, v in pairs
            ]
            return urlencode(sanitized)
        except Exception:
            return '[REDACTED]'

    def process_response(self, request, response):
        # Log successful mutating API calls. Detailed domain events can still be added in
        # views, but this gives us a reliable farmer activity trail for newsletters,
        # support investigations, and future LLM context retrieval.
        if request.path.startswith('/api/') and request.method in ['POST', 'PUT', 'PATCH', 'DELETE'] and response.status_code < 400:
            try:
                user = request.user if request.user.is_authenticated else None
                ip = self.get_client_ip(request)
                farm = get_user_farm(user)
                sanitized_query = self.sanitize_query_string(request.META.get('QUERY_STRING', ''))
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
                        'query': sanitized_query,
                        'user_agent': request.META.get('HTTP_USER_AGENT', '')[:180],
                    },
                )
            except Exception as e:
                logger.warning("AuditLogMiddleware failed to record audit log: %s", str(e), exc_info=True)
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
