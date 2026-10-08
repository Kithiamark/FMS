from rest_framework import exceptions, generics, status, views, permissions
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from datetime import timedelta
from .serializers import UserRegistrationSerializer, UserSerializer, OTPSerializer, OTPVerifySerializer, WorkerAccountSerializer
from core.models import AuditLog
from core.utils import get_user_farm

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')

            # Set cookies
            response.set_cookie(
                'access_token',
                access_token,
                httponly=True,
                max_age=3600, # 1 hour
                samesite='Lax'
            )
            response.set_cookie(
                'refresh_token',
                refresh_token,
                httponly=True,
                max_age=86400, # 1 day
                samesite='Lax'
            )
            user = User.objects.filter(phone_number=request.data.get('phone_number')).first()
            if user:
                AuditLog.objects.create(
                    user=user,
                    farm=get_user_farm(user),
                    event_type=AuditLog.EventType.AUTH,
                    action='LOGIN',
                    model_name='User',
                    object_id=str(user.id),
                    metadata={'phone_verified': user.phone_verified},
                )
        return response

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        # If refresh token is in cookie, inject it into body
        if 'refresh_token' in request.COOKIES and 'refresh' not in request.data:
            request.data['refresh'] = request.COOKIES['refresh_token']
        
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            access_token = response.data.get('access')
            response.set_cookie(
                'access_token',
                access_token,
                httponly=True,
                max_age=3600,
                samesite='Lax'
            )
        return response

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        if not self.request.user.is_superuser:
            raise exceptions.PermissionDenied(
                'Account details can only be modified by a Super Admin. Please submit an in-app support request.'
            )
        instance = serializer.save()
        if instance.indemnity_agreed and not instance.indemnity_agreed_at:
            instance.indemnity_agreed_at = timezone.now()
            instance.save(update_fields=['indemnity_agreed_at'])
        AuditLog.objects.create(
            user=self.request.user,
            farm=get_user_farm(self.request.user),
            event_type=AuditLog.EventType.SECURITY,
            action='PROFILE_UPDATED',
            model_name='User',
            object_id=str(instance.id),
            metadata={'updated_by_superadmin': True}
        )

class RequestOTPView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = OTPSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone_number']
            import random
            otp = f"{random.randint(100000, 999999)}"
            user = User.objects.filter(phone_number=phone).first()
            expires_at = timezone.now() + timedelta(minutes=10)
            if user:
                user.otp_hash = make_password(otp)
                user.otp_expires_at = expires_at
                user.otp_attempts = 0
                user.save(update_fields=['otp_hash', 'otp_expires_at', 'otp_attempts'])
            AuditLog.objects.create(
                user=user,
                farm=get_user_farm(user),
                event_type=AuditLog.EventType.SECURITY,
                action='OTP_REQUESTED',
                model_name='User',
                object_id=str(user.id) if user else '',
                metadata={
                    'phone_number': str(phone),
                    'otp_code': otp,
                    'expires_at': expires_at.isoformat(),
                },
            )
            from django.conf import settings
            response_payload = {"message": "OTP generated successfully."}
            if getattr(settings, 'DEBUG', False):
                response_payload["test_mode_otp"] = otp
            return Response(response_payload, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone_number']
            otp = serializer.validated_data['otp']
            user = User.objects.filter(phone_number=phone).first()
            if not user:
                return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
            if not user.otp_expires_at or user.otp_expires_at < timezone.now():
                return Response({"error": "OTP expired."}, status=status.HTTP_400_BAD_REQUEST)
            if user.otp_attempts >= 5:
                return Response({"error": "Too many OTP attempts."}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            if not check_password(otp, user.otp_hash):
                user.otp_attempts += 1
                user.save(update_fields=['otp_attempts'])
                return Response({"error": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)
            
            update_fields = ['phone_verified', 'otp_hash', 'otp_expires_at', 'otp_attempts']
            user.phone_verified = True
            user.otp_hash = ''
            user.otp_expires_at = None
            user.otp_attempts = 0

            # If user provided password during onboarding, set it
            new_password = serializer.validated_data.get('password')
            if new_password:
                user.set_password(new_password)
                update_fields.append('password')

            # If indemnity was accepted during onboarding
            if serializer.validated_data.get('indemnity_agreed'):
                user.indemnity_agreed = True
                user.indemnity_agreed_at = timezone.now()
                update_fields.extend(['indemnity_agreed', 'indemnity_agreed_at'])

            user.save(update_fields=update_fields)

            AuditLog.objects.create(
                user=user,
                farm=get_user_farm(user),
                event_type=AuditLog.EventType.SECURITY,
                action='OTP_VERIFIED',
                model_name='User',
                object_id=str(user.id),
                metadata={'indemnity_agreed': user.indemnity_agreed}
            )

            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "OTP verified successfully.",
                "phone_verified": True,
                "indemnity_agreed": user.indemnity_agreed,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkerAccountViewSet(ModelViewSet):
    serializer_class = WorkerAccountSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        if self.request.user.role != User.Role.FARMER:
            return User.objects.none()
        farm = get_user_farm(self.request.user)
        return User.objects.filter(assigned_farm=farm, role=User.Role.FARM_WORKER).order_by('full_name')

    def perform_create(self, serializer):
        if self.request.user.role != User.Role.FARMER:
            raise exceptions.PermissionDenied('Only the head farmer can manage worker accounts.')
        farm = get_user_farm(self.request.user)
        if not farm:
            raise exceptions.ValidationError({'detail': 'No active farm associated with this farmer account.'})

        import secrets
        import string
        raw_password = serializer.validated_data.pop('password', None)
        if not raw_password:
            alphabet = string.ascii_letters + string.digits
            raw_password = ''.join(secrets.choice(alphabet) for _ in range(10))
            is_temporary = True
        else:
            is_temporary = False

        worker = User.objects.create_user(
            phone_number=serializer.validated_data['phone_number'],
            full_name=serializer.validated_data['full_name'],
            password=raw_password,
            email=serializer.validated_data.get('email', ''),
            role=User.Role.FARM_WORKER,
            assigned_farm=farm,
            accessible_modules=serializer.validated_data.get('accessible_modules', []),
            national_id=serializer.validated_data.get('national_id', ''),
            emergency_contact_name=serializer.validated_data.get('emergency_contact_name', ''),
            emergency_contact_phone=serializer.validated_data.get('emergency_contact_phone', ''),
            worker_specialty=serializer.validated_data.get('worker_specialty', ''),
            indemnity_agreed=serializer.validated_data.get('indemnity_agreed', False),
            indemnity_agreed_at=timezone.now() if serializer.validated_data.get('indemnity_agreed') else None,
        )
        if is_temporary:
            worker._temporary_password = raw_password

        serializer.instance = worker

        AuditLog.objects.create(
            user=self.request.user,
            farm=farm,
            event_type=AuditLog.EventType.SECURITY,
            action='WORKER_CREATED',
            model_name='User',
            object_id=str(worker.id),
            metadata={'worker_phone': str(worker.phone_number), 'has_temp_password': is_temporary},
        )

    def perform_update(self, serializer):
        if self.request.user.role != User.Role.FARMER:
            raise exceptions.PermissionDenied('Only the head farmer can manage worker accounts.')
        farm = get_user_farm(self.request.user)
        worker = serializer.instance
        if worker.assigned_farm != farm:
            raise exceptions.PermissionDenied('You can only update workers assigned to your farm.')
        worker = serializer.save()
        password = serializer.validated_data.get('password')
        if password:
            worker.set_password(password)
            worker.save(update_fields=['password'])

    def perform_destroy(self, instance):
        if self.request.user.role != User.Role.FARMER:
            raise exceptions.PermissionDenied('Only the head farmer can deactivate worker accounts.')
        farm = get_user_farm(self.request.user)
        if instance.assigned_farm != farm:
            raise exceptions.PermissionDenied('You can only deactivate workers assigned to your farm.')
        instance.is_active = False
        instance.save(update_fields=['is_active'])
