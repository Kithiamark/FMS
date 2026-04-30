from rest_framework import serializers
from .models import CommunityMember, CommunityPost, DairyCommunity


class CommunityMemberSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    farm_name = serializers.CharField(source='farm.name', read_only=True)

    class Meta:
        model = CommunityMember
        fields = '__all__'
        read_only_fields = ('community', 'user', 'farm', 'joined_at')


class DairyCommunitySerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(source='members.count', read_only=True)
    members = CommunityMemberSerializer(many=True, read_only=True)

    class Meta:
        model = DairyCommunity
        fields = '__all__'
        read_only_fields = ('created_by',)


class CommunityPostSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    community_name = serializers.CharField(source='community.name', read_only=True)

    class Meta:
        model = CommunityPost
        fields = '__all__'
        read_only_fields = ('farm', 'author', 'is_pinned')
