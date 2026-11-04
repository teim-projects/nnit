"""
Management command to auto-expire AMC contracts whose end date has passed.

Usage:
    python manage.py expire_amc_contracts
    python manage.py expire_amc_contracts --dry-run

Schedule (cron example - run daily at midnight):
    0 0 * * * cd /app && python manage.py expire_amc_contracts >> /var/log/amc_expiry.log 2>&1
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from amc.models import AMCContract, AMCStatus


class Command(BaseCommand):
    help = 'Auto-expire AMC contracts whose end date has passed'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show which contracts would be expired without making changes',
        )

    def handle(self, *args, **options):
        today = timezone.now().date()
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('=== DRY RUN MODE — No changes will be saved ===\n'))

        self.stdout.write(f'Running AMC expiry check for date: {today}\n')

        # Find all contracts and trigger sync
        contracts = AMCContract.objects.all()
        count = contracts.count()

        if count == 0:
            self.stdout.write(self.style.SUCCESS('✓ No contracts found.'))
            return

        self.stdout.write(f'Processing {count} contract(s):\n')

        expired = 0
        errors = 0

        for contract in contracts:
            try:
                if not dry_run:
                    contract.sync_active_cycle_data()
                    if contract.status == AMCStatus.EXPIRED:
                        expired += 1
                        self.stdout.write(self.style.SUCCESS(f'  → {contract.contract_id} marked EXPIRED'))
                else:
                    self.stdout.write(self.style.WARNING(f'  [DRY RUN] Checked {contract.contract_id}'))

            except Exception as e:
                errors += 1
                self.stdout.write(self.style.ERROR(f'    ✗ Error on {contract.id}: {str(e)}'))
                else:
                    self.stdout.write(self.style.WARNING(f'    [DRY RUN] Would mark EXPIRED'))

            except Exception as e:
                errors += 1
                self.stdout.write(self.style.ERROR(f'    ✗ Error: {str(e)}'))

        self.stdout.write('')
        if not dry_run:
            self.stdout.write(self.style.SUCCESS(f'✓ Expired {expired} contract(s) successfully.'))
            if errors:
                self.stdout.write(self.style.ERROR(f'✗ {errors} error(s) occurred.'))
        else:
            self.stdout.write(self.style.WARNING(f'[DRY RUN] {count} contract(s) would have been expired.'))

        self.stdout.write(self.style.SUCCESS('\nDone!'))
