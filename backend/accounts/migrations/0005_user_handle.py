# Generated for user handle support

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_user_alt_phone_user_emergency_contact_name_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='handle',
            field=models.CharField(
                blank=True,
                db_index=True,
                help_text='Unique social and community handle without spaces (e.g. baraka_farm, kiprono_dvm)',
                max_length=50,
                null=True,
                unique=True,
                verbose_name='handle',
            ),
        ),
    ]
