from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('amc', '0015_amccontract_contract_id'),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE amc_amccontract ADD COLUMN IF NOT EXISTS project_name VARCHAR(255) NULL;",
            reverse_sql="",
            state_operations=[
                migrations.AddField(
                    model_name='amccontract',
                    name='project_name',
                    field=models.CharField(blank=True, max_length=255, null=True, verbose_name='Project Name'),
                ),
            ]
        )
    ]
