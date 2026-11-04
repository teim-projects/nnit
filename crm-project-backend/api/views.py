from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView
from rest_framework.response import Response
from rest_framework import status
from google.oauth2 import id_token  # type: ignore
from google.auth.transport import requests  # type: ignore
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView 
from rest_framework import viewsets
from .serializers import PasswordResetRequestSerializer, PasswordResetConfirmSerializer
import os
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication 
from rest_framework import filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import CustomUser, Role, BranchManagement, SiteManagement
from .serializers import AddStaffSerializer, RoleSerializer, BranchSerializers, SiteSerializers
from .permissions import IsAdminOrSubAdmin, StaffObjectPermission, HasModulePermission
from .pagination import StaffPagination
from rest_framework.decorators import action
User = get_user_model()

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    # callback_url = "http://127.0.0.1:8000/accounts/google/login/callback/"
    callback_url = os.getenv('GOOGLE_CALLBACK_URL')

    def post(self, request, *args, **kwargs):
        """
        Verify Google token → get/create user → issue JWT tokens.
        """
        token = request.data.get("access_token")
        if not token:
            return Response({"error": "Missing access_token"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # ✅ Verify token with Google
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                os.getenv('GOOGLE_CLIENT_ID')
                # "129181997839-0rlmm080229tetuka9c0i83la4r4lhdt.apps.googleusercontent.com"
            )

            email = idinfo.get("email")
            name = idinfo.get("name", "")
            picture = idinfo.get("picture", "")

            # ✅ Get or create user
            user, created = User.objects.get_or_create(email=email)
            if created:
                user.is_active = True
                if hasattr(user, "full_name"):
                    user.full_name = name
                if hasattr(user, "profile_photo") and picture:
                    user.profile_photo = picture
                user.save()

            # ✅ Generate JWT tokens for this user
            refresh = RefreshToken.for_user(user)
            data = {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "email": user.email,
                "name": name,
                "message": "Google login successful"
            }

            return Response(data, status=status.HTTP_200_OK)

        except ValueError as ve:
            return Response({"error": "Invalid Google token", "details": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




# Custom password reset and set password 

class PasswordResetRequestView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password reset email sent."}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class AdminResetPasswordView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        email_or_mobile = request.data.get('email_or_mobile') or request.data.get('email')
        new_password = request.data.get('new_password') or request.data.get('password')
        staff_id = request.data.get('staff_id') or request.data.get('id')

        if not new_password or len(str(new_password)) < 6:
            return Response({"error": "New password must be at least 6 characters."}, status=status.HTTP_400_BAD_REQUEST)

        user = None
        if staff_id:
            user = CustomUser.objects.filter(id=staff_id).first()
        if not user and email_or_mobile:
            user = CustomUser.objects.filter(email__iexact=email_or_mobile).first() or CustomUser.objects.filter(mobile_no=email_or_mobile).first()

        if not user:
            return Response({"error": f"User not found for {email_or_mobile or staff_id}."}, status=status.HTTP_404_NOT_FOUND)

        # Update password in Django MySQL/SQLite database
        user.set_password(new_password)
        user.save()

        return Response({
            "detail": f"Password for {user.email or user.mobile_no} reset successfully in database.",
            "email": user.email,
            "mobile_no": user.mobile_no,
            "id": user.id
        }, status=status.HTTP_200_OK)


# Role section
class RoleViewSet(viewsets.ModelViewSet):
    """
    CRUD for Role model.
    GET allowed for authenticated staff; write operations restricted to admin/subadmin or role_management.
    """
    module_key = 'role_management'
    queryset = Role.objects.all().order_by('id')
    serializer_class = RoleSerializer
    authentication_classes = [JWTAuthentication]   
    pagination_class = None

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsAdminOrSubAdmin(), HasModulePermission()]


# Add Staff section

class StaffViewSet(viewsets.ModelViewSet):
    module_key = 'accounts'
    serializer_class = AddStaffSerializer
    permission_classes = [IsAuthenticated, HasModulePermission]
    authentication_classes = [JWTAuthentication]  
    pagination_class = StaffPagination 
    filter_backends = [DjangoFilterBackend , filters.SearchFilter]
    search_fields = ['^first_name', '=email', 'mobile_no','role__name']
    filterset_fields = ['role']

    def get_queryset(self):
        return CustomUser.objects.filter(is_staff=True)

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'], url_path='all' , permission_classes=[IsAuthenticated])
    def all_staff(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)



from rest_framework.views import APIView

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = AddStaffSerializer(request.user)
        return Response(serializer.data)



# --------------------------------------------------------------------------------
# Branch Management Viewsets
# --------------------------------------------------------------------------------

class BranchManagementViewSet(viewsets.ModelViewSet):
    queryset = BranchManagement.objects.all()
    serializer_class = BranchSerializers
    authentication_classes = [JWTAuthentication]   
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = [
        'name', '=email', 'primary_contact',
        'city', 'state',
    ]
    filterset_fields = ['city', 'state']


# --------------------------------------------------------------------------------
# Site Management Viewsets
# --------------------------------------------------------------------------------

class SiteManagementViewSet(viewsets.ModelViewSet):
    queryset = SiteManagement.objects.all()
    serializer_class = SiteSerializers
    authentication_classes = [JWTAuthentication]   
    permission_classes = [IsAuthenticated]
    filter_backends = [ filters.SearchFilter]
    search_fields = [
        'name',"pincode","owner_contact","owner_name",
        'city', 'state',
    ]
    