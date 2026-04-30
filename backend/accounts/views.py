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

class RequestOTPView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = OTPSerializer(data=request.data)
        if serializer.is_valid():
            phone = serializer.validated_data['phone_number']
            otp = '123456'  # Testing mode. Replace with random OTP when SMS keys are configured.
            user = User.objects.filter(phone_number=phone).first()
            if user:
                user.otp_hash = make_password(otp)
                user.otp_expires_at = timezone.now() + timedelta(minutes=10)
                user.otp_attempts = 0
                user.save(update_fields=['otp_hash', 'otp_expires_at', 'otp_attempts'])
            AuditLog.objects.create(
                user=user,
                farm=get_user_farm(user),
                event_type=AuditLog.EventType.SECURITY,
                action='OTP_REQUESTED',
                model_name='User',
                object_id=str(user.id) if user else '',
                metadata={'test_mode': True, 'phone_number': str(phone)},
            )
            return Response({"message": "OTP sent successfully.", "test_mode_otp": otp}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(views.APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
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
            user.phone_verified = True
            user.otp_hash = ''
            user.otp_expires_at = None
            user.otp_attempts = 0
            user.save(update_fields=['phone_verified', 'otp_hash', 'otp_expires_at', 'otp_attempts'])
            AuditLog.objects.create(
                user=user,
                farm=get_user_farm(user),
                event_type=AuditLog.EventType.SECURITY,
                action='OTP_VERIFIED',
                model_name='User',
                object_id=str(user.id),
            )
            return Response({"message": "OTP verified", "phone_verified": True}, status=status.HTTP_200_OK)
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
        password = serializer.validated_data.pop('password', None) or 'ChangeMe123'
        worker = User.objects.create_user(
            phone_number=serializer.validated_data['phone_number'],
            full_name=serializer.validated_data['full_name'],
            password=password,
            email=serializer.validated_data.get('email', ''),
            role=User.Role.FARM_WORKER,
            assigned_farm=farm,
        )
        AuditLog.objects.create(
            user=self.request.user,
            farm=farm,
            event_type=AuditLog.EventType.SECURITY,
            action='WORKER_CREATED',
            model_name='User',
            object_id=str(worker.id),
            metadata={'worker_phone': str(worker.phone_number)},
        )

    def perform_update(self, serializer):
        worker = serializer.save()
        password = serializer.validated_data.get('password')
        if password:
            worker.set_password(password)
            worker.save(update_fields=['password'])

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=['is_active'])
