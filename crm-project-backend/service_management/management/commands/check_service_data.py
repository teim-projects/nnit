"""
Management command to check service management data quality
Usage: python manage.py check_service_data
"""
from django.core.management.base import BaseCommand
from django.db.models import Q


class Command(BaseCommand):
    help = 'Check service management data quality and identify issues'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Service Management Data Quality Check ===\n'))

        # Check 1: Products
        self.stdout.write(self.style.WARNING('1. Checking Products...'))
        try:
            from parking_products.models import ParkingProduct
            products = ParkingProduct.objects.all()
            self.stdout.write(f'   Total Parking Products: {products.count()}')
            
            # Check for suspicious names
            suspicious = products.filter(
                Q(product_name__startswith='ZDP') | 
                Q(product_name__startswith='ZIP') |
                Q(product_name__icontains='test') |
                Q(product_name__icontains='dummy')
            )
            
            if suspicious.exists():
                self.stdout.write(self.style.ERROR(f'   ⚠ Found {suspicious.count()} suspicious products:'))
                for p in suspicious:
                    self.stdout.write(f'      - ID: {p.id}, Name: "{p.product_name}"')
            else:
                self.stdout.write(self.style.SUCCESS('   ✓ No suspicious parking products found'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   Error checking parking products: {e}'))

        try:
            from product_management.models import Product
            products = Product.objects.all()
            self.stdout.write(f'   Total Generic Products: {products.count()}')
            
            # Check for suspicious names
            suspicious = products.filter(
                Q(name__startswith='ZDP') | 
                Q(name__startswith='ZIP') |
                Q(name__icontains='test') |
                Q(name__icontains='dummy') |
                Q(name__exact='') |
                Q(name__isnull=True)
            )
            
            if suspicious.exists():
                self.stdout.write(self.style.ERROR(f'   ⚠ Found {suspicious.count()} suspicious generic products:'))
                for p in suspicious[:10]:  # Show first 10
                    self.stdout.write(f'      - ID: {p.id}, Name: "{p.name}"')
            else:
                self.stdout.write(self.style.SUCCESS('   ✓ No suspicious generic products found'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   Error checking generic products: {e}'))

        # Check 2: Customers
        self.stdout.write(self.style.WARNING('\n2. Checking Customers...'))
        try:
            from lead_management.models import Customer
            customers = Customer.objects.filter(is_lead_only=False)
            self.stdout.write(f'   Total Real Customers: {customers.count()}')
            
            # Check for customers without names
            no_name = customers.filter(Q(name='') | Q(name__isnull=True))
            if no_name.exists():
                self.stdout.write(self.style.ERROR(f'   ⚠ Found {no_name.count()} customers without names'))
            else:
                self.stdout.write(self.style.SUCCESS('   ✓ All customers have names'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   Error checking customers: {e}'))

        # Check 3: Technicians
        self.stdout.write(self.style.WARNING('\n3. Checking Technicians...'))
        try:
            from service_management.models import Technician
            technicians = Technician.objects.all()
            active = technicians.filter(status='active')
            self.stdout.write(f'   Total Technicians: {technicians.count()}')
            self.stdout.write(f'   Active Technicians: {active.count()}')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   Error checking technicians: {e}'))

        # Check 4: Service Requests
        self.stdout.write(self.style.WARNING('\n4. Checking Service Requests...'))
        try:
            from service_management.models import ServiceRequest
            services = ServiceRequest.objects.all()
            self.stdout.write(f'   Total Service Requests: {services.count()}')
            
            # Group by status
            statuses = services.values('status').annotate(count=models.Count('id'))
            self.stdout.write('   Status Breakdown:')
            for s in statuses:
                self.stdout.write(f'      - {s["status"]}: {s["count"]}')
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'   Error checking service requests: {e}'))

        self.stdout.write(self.style.SUCCESS('\n=== Check Complete ==='))
