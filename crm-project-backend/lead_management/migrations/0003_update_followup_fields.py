# Generated migration for updated Lead and Follow-up models

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('lead_management', '0002_remove_leadfollowupproduct_followup_and_more'),
    ]

    operations = [
        # Add new fields to Customer
        migrations.AddField(
            model_name='customer',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name='customer',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        
        # Add new fields to lead_management
        migrations.AddField(
            model_name='lead_management',
            name='last_followup_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='lead_management',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        migrations.AddField(
            model_name='lead_management',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        
        # Add new fields to LeadFollowUp
        migrations.AddField(
            model_name='leadfollowup',
            name='discussion_notes',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='leadfollowup',
            name='suggested_solution',
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='leadfollowup',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
