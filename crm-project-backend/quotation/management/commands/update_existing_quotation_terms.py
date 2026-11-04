from django.core.management.base import BaseCommand
from quotation.models import Quotation
from quotation.terms_models import TermsMaster, QuotationTerms


class Command(BaseCommand):
    help = 'Update terms for existing quotations from master terms'

    def handle(self, *args, **options):
        # Get all quotations
        all_quotations = Quotation.objects.all()
        
        # Get default terms
        default_terms = TermsMaster.objects.filter(
            is_default=True,
            is_active=True
        ).order_by('sequence')
        
        if not default_terms.exists():
            self.stdout.write(
                self.style.ERROR('❌ No default terms found! Run "create_default_terms" command first.')
            )
            return
        
        updated_count = 0
        
        for quotation in all_quotations:
            # Delete existing terms
            QuotationTerms.objects.filter(quotation=quotation).delete()
            
            # Add fresh terms from master
            for master_term in default_terms:
                QuotationTerms.objects.create(
                    quotation=quotation,
                    master_term=master_term,
                    title=master_term.title,
                    content=master_term.content,
                    sequence=master_term.sequence,
                    is_customized=False
                )
            
            self.stdout.write(
                self.style.SUCCESS(f'✅ Updated terms for {quotation.quotation_no}')
            )
            updated_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'\n📊 Summary: Updated terms for {updated_count} quotations')
        )
