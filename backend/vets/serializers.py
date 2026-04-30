from rest_framework import serializers
from .models import VetProfile, VetFarmConnection, VetAvailability, VetReview, VetVisit
from accounts.serializers import UserSerializer

class VetAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = VetAvailability
        fields = '__all__'

class VetReviewSerializer(serializers.ModelSerializer):
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    
    class Meta:
        model = VetReview
        fields = ['id', 'rating', 'comment', 'created_at', 'farm_name']

class VetListSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.full_name', read_only=True)
    
    class Meta:
        model = VetProfile
        fields = ['id', 'name', 'profile_photo', 'average_rating', 'consultation_fee_kes', 'specialization', 'county', 'years_experience', 'is_verified']

class VetProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='user.phone_number', read_only=True)
    availability = VetAvailabilitySerializer(many=True, read_only=True)
    reviews = VetReviewSerializer(many=True, read_only=True)
    is_connected = serializers.SerializerMethodField()

    class Meta:
        model = VetProfile
        fields = '__all__'

    def get_is_connected(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated and hasattr(request.user, 'farm'):
            return VetFarmConnection.objects.filter(
                vet=obj, 
                farm=request.user.farm,
                status=VetFarmConnection.Status.ACTIVE
            ).exists()
        return False

class VetFarmConnectionSerializer(serializers.ModelSerializer):
    vet_name = serializers.CharField(source='vet.user.full_name', read_only=True)
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    
    class Meta:
        model = VetFarmConnection
        fields = '__all__'
        read_only_fields = ['status', 'accepted_at', 'created_at']

class VetVisitSerializer(serializers.ModelSerializer):
    vet_name = serializers.CharField(source='vet.user.full_name', read_only=True)
    farm_name = serializers.CharField(source='farm.name', read_only=True)
    
    class Meta:
        model = VetVisit
        fields = '__all__'
