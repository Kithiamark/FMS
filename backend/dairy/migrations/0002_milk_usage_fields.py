from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dairy', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='milkrecord',
            name='calf_litres',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
        migrations.AddField(
            model_name='milkrecord',
            name='home_use_litres',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
        migrations.AddField(
            model_name='milkrecord',
            name='sold_litres',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=5),
        ),
    ]
