from django.core.management.base import BaseCommand
from quotation.models import Quotation
from quotation.terms_models import TermsMaster, QuotationTerms


class Command(BaseCommand):
    help = 'Add default terms to existing quotations that don\'t have terms'

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
        
        added_count = 0
        skipped_count = 0
        
        for quotation in all_quotations:
            # Check if quotation already has terms
            existing_terms_count = QuotationTerms.objects.filter(quotation=quotation).count()
            
            if existing_terms_count > 0:
                self.stdout.write(
                    self.style.WARNING(f'⏭️  Skipped {quotation.quotation_no} (already has {existing_terms_count} terms)')
                )
                skipped_count += 1
                continue
            
            # Add default terms to this quotation
            terms_created = 0
            for master_term in default_terms:
                QuotationTerms.objects.create(
                    quotation=quotation,
                    master_term=master_term,
                    title=master_term.title,
                    content=master_term.content,
                    sequence=master_term.sequence,
                    is_customized=False
                )
                terms_created += 1
            
            self.stdout.write(
                self.style.SUCCESS(f'✅ Added {terms_created} terms to {quotation.quotation_no}')
            )
            added_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'\n📊 Summary:')
        )
        self.stdout.write(
            self.style.SUCCESS(f'   - Total quotations: {all_quotations.count()}')
        )
        self.stdout.write(
            self.style.SUCCESS(f'   - Terms added to: {added_count}')
        )
        self.stdout.write(
            self.style.WARNING(f'   - Skipped: {skipped_count}')
        )
