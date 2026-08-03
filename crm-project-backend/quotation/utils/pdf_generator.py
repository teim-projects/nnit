# quotation/utils/pdf_generator.py
from django.template.loader import render_to_string
from decimal import Decimal
from django.conf import settings
import logging
import base64
import os

try:
    from weasyprint import HTML
except Exception:  # pragma: no cover - depends on OS native libs
    HTML = None

logger = logging.getLogger(__name__)

# Cache the base64 logo to avoid re-encoding on every PDF generation
_BASE64_LOGO_CACHE = None

def _get_base64_logo():
    """Get cached base64 encoded logo or load and cache it."""
    global _BASE64_LOGO_CACHE
    
    if _BASE64_LOGO_CACHE is not None:
        return _BASE64_LOGO_CACHE
    
    try:
        logo_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'heder.jpg')
        if os.path.exists(logo_path):
            with open(logo_path, 'rb') as f:
                _BASE64_LOGO_CACHE = base64.b64encode(f.read()).decode('utf-8')
                logger.info("Logo cached successfully")
        else:
            logger.warning(f"Logo file not found: {logo_path}")
            _BASE64_LOGO_CACHE = ''
    except Exception as e:
        logger.warning(f"Could not load header image: {str(e)}")
        _BASE64_LOGO_CACHE = ''
    
    return _BASE64_LOGO_CACHE


def _item_line_amount(item):
    """Return line total including GST and extra charges where stored on the model."""
    total = getattr(item, 'total_with_gst', None)
    if total is not None and total > 0:
        return Decimal(total)

    qty = Decimal(getattr(item, 'quantity', 0) or 0)
    rate = Decimal(getattr(item, 'unit_price', 0) or 0)
    base = qty * rate
    gst = Decimal(getattr(item, 'gst_amount', 0) or 0)
    mathadi = Decimal(getattr(item, 'mathadi_charges', 0) or 0)
    transport = Decimal(getattr(item, 'transportation_charges', 0) or 0)
    return base + gst + mathadi + transport


def _item_base_amount(item):
    base = getattr(item, 'base_amount', None)
    if base is not None and base > 0:
        return Decimal(base)
    qty = Decimal(getattr(item, 'quantity', 0) or 0)
    rate = Decimal(getattr(item, 'unit_price', 0) or 0)
    return qty * rate


def _fmt_inr(value):
    """Format decimal as Indian number e.g. 1170000 → 11,70,000.00"""
    from decimal import Decimal
    n = Decimal(str(value or 0))
    # Split into integer and decimal parts
    int_part = int(n)
    dec_part = int(round((n - int_part) * 100))
    # Indian grouping
    s = str(int_part)
    if len(s) > 3:
        last3 = s[-3:]
        rest = s[:-3]
        groups = []
        while len(rest) > 2:
            groups.append(rest[-2:])
            rest = rest[:-2]
        if rest:
            groups.append(rest)
        groups.reverse()
        s = ",".join(groups) + "," + last3
    return f"{s}.{dec_part:02d}"


def _amount_in_words(amount):
    """Convert amount to words (Indian style)."""
    try:
        from num2words import num2words
        n = int(amount)
        p = int(round((float(amount) - n) * 100))
        words = num2words(n, lang='en_IN').title()
        if p > 0:
            return f"{words} and {num2words(p, lang='en_IN').title()} Paise Only"
        return f"{words} Rupees Only"
    except Exception:
        return str(amount)


def _build_simple_quotation_context(quotation, version):
    """Build context for the Annexure I style PDF matching the NNIT format."""
    from decimal import Decimal

    high_items = list(version.high_side_items.all())
    line_items = []

    running_basic_total = Decimal('0')
    running_gst_total = Decimal('0')

    for item in high_items:
        qty = int(item.quantity or 0)
        unit_price = Decimal(str(item.unit_price or 0))
        base_amt = Decimal(str(getattr(item, 'base_amount', None) or (qty * unit_price)))
        gst_amt = Decimal(str(getattr(item, 'gst_amount', None) or 0))

        # Line item basic total (before GST)
        line_total_basic = base_amt if base_amt > 0 else (qty * unit_price)

        car_capacity = item.product_data.get('car_capacity', 0) if item.product_data else 0
        total_cars = int(car_capacity) * qty if car_capacity else "—"

        product_name_full = item.product_data.get('name', '') if item.product_data else ''
        description = item.description or product_name_full or "Parking System"

        line_items.append({
            'description': description,
            'quantity': qty,
            'unit_price': unit_price,
            'unit_price_fmt': _fmt_inr(unit_price),
            'installation': Decimal('0'),
            'installation_fmt': '—',
            'cars': total_cars,
            'total': line_total_basic,
            'total_fmt': _fmt_inr(line_total_basic),
        })

        running_basic_total += line_total_basic
        running_gst_total += gst_amt

    # Use version subtotal (basic value before GST)
    basic_total = Decimal(str(version.subtotal or 0))
    if basic_total <= 0:
        basic_total = running_basic_total

    grand_total = Decimal(str(version.grand_total or 0))
    if grand_total <= 0:
        grand_total = Decimal(str(version.total_amount or 0))
    if grand_total <= 0:
        grand_total = basic_total + running_gst_total

    gst_type = version.gst_type or "CGST_SGST"
    
    # Calculate exact GST components
    total_gst_amount = Decimal(str(version.gst_amount or 0))
    if total_gst_amount <= 0:
        total_gst_amount = grand_total - basic_total

    if gst_type == "CGST_SGST":
        cgst = Decimal(str(version.cgst_amount or 0))
        sgst = Decimal(str(version.sgst_amount or 0))
        if cgst <= 0 and total_gst_amount > 0:
            cgst = (total_gst_amount / Decimal('2')).quantize(Decimal('0.01'))
            sgst = total_gst_amount - cgst
        igst = Decimal('0')
        half_pct = "9.00"
    else:
        igst = Decimal(str(version.igst_amount or 0))
        if igst <= 0 and total_gst_amount > 0:
            igst = total_gst_amount
        cgst = Decimal('0')
        sgst = Decimal('0')
        half_pct = "0.00"

    total_gst_pct = float((total_gst_amount / basic_total) * 100) if basic_total > 0 else 18.00

    # Filler rows to give table some visual height (min 3 rows)
    filler_count = max(0, 3 - len(line_items))

    # Dynamic Product & Category details
    first_item = high_items[0] if high_items else None
    product_name = ""
    category_name = ""
    operation_type = "Hydraulic"

    if first_item and first_item.product_data:
        p_data = first_item.product_data
        product_name = p_data.get('name', '') or p_data.get('product_name', '')
        category_name = p_data.get('category', '') or p_data.get('category_name', '')

        # Check if master product lookup gives additional category details
        p_id = p_data.get('id')
        if p_id:
            try:
                from parking_products.models import ParkingProduct
                p_obj = ParkingProduct.objects.filter(id=p_id).first()
                if not p_obj:
                    p_obj = ParkingProduct.objects.filter(product_name__iexact=product_name).first()
                if p_obj:
                    if p_obj.category:
                        category_name = p_obj.category.display_name
                    if p_obj.operation_type:
                        operation_type = p_obj.operation_type.title()
            except Exception:
                pass

    if not category_name:
        category_name = "Car Parking Systems"
    if not product_name:
        product_name = quotation.subject or "Parking System"

    # Format full system name: Category + Product Name/Model (e.g. "Hydraulic Stack Car Parking Systems (2DP 101)")
    if category_name.lower() in product_name.lower():
        system_full_name = f"{operation_type} {product_name}"
    elif "parking" in category_name.lower():
        system_full_name = f"{operation_type} {category_name} ({product_name})"
    else:
        system_full_name = f"{operation_type} {category_name} Parking Systems ({product_name})"

    # Display string for Offer Header table (shows Category + Product Name)
    parking_systems_display = f"{category_name} - {product_name}" if category_name != product_name else product_name

    # Project and Location details
    project_name = quotation.site_name or (quotation.site.name if quotation.site else None) or quotation.subject or "—"
    site_city = (quotation.site.city if quotation.site and quotation.site.city else None) or (quotation.customer.city if quotation.customer else None) or ""
    site_location_str = f" at {site_city}" if site_city else ""
    grand_total_words = _amount_in_words(grand_total)
    grand_total_fmt = _fmt_inr(grand_total)

    # Get Terms & Conditions for this quotation with dynamic content injection
    from quotation.terms_models import QuotationTerms
    raw_terms = QuotationTerms.objects.filter(
        quotation=quotation
    ).order_by('sequence')

    processed_terms = []
    for t in raw_terms:
        content = t.content or ""
        seq = t.sequence
        title_lower = (t.title or "").lower()

        # Dynamic injection for Term 1 (Scope of Work)
        if seq == 1 or "scope" in title_lower:
            content = f"<p>The work to be executed under this contract is the complete design, fabrication, assembly/ erection, installation, testing & commissioning <strong>NNIT's {system_full_name}</strong> as per the technical specifications attached.</p>"

        # Dynamic injection for Term 2 (Price & Terms of Payment)
        elif seq == 2 or "price" in title_lower or "payment" in title_lower:
            payment_schedule = """<p>1) 50% of order value including GST @ 18% as advance along with your order.</p>
<p>2) 40% of order value including GST @ 18% after readiness of material against Proforma invoice.</p>
<p>3) 10% of order value including GST @ 18% after successful trial, installation & handover of the System.</p>
<p>Any delay in payments as per the above schedule shall carry interest @ 24% p.a. Our Rates are based on current prices of steel. If rates of steel escalate more than 2% of current prices of steel at the time of execution of the works contract, then our quoted prices will escalate proportionately.</p>"""
            content = f"<p>The total consideration for execution of the above works contract <strong>for \"{project_name}\"{site_location_str}</strong>, shall be inclusive GST <strong>Rs. {grand_total_fmt} ({grand_total_words})</strong> which shall be due and payable as under —</p>{payment_schedule}"

        processed_terms.append({
            'sequence': t.sequence,
            'title': t.title,
            'content': content,
            'is_customized': t.is_customized
        })

    # Get cached base64 logo (fast!)
    base64_logo = _get_base64_logo()

    return {
        'quotation': quotation,
        'version': version,
        'project_name': project_name,
        'product_name': product_name,
        'category_name': category_name,
        'system_full_name': system_full_name,
        'parking_systems_display': parking_systems_display,
        'line_items': line_items,
        'filler_rows': range(filler_count),
        'basic_total_fmt': _fmt_inr(basic_total),
        'gst_type': gst_type,
        'sgst_pct': half_pct,
        'cgst_pct': half_pct,
        'igst_pct': f"{total_gst_pct:.2f}",
        'sgst_fmt': _fmt_inr(sgst),
        'cgst_fmt': _fmt_inr(cgst),
        'igst_fmt': _fmt_inr(igst),
        'grand_total_fmt': grand_total_fmt,
        'amount_in_words': grand_total_words,
        'terms': processed_terms,
        'base64_logo': base64_logo,  # Cached base64 logo
    }


def generate_quotation_pdf(quotation, version, base_url=None):
    """
    Generate quotation PDF — Annexure I format matching NNIT style.
    Version: 2.1 - Updated Terms & Conditions styling
    """
    try:
        if HTML is None:
            raise RuntimeError(
                "PDF generation is unavailable. Install WeasyPrint system libraries first."
            )
        context = _build_simple_quotation_context(quotation, version)
        
        # Force template reload by clearing Django template cache
        from django.template import engines
        from django.template.loader import get_template
        engines.all()  # This triggers cache refresh
        
        # Add version to context to force reload
        context['pdf_version'] = '2.1'
        
        html_string = render_to_string('pdf/quotation.html', context)
        pdf = HTML(
            string=html_string,
            base_url=base_url or getattr(settings, 'ABSOLUTE_URL', '/'),
        ).write_pdf()
        return pdf
    except Exception as e:
        logger.error(f"Error generating quotation PDF: {str(e)}", exc_info=True)
        raise


def generate_quotation_print_pdf(quotation, version, base_url=None):
    """
    New WeasyPrint quotation PDF (invoice-style layout).
    Version: 2.1 - Updated Terms & Conditions styling
    """
    if HTML is None:
        raise RuntimeError(
            "PDF generation is unavailable on this machine. Install WeasyPrint system libraries first."
        )
    
    # Force template reload by clearing Django template cache
    from django.template import engines
    from django.template.loader import get_template
    engines.all()  # This triggers cache refresh
    
    dummy_rows = [
        {
            'sr': 1,
            'description': 'Dummy Item - Copper Pipe 1/2 inch',
            'qty': 10,
            'unit': 'Nos',
            'rate': Decimal('450.00'),
            'amount': Decimal('4500.00'),
        },
        {
            'sr': 2,
            'description': 'Dummy Item - Insulation Tape',
            'qty': 5,
            'unit': 'Nos',
            'rate': Decimal('120.00'),
            'amount': Decimal('600.00'),
        },
        {
            'sr': 3,
            'description': 'Dummy Item - Service Charge',
            'qty': 1,
            'unit': 'Job',
            'rate': Decimal('2500.00'),
            'amount': Decimal('2500.00'),
        },
    ]

    subtotal = sum((row['amount'] for row in dummy_rows), Decimal('0'))
    if version.subtotal and version.gst_amount and version.subtotal > 0:
        gst_pct = (version.gst_amount / version.subtotal) * Decimal('100')
    else:
        gst_pct = Decimal('18')
    gst_amount = (subtotal * gst_pct) / Decimal('100')
    grand_total = subtotal + gst_amount

    # Get Terms & Conditions for this quotation
    from quotation.terms_models import QuotationTerms
    quotation_terms = QuotationTerms.objects.filter(
        quotation=quotation
    ).order_by('sequence')

    # Get cached base64 logo (fast!)
    base64_logo = _get_base64_logo()

    context = {
        'quotation': quotation,
        'version': version,
        'dummy_rows': dummy_rows,
        'subtotal': subtotal,
        'gst_amount': gst_amount,
        'grand_total': grand_total,
        'gst_percentage': gst_pct,
        'terms': quotation_terms,
        'base64_logo': base64_logo,  # Cached base64 logo
    }

    html_string = render_to_string('pdf/quotation_print.html', context)
    pdf = HTML(
        string=html_string,
        base_url=base_url or getattr(settings, 'ABSOLUTE_URL', '/'),
    ).write_pdf()
    return pdf
