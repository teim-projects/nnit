from django.core.management.base import BaseCommand
from quotation.terms_models import TermsMaster


class Command(BaseCommand):
    help = 'Format terms content with proper HTML paragraph tags'

    def handle(self, *args, **options):
        
        def format_content(text):
            """Convert plain text to HTML paragraphs"""
            # Split by double line breaks (paragraphs)
            paragraphs = text.strip().split('\n\n')
            html_parts = []
            
            for para in paragraphs:
                # Clean up the paragraph
                para = para.strip()
                if para:
                    # Replace single line breaks with spaces
                    para = para.replace('\n', ' ')
                    html_parts.append(f'<p>{para}</p>')
            
            return '\n'.join(html_parts)
        
        terms = TermsMaster.objects.filter(is_default=True, is_active=True)
        
        updated_count = 0
        for term in terms:
            # Format content with HTML
            formatted_content = format_content(term.content)
            term.content = formatted_content
            term.save()
            
            self.stdout.write(
                self.style.SUCCESS(f'✅ Formatted: {term.sequence}. {term.title}')
            )
            updated_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'\n📊 Total formatted: {updated_count} terms')
        )
