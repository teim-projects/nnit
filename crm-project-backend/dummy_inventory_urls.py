# Temporary file - Add to main urls.py
# This provides dummy inventory endpoints so frontend doesn't crash

from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dummy_terms_list(request):
    """Dummy endpoint - returns empty list for terms & conditions"""
    return Response([])

urlpatterns = [
    path('terms/', dummy_terms_list, name='dummy-terms'),
]
