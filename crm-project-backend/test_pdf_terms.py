"""
Quick test script to check terms formatting in PDF
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from quotation.models import Quotation, QuotationVersion
from quotation.terms_models import QuotationTerms

# Get a quotation with terms
quotation = Quotation.objects.filter(terms__isnull=False).first()

if not quotation:
    print("❌ No quotation found with terms")
    # Try to get any quotation
    quotation = Quotation.objects.first()
    if not quotation:
        print("❌ No quotations in database")
        exit(1)
    print(f"⚠️  Using quotation without terms: {quotation.quotation_no}")

print(f"✅ Found quotation: {quotation.quotation_no}")

# Get terms
terms = QuotationTerms.objects.filter(quotation=quotation).order_by('sequence')
print(f"✅ Found {terms.count()} terms")

# Check term content format
first_term = terms.first()
print(f"\n📝 First term:")
print(f"   Title: {first_term.title}")
print(f"   Content preview: {first_term.content[:100]}...")
print(f"   Has <p> tags: {'<p>' in first_term.content}")

# Now try to generate PDF
print("\n🔨 Generating PDF...")
try:
    from quotation.utils.pdf_generator import generate_quotation_pdf
    
    version = quotation.versions.filter(is_active=True).first()
    if not version:
        version = quotation.versions.first()
    
    pdf_content = generate_quotation_pdf(quotation, version)
    
    # Save to file
    filename = f"test_quotation_{quotation.id}.pdf"
    with open(filename, 'wb') as f:
        f.write(pdf_content)
    
    print(f"✅ PDF generated successfully: {filename}")
    print(f"   Size: {len(pdf_content)} bytes")
    print(f"\n🎉 Open the PDF to check paragraph formatting!")
    
except Exception as e:
    print(f"❌ Error generating PDF: {str(e)}")
    import traceback
    traceback.print_exc()
