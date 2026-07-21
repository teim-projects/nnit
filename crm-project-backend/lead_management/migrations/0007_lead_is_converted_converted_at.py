from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('lead_management', '0006_leadfollowup_qualifying_info'),
    ]

    operations = [
        migrations.AddField(
            model_name='lead_management',
            name='is_converted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='lead_management',
            name='converted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
