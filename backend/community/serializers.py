from rest_framework import serializers
from .models import CommunityMember, CommunityPost, DairyCommunity


class CommunityMemberSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    organization_name = serializers.SerializerMethodField()

    class Meta:
        model = CommunityMember
        fields = '__all__'
        read_only_fields = ('community', 'user', 'farm', 'joined_at')

    def get_organization_name(self, obj):
        if not obj.user:
            return None
        if obj.user.role == 'AGGREGATOR' and hasattr(obj.user, 'aggregator_profile'):
            return obj.user.aggregator_profile.organization_name
        if obj.user.role == 'VETERINARIAN' and hasattr(obj.user, 'vet_profile'):
            return obj.user.vet_profile.clinic_name or obj.user.vet_profile.specialization
        if obj.farm:
            return obj.farm.name
        return None


class DairyCommunitySerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(source='members.count', read_only=True)
    members = CommunityMemberSerializer(many=True, read_only=True)

    class Meta:
        model = DairyCommunity
        fields = '__all__'
        read_only_fields = ('created_by',)


class CommunityPostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    author_role = serializers.CharField(source='author.role', read_only=True)
    author_phone = serializers.CharField(source='author.phone_number', read_only=True)
    author_organization = serializers.SerializerMethodField()
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    community_name = serializers.CharField(source='community.name', read_only=True)

    class Meta:
        model = CommunityPost
        fields = '__all__'
        read_only_fields = ('farm', 'author', 'is_pinned')

    def get_author_organization(self, obj):
        if not obj.author:
            return None
        if obj.author.role == 'AGGREGATOR' and hasattr(obj.author, 'aggregator_profile'):
            return obj.author.aggregator_profile.organization_name
        if obj.author.role == 'VETERINARIAN' and hasattr(obj.author, 'vet_profile'):
            return obj.author.vet_profile.clinic_name or obj.author.vet_profile.specialization
        if obj.farm:
            return obj.farm.name
        return None
