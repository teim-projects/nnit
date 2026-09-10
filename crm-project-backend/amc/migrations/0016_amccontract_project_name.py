from django.db import migrations, models


def add_project_name_if_missing(apps, schema_editor):
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        cursor.execute("SHOW COLUMNS FROM amc_amccontract LIKE 'project_name';")
        column_exists = cursor.fetchone()
        if not column_exists:
            cursor.execute("ALTER TABLE amc_amccontract ADD COLUMN project_name VARCHAR(255) NULL;")


class Migration(migrations.Migration):

    dependencies = [
        ('amc', '0015_amccontract_contract_id'),
    ]

    operations = [
        migrations.RunPython(
            add_project_name_if_missing,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
