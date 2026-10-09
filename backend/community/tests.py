import pytest
from rest_framework.test import APIClient
from rest_framework import status
from accounts.models import User
from farms.models import Farm
from aggregators.models import AggregatorProfile
from vets.models import VetProfile
from community.models import DairyCommunity, CommunityPost, CommunityMember


@pytest.mark.django_db
class TestCommunityAggregatorAccess:
    @pytest.fixture(autouse=True)
    def setup_users(self):
        self.client = APIClient()

        # Farmer with a farm
        self.farmer_user = User.objects.create_user(
            phone_number='+254711111111',
            email='farmer1@example.com',
            full_name='John Farmer',
            role=User.Role.FARMER,
            is_active=True,
        )
        self.farm = Farm.objects.create(
            owner=self.farmer_user,
            name='Green Valley Dairy',
            county='Kiambu',
            size_acres=5.0,
        )

        # Aggregator without a farm
        self.aggregator_user = User.objects.create_user(
            phone_number='+254700999999',
            email='aggregator@example.com',
            full_name='Peter Aggregator',
            role=User.Role.AGGREGATOR,
            is_active=True,
        )
        self.aggregator_profile = AggregatorProfile.objects.create(
            user=self.aggregator_user,
            organization_name='Kiambu Fresh Dairies Hub',
            operating_counties=['Kiambu'],
            is_verified=True,
        )

        # Veterinarian without a farm
        self.vet_user = User.objects.create_user(
            phone_number='+254722222222',
            email='vet@example.com',
            full_name='Mary Vet',
            role=User.Role.VETERINARIAN,
            is_active=True,
        )
        self.vet_profile = VetProfile.objects.create(
            user=self.vet_user,
            clinic_name='Central Vet Clinic',
            license_number='KVB-2026-99',
            specialization='Dairy',
            years_experience=5,
            county='Kiambu',
            is_verified=True,
        )

    def test_aggregator_can_create_community_without_farm(self):
        self.client.force_authenticate(user=self.aggregator_user)
        res = self.client.post('/api/v1/community/groups/', {
            'name': 'Kiambu Dairy Network',
            'county': 'Kiambu',
            'description': 'Dairy discussion and milk collection route updates',
        }, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        community_id = res.data['id']
        community = DairyCommunity.objects.get(id=community_id)
        assert community.created_by == self.aggregator_user

        # Verify aggregator was added as member with business name in display_name
        member = CommunityMember.objects.get(community=community, user=self.aggregator_user)
        assert member.farm is None
        assert 'Kiambu Fresh Dairies Hub' in member.display_name

    def test_aggregator_can_join_community_via_join_action(self):
        # Create community by farmer
        community = DairyCommunity.objects.create(
            name='Central Farmers Circle',
            county='Kiambu',
            created_by=self.farmer_user,
        )

        self.client.force_authenticate(user=self.aggregator_user)
        res = self.client.post(f'/api/v1/community/groups/{community.id}/join/')
        assert res.status_code == status.HTTP_200_OK
        assert res.data['message'] == 'Joined successfully.'

        # Verify member record
        member = CommunityMember.objects.get(community=community, user=self.aggregator_user)
        assert member.farm is None
        assert member.role == 'aggregator'

    def test_aggregator_can_post_price_without_farm(self):
        community = DairyCommunity.objects.create(
            name='Kiambu Dairies',
            county='Kiambu',
            created_by=self.farmer_user,
        )

        self.client.force_authenticate(user=self.aggregator_user)
        res = self.client.post('/api/v1/community/posts/', {
            'community': community.id,
            'title': 'Buying Evening Milk at KES 54/L',
            'body': 'Collection truck will arrive at Githunguri cooling center at 5:30 PM.',
            'post_type': 'PRICE',
            'milk_price_kes': '54.00',
        }, format='json')
        assert res.status_code == status.HTTP_201_CREATED
        post_id = res.data['id']

        post = CommunityPost.objects.get(id=post_id)
        assert post.author == self.aggregator_user
        assert post.farm is None
        assert post.county == 'Kiambu'  # Auto-populated from aggregator_profile.operating_county

    def test_farmer_posts_surplus_and_aggregator_sees_metadata(self):
        community = DairyCommunity.objects.create(
            name='Kiambu Dairies',
            county='Kiambu',
            created_by=self.farmer_user,
        )

        # Farmer creates surplus post
        self.client.force_authenticate(user=self.farmer_user)
        res_post = self.client.post('/api/v1/community/posts/', {
            'community': community.id,
            'title': '60 Litres Evening Milk Available',
            'body': 'Chilled morning and afternoon batch ready for pickup.',
            'post_type': 'SURPLUS',
            'litres_available': '60.00',
            'milk_price_kes': '52.00',
            'preferred_pickup_time': '5:00 PM',
        }, format='json')
        assert res_post.status_code == status.HTTP_201_CREATED

        # Aggregator retrieves posts
        self.client.force_authenticate(user=self.aggregator_user)
        res_list = self.client.get(f'/api/v1/community/posts/?community={community.id}')
        assert res_list.status_code == status.HTTP_200_OK

        posts = res_list.data if isinstance(res_list.data, list) else res_list.data.get('results', [])
        assert len(posts) == 1
        surplus_post = posts[0]

        assert surplus_post['post_type'] == 'SURPLUS'
        assert surplus_post['author_role'] == 'FARMER'
        assert surplus_post['author_organization'] == 'Green Valley Dairy'
        assert surplus_post['author_phone'] == '+254711111111'
        assert float(surplus_post['litres_available']) == 60.0
