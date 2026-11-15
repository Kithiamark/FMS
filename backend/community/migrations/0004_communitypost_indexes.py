# Generated for community post query indexes

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('community', '0003_alter_communitymember_farm_alter_communitypost_farm'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='communitypost',
            index=models.Index(fields=['community', '-created_at'], name='community_c_communi_7b1d9c_idx'),
        ),
        migrations.AddIndex(
            model_name='communitypost',
            index=models.Index(fields=['county', '-created_at'], name='community_c_county_4e69b2_idx'),
        ),
        migrations.AddIndex(
            model_name='communitypost',
            index=models.Index(fields=['post_type', '-created_at'], name='community_c_post_ty_9a82cd_idx'),
        ),
    ]
