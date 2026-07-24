# quotation/utils/pdf_generator.py
from django.template.loader import render_to_string
from decimal import Decimal
from django.conf import settings
import logging

try:
    from weasyprint import HTML
except Exception:  # pragma: no cover - depends on OS native libs
    HTML = None

logger = logging.getLogger(__name__)


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

    for item in high_items:
        qty = int(item.quantity or 0)
        unit_price = Decimal(str(item.unit_price or 0))
        base = qty * unit_price
        gst_amt = Decimal(str(item.gst_amount or 0))
        total = base + gst_amt

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
            'total': total,
            'total_fmt': _fmt_inr(total),
        })

    basic_total = sum((i['total'] for i in line_items), Decimal('0'))
    cgst = Decimal(str(version.cgst_amount or 0))
    sgst = Decimal(str(version.sgst_amount or 0))
    igst = Decimal(str(version.igst_amount or 0))
    grand_total = Decimal(str(version.grand_total or 0))

    gst_type = version.gst_type or "CGST_SGST"
    half_pct = "9.00" if gst_type == "CGST_SGST" else "0.00"
    total_gst_pct = float(version.gst_amount or 0) / float(basic_total) * 100 if basic_total else 18

    # Filler rows to give table some visual height (min 3 rows)
    filler_count = max(0, 3 - len(line_items))

    # Product name for project box
    first_item = high_items[0] if high_items else None
    product_name = (first_item.product_data.get('name', '') if first_item and first_item.product_data else '') or quotation.subject or "Parking System"

    project_name = quotation.site_name or (quotation.site.site_name if quotation.site else None) or quotation.subject or "—"

    # Get Terms & Conditions for this quotation
    from quotation.terms_models import QuotationTerms
    quotation_terms = QuotationTerms.objects.filter(
        quotation=quotation
    ).order_by('sequence')

    return {
        'quotation': quotation,
        'version': version,
        'project_name': project_name,
        'product_name': product_name,
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
        'grand_total_fmt': _fmt_inr(grand_total),
        'amount_in_words': _amount_in_words(grand_total),
        'terms': quotation_terms,  # Add terms to context
    }


def generate_quotation_pdf(quotation, version, base_url=None):
    """
    Generate quotation PDF — Annexure I format matching NNIT style.
    """
    try:
        if HTML is None:
            raise RuntimeError(
                "PDF generation is unavailable. Install WeasyPrint system libraries first."
            )
        context = _build_simple_quotation_context(quotation, version)
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
    Design stage: uses a dummy items table. Existing /pdf/ endpoints unchanged.
    """
    if HTML is None:
        raise RuntimeError(
            "PDF generation is unavailable on this machine. Install WeasyPrint system libraries first."
        )
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

    context = {
        'quotation': quotation,
        'version': version,
        'dummy_rows': dummy_rows,
        'subtotal': subtotal,
        'gst_amount': gst_amount,
        'grand_total': grand_total,
        'gst_percentage': gst_pct,
        'terms': quotation_terms,  # Add terms to context
    }

    html_string = render_to_string('pdf/quotation_print.html', context)
    pdf = HTML(
        string=html_string,
        base_url=base_url or getattr(settings, 'ABSOLUTE_URL', '/'),
    ).write_pdf()
    return pdf
