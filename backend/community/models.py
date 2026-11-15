from django.conf import settings
from django.db import models


class CommunityPost(models.Model):
    class PostType(models.TextChoices):
        DISCUSSION = 'DISCUSSION', 'Discussion'
        PRICE = 'PRICE', 'Dairy Price'
        ALERT = 'ALERT', 'County Alert'
        TREND = 'TREND', 'Trend'
        SURPLUS = 'SURPLUS', 'Surplus Milk'
        LOW_MILK = 'LOW_MILK', 'Low Milk Flag'

    community = models.ForeignKey('DairyCommunity', on_delete=models.CASCADE, related_name='posts', null=True, blank=True)
    farm = models.ForeignKey('farms.Farm', on_delete=models.SET_NULL, related_name='community_posts', null=True, blank=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='community_posts')
    post_type = models.CharField(max_length=20, choices=PostType.choices, default=PostType.DISCUSSION)
    county = models.CharField(max_length=100, blank=True)
    title = models.CharField(max_length=160)
    body = models.TextField()
    milk_price_kes = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    litres_available = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    preferred_pickup_time = models.CharField(max_length=120, blank=True)
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return f"{self.post_type}: {self.title}"


class DairyCommunity(models.Model):
    name = models.CharField(max_length=120)
    county = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_dairy_communities')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class CommunityMember(models.Model):
    community = models.ForeignKey(DairyCommunity, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dairy_community_memberships')
    farm = models.ForeignKey('farms.Farm', on_delete=models.SET_NULL, related_name='community_memberships', null=True, blank=True)
    display_name = models.CharField(max_length=120, blank=True)
    role = models.CharField(max_length=30, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('community', 'user')

    def __str__(self):
        return f"{self.display_name or self.user.full_name} in {self.community.name}"
