from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from service_management.notifications import process_all_2day_service_reminders


class Command(BaseCommand):
    help = "Send 2-day prior email notifications to Customer, Technician, and Admin for scheduled services."

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=2,
            help='Number of days ahead to look for scheduled services (default: 2).'
        )
        parser.add_argument(
            '--date',
            type=str,
            help='Target scheduled date in YYYY-MM-DD format (overrides --days).'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force re-sending reminders even if already marked sent.'
        )

    def handle(self, *args, **options):
        days_ahead = options['days']
        date_str = options['date']
        force = options['force']

        if date_str:
            try:
                target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
            except ValueError:
                self.stderr.write(self.style.ERROR(f"Invalid date format '{date_str}'. Please use YYYY-MM-DD."))
                return
        else:
            target_date = timezone.now().date() + timedelta(days=days_ahead)

        self.stdout.write(self.style.NOTICE(f"Processing service reminders for target date: {target_date} (Force: {force})..."))

        summary = process_all_2day_service_reminders(target_date=target_date, force=force)

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully processed {summary['processed']} service(s) scheduled for {target_date}. Total found: {summary['total_services_found']}."
            )
        )
        for detail in summary['details']:
            self.stdout.write(
                f" - [{detail['service_id']}] Cust Email Sent: {detail['customer_email_sent']} | Tech Email Sent: {detail['technician_email_sent']} | Admin Email Sent: {detail['admin_email_sent']}"
            )
