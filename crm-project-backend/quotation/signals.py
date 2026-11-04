from django.db.models.signals import post_save
from django.dispatch import receiver
from quotation.models import Quotation
from quotation.terms_models import TermsMaster, QuotationTerms


@receiver(post_save, sender=Quotation)
def create_default_terms_for_quotation(sender, instance, created, **kwargs):
    """
    Automatically add default terms to newly created quotations
    """
    if created:
        # Get all default terms
        default_terms = TermsMaster.objects.filter(
            is_default=True,
            is_active=True
        ).order_by('sequence')
        
        # Create QuotationTerms for each default term
        for master_term in default_terms:
            QuotationTerms.objects.create(
                quotation=instance,
                master_term=master_term,
                title=master_term.title,
                content=master_term.content,
                sequence=master_term.sequence,
                is_customized=False
            )
        
        print(f"✅ Added {default_terms.count()} default terms to Quotation {instance.quotation_no}")
