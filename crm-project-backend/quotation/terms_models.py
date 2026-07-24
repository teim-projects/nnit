from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class TermsMaster(models.Model):
    """
    Master Terms & Conditions that can be reused across quotations
    """
    title = models.CharField(max_length=255, help_text="Term title/heading")
    content = models.TextField(help_text="Full term description/content")
    sequence = models.IntegerField(default=1, help_text="Display order")
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(
        default=False, 
        help_text="Automatically included in new quotations"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="created_terms"
    )

    class Meta:
        ordering = ['sequence', 'title']
        verbose_name = "Terms & Conditions Master"
        verbose_name_plural = "Terms & Conditions Masters"

    def __str__(self):
        return f"{self.sequence}. {self.title}"


class QuotationTerms(models.Model):
    """
    Terms & Conditions attached to a specific quotation
    Can be customized per quotation
    """
    quotation = models.ForeignKey(
        'Quotation',
        on_delete=models.CASCADE,
        related_name='terms'
    )
    master_term = models.ForeignKey(
        TermsMaster,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Reference to master term if not customized"
    )
    
    # These fields allow per-quotation customization
    title = models.CharField(max_length=255)
    content = models.TextField()
    sequence = models.IntegerField(default=1)
    is_customized = models.BooleanField(
        default=False,
        help_text="True if this term was modified from the master"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sequence']
        verbose_name = "Quotation Terms & Conditions"
        verbose_name_plural = "Quotation Terms & Conditions"
        unique_together = ['quotation', 'sequence']

    def __str__(self):
        return f"{self.quotation.quotation_no} - {self.sequence}. {self.title}"

    def save(self, *args, **kwargs):
        # Auto-populate from master term if not customized
        if self.master_term and not self.is_customized:
            self.title = self.master_term.title
            self.content = self.master_term.content
            if not self.sequence or self.sequence == 1:
                self.sequence = self.master_term.sequence
        super().save(*args, **kwargs)
