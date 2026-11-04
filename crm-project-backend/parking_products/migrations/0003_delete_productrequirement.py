# Generated migration to remove ProductRequirement model

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('parking_products', '0002_productrequirement'),
    ]

    operations = [
        migrations.DeleteModel(
            name='ProductRequirement',
        ),
    ]
