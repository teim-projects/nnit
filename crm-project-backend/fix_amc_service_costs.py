import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from service_management.models import ServiceRequest
from amc.models import AMCContract

updated_count = 0
for srv in ServiceRequest.objects.filter(amc_contract__isnull=False):
    if srv.amc_contract and srv.amc_contract.annual_value > 0:
        if srv.service_cost != srv.amc_contract.annual_value:
            old_val = srv.service_cost
            srv.service_cost = srv.amc_contract.annual_value
            srv.save(update_fields=['service_cost'])
            updated_count += 1
            print(f"Updated Service Request {srv.service_id or srv.id}: {old_val} -> {srv.service_cost}")

print(f"Total AMC service requests updated to full contract amount: {updated_count}")
