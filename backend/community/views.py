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
        display_name = self.request.user.full_name
        if self.request.user.role == 'AGGREGATOR' and hasattr(self.request.user, 'aggregator_profile'):
            org = self.request.user.aggregator_profile.organization_name
            display_name = f"{self.request.user.full_name} ({org})" if org else self.request.user.full_name
        elif self.request.user.role == 'VETERINARIAN' and hasattr(self.request.user, 'vet_profile'):
            display_name = f"Dr. {self.request.user.full_name}"
        CommunityMember.objects.get_or_create(
            community=community,
            user=self.request.user,
            defaults={'farm': farm, 'display_name': display_name, 'role': 'admin' if self.request.user.role == 'FARMER' else self.request.user.role.lower()},
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

    @action(detail=True, methods=['post'], url_path='join')
    def join(self, request, pk=None):
        community = self.get_object()
        farm = get_user_farm(request.user)
        display_name = request.user.full_name
        if request.user.role == 'AGGREGATOR' and hasattr(request.user, 'aggregator_profile'):
            org = request.user.aggregator_profile.organization_name
            display_name = f"{request.user.full_name} ({org})" if org else request.user.full_name
        elif request.user.role == 'VETERINARIAN' and hasattr(request.user, 'vet_profile'):
            display_name = f"Dr. {request.user.full_name}"
        role = 'member' if request.user.role == 'FARMER' else request.user.role.lower()
        member, created = CommunityMember.objects.get_or_create(
            community=community,
            user=request.user,
            defaults={'farm': farm, 'display_name': display_name, 'role': role},
        )
        return Response({
            'message': 'Joined successfully.' if created else 'Already a member.',
            'member': CommunityMemberSerializer(member).data
        }, status=status.HTTP_200_OK)

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
        county = serializer.validated_data.get('county')
        if not county:
            if hasattr(self.request.user, 'aggregator_profile'):
                counties = self.request.user.aggregator_profile.operating_counties
                county = counties[0] if isinstance(counties, list) and len(counties) > 0 else (counties or '')
            elif farm:
                county = farm.county
        post = serializer.save(farm=farm, author=self.request.user, community=community, county=county or '')
        AuditLog.objects.create(
            user=self.request.user,
            farm=farm,
            event_type=AuditLog.EventType.COMMUNITY,
            action='POST_CREATED',
            model_name='CommunityPost',
            object_id=str(post.id),
            metadata={'post_type': post.post_type, 'county': post.county, 'milk_price_kes': str(post.milk_price_kes or '')},
        )
