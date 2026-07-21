from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('lead_management', '0007_lead_is_converted_converted_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='customer',
            name='is_lead_only',
            field=models.BooleanField(
                default=False,
                help_text='True = created from a lead, not yet converted to customer. Hidden from Customers page.'
            ),
        ),
    ]
