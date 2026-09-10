from django.core.management.base import BaseCommand
from amc.models import AMCContract
from django.db import connection


class Command(BaseCommand):
    help = 'Check AMC contracts health and identify issues'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🔍 Checking AMC Contracts Health...\n'))
        
        total_contracts = AMCContract.objects.count()
        self.stdout.write(f'Total AMC Contracts: {total_contracts}\n')
        
        issues_found = []
        
        # Check 1: Contracts without customer
        no_customer = AMCContract.objects.filter(customer__isnull=True).count()
        if no_customer > 0:
            issues_found.append(f'❌ {no_customer} contracts have no customer')
            self.stdout.write(self.style.ERROR(f'❌ {no_customer} contracts have no customer'))
        else:
            self.stdout.write(self.style.SUCCESS('✅ All contracts have customers'))
        
        # Check 2: Contracts without dates
        no_dates = AMCContract.objects.filter(start_date__isnull=True).count()
        if no_dates > 0:
            issues_found.append(f'⚠️  {no_dates} contracts have no start date')
            self.stdout.write(self.style.WARNING(f'⚠️  {no_dates} contracts have no start date'))
        else:
            self.stdout.write(self.style.SUCCESS('✅ All contracts have start dates'))
        
        # Check 3: Contracts without cycles
        for amc in AMCContract.objects.all():
            if amc.cycles.count() == 0:
                issues_found.append(f'⚠️  Contract {amc.contract_id} has no cycles')
        
        if not issues_found:
            self.stdout.write(self.style.SUCCESS('\n✅ No issues found! All AMC contracts are healthy.'))
        else:
            self.stdout.write(self.style.WARNING(f'\n⚠️  Found {len(issues_found)} issue(s):'))
            for issue in issues_found:
                self.stdout.write(f'  - {issue}')
        
        # Test serialization
        self.stdout.write('\n🧪 Testing serialization of first 5 contracts...')
        from amc.serializers import AMCContractSerializer
        
        test_contracts = AMCContract.objects.all()[:5]
        for amc in test_contracts:
            try:
                data = AMCContractSerializer(amc).data
                self.stdout.write(self.style.SUCCESS(f'✅ Contract {amc.contract_id}: OK'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'❌ Contract {amc.contract_id}: {str(e)}'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Health check complete!'))
