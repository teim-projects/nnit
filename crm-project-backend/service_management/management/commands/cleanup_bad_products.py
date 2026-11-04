"""
Management command to cleanup bad/test product data
Usage: python manage.py cleanup_bad_products --dry-run
       python manage.py cleanup_bad_products --execute
"""
from django.core.management.base import BaseCommand
from django.db.models import Q


class Command(BaseCommand):
    help = 'Cleanup bad/test product data from parking_products and product_management'

    def add_arguments(self, parser):
        parser.add_argument(
            '--execute',
            action='store_true',
            help='Actually delete the bad data (default is dry-run)',
        )

    def handle(self, *args, **options):
        execute = options['execute']
        
        if execute:
            self.stdout.write(self.style.WARNING('=== EXECUTING CLEANUP (DELETING BAD DATA) ===\n'))
        else:
            self.stdout.write(self.style.SUCCESS('=== DRY RUN MODE (No data will be deleted) ===\n'))

        # Cleanup Parking Products
        self.stdout.write(self.style.WARNING('1. Checking Parking Products...'))
        try:
            from parking_products.models import ParkingProduct
            
            # Find suspicious products
            bad_products = ParkingProduct.objects.filter(
                Q(product_name__startswith='ZDP') | 
                Q(product_name__startswith='ZIP') |
                Q(product_name__icontains='test') |
                Q(product_name__icontains='dummy') |
                Q(product_name__exact='') |
                Q(product_name__isnull=True) |
                Q(product_name__length__lt=3)  # Too short
            )
            
            count = bad_products.count()
            if count > 0:
                self.stdout.write(f'   Found {count} bad parking products:')
                for p in bad_products:
                    self.stdout.write(f'      - ID: {p.id}, Name: "{p.product_name}"')
                
                if execute:
                    deleted = bad_products.delete()
                    self.stdout.write(self.style.SUCCESS(f'   ✓ Deleted {deleted[0]} parking products'))
                else:
                    self.stdout.write(self.style.WARNING('   (Dry run - use --execute to delete)'))
            else:
                self.stdout.write(self.style.SUCCESS('   ✓ No bad parking products found'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   Error: {e}'))

        # Cleanup Generic Products
        self.stdout.write(self.style.WARNING('\n2. Checking Generic Products...'))
        try:
            from product_management.models import Product
            
            # Find suspicious products
            bad_products = Product.objects.filter(
                Q(name__startswith='ZDP') | 
                Q(name__startswith='ZIP') |
                Q(name__icontains='test') |
                Q(name__icontains='dummy') |
                Q(name__exact='') |
                Q(name__isnull=True) |
                Q(name__length__lt=3)  # Too short
            )
            
            count = bad_products.count()
            if count > 0:
                self.stdout.write(f'   Found {count} bad generic products:')
                for p in bad_products[:20]:  # Show first 20
                    p_name = getattr(p, 'name', 'N/A')
                    self.stdout.write(f'      - ID: {p.id}, Name: "{p_name}"')
                
                if count > 20:
                    self.stdout.write(f'      ... and {count - 20} more')
                
                if execute:
                    deleted = bad_products.delete()
                    self.stdout.write(self.style.SUCCESS(f'   ✓ Deleted {deleted[0]} generic products'))
                else:
                    self.stdout.write(self.style.WARNING('   (Dry run - use --execute to delete)'))
            else:
                self.stdout.write(self.style.SUCCESS('   ✓ No bad generic products found'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   Error: {e}'))

        if not execute:
            self.stdout.write(self.style.SUCCESS('\n=== DRY RUN COMPLETE ==='))
            self.stdout.write('To actually delete this data, run:')
            self.stdout.write('  python manage.py cleanup_bad_products --execute')
        else:
            self.stdout.write(self.style.SUCCESS('\n=== CLEANUP COMPLETE ==='))
