from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.models import AuditLog
from core.utils import get_user_farm
from .models import CommunityMember, CommunityPost, DairyCommunity
from .serializers import CommunityMemberSerializer, CommunityPostSerializer, DairyCommunitySerializer


class DairyCommunityViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DairyCommunitySerializer

    def get_queryset(self):
        return DairyCommunity.objects.prefetch_related('members__user', 'members__farm')

    def perform_create(self, serializer):
        community = serializer.save(created_by=self.request.user)
        farm = get_user_farm(self.request.user)
        CommunityMember.objects.get_or_create(
            community=community,
            user=self.request.user,
            defaults={'farm': farm, 'display_name': self.request.user.full_name, 'role': 'admin'},
        )
        AuditLog.objects.create(
            user=self.request.user,
            farm=farm,
            event_type=AuditLog.EventType.COMMUNITY,
            action='COMMUNITY_CREATED',
            model_name='DairyCommunity',
            object_id=str(community.id),
            metadata={'name': community.name, 'county': community.county},
        )

    @action(detail=True, methods=['post'], url_path='invite')
    def invite(self, request, pk=None):
        community = self.get_object()
        farm = get_user_farm(request.user)
        display_name = request.data.get('display_name') or request.data.get('phone_number') or 'Invited farmer'
        # Test mode invitation: create a visible pending-style member row for workflow demos.
        member, _ = CommunityMember.objects.get_or_create(
            community=community,
            user=request.user,
            defaults={'farm': farm, 'display_name': display_name, 'role': 'inviter'},
        )
        return Response({'message': 'Invite captured in test mode.', 'member': CommunityMemberSerializer(member).data}, status=status.HTTP_200_OK)


class CommunityPostViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CommunityPostSerializer

    def get_queryset(self):
        queryset = CommunityPost.objects.select_related('farm', 'author', 'community')
        county = self.request.query_params.get('county')
        post_type = self.request.query_params.get('type')
        community_id = self.request.query_params.get('community')
        if county:
            queryset = queryset.filter(county__iexact=county)
        if post_type:
            queryset = queryset.filter(post_type=post_type)
        if community_id:
            queryset = queryset.filter(community_id=community_id)
        return queryset[:100]

    def perform_create(self, serializer):
        farm = get_user_farm(self.request.user)
        community = serializer.validated_data.get('community')
        if not community:
            community = DairyCommunity.objects.first()
        post = serializer.save(farm=farm, author=self.request.user, community=community)
        AuditLog.objects.create(
            user=self.request.user,
            farm=farm,
            event_type=AuditLog.EventType.COMMUNITY,
            action='POST_CREATED',
            model_name='CommunityPost',
            object_id=str(post.id),
            metadata={'post_type': post.post_type, 'county': post.county, 'milk_price_kes': str(post.milk_price_kes or '')},
        )
