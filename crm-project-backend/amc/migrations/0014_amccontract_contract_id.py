from django.db import migrations, models, connection


def add_contract_id_if_missing(apps, schema_editor):
    with connection.cursor() as cursor:
        try:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'amc_amccontract' 
                  AND COLUMN_NAME = 'contract_id'
            """)
            exists = cursor.fetchone()[0]
            if not exists:
                cursor.execute("ALTER TABLE amc_amccontract ADD COLUMN contract_id VARCHAR(50) NULL UNIQUE")
        except Exception as e:
            print(f"Error checking contract_id column: {e}")


class Migration(migrations.Migration):

    dependencies = [
        ('amc', '0013_amcservicevisit_reminder_sent_and_more'),
    ]

    operations = [
        migrations.RunPython(add_contract_id_if_missing, reverse_code=migrations.RunPython.noop),
    ]
