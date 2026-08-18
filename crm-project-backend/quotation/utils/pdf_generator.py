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


_BASE64_SIGNATURE_CACHE = None

def _get_base64_signature():
    """Get cached base64 encoded signature or load and cache it."""
    global _BASE64_SIGNATURE_CACHE
    if _BASE64_SIGNATURE_CACHE is not None:
        return _BASE64_SIGNATURE_CACHE

    try:
        candidate_paths = [
            os.path.join(settings.BASE_DIR, 'static', 'images', 'sign.png'),
            os.path.join(settings.BASE_DIR, 'static', 'images', 'sign.jpg'),
            os.path.join(settings.BASE_DIR, 'static', 'images', 'signature.png'),
            os.path.join(settings.BASE_DIR, 'static', 'images', 'signature.jpg'),
        ]

        found_path = None
        for p in candidate_paths:
            if os.path.exists(p):
                found_path = p
                break

        if found_path:
            with open(found_path, 'rb') as f:
                _BASE64_SIGNATURE_CACHE = base64.b64encode(f.read()).decode('utf-8')
        else:
            _BASE64_SIGNATURE_CACHE = ''
    except Exception as e:
        logger.warning(f"Could not load signature image: {str(e)}")
        _BASE64_SIGNATURE_CACHE = ''

    return _BASE64_SIGNATURE_CACHE


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

        # Car capacity calculation: check snapshot, master product, or default to 2 cars/unit
        car_capacity = 0
        if item.product_data:
            car_capacity = item.product_data.get('car_capacity') or item.product_data.get('capacity') or 0

        if not car_capacity and item.product_data and item.product_data.get('id'):
            try:
                from parking_products.models import ParkingProduct
                p_obj = ParkingProduct.objects.filter(id=item.product_data.get('id')).first()
                if p_obj and p_obj.car_capacity:
                    car_capacity = p_obj.car_capacity
            except Exception:
                pass

        if not car_capacity:
            car_capacity = 2

        try:
            total_cars_num = int(car_capacity) * qty
            total_cars = f"{total_cars_num} Cars"
        except Exception:
            total_cars = f"{qty * 2} Cars"

        # Load capacity lookup and formatting (e.g. 2.5 Ton Capacity / 2 Ton Capacity)
        load_cap = 0
        if item.product_data:
            load_cap = item.product_data.get('load_capacity', 0)

        if not load_cap and item.product_data and item.product_data.get('id'):
            try:
                from parking_products.models import ParkingProduct
                p_obj = ParkingProduct.objects.filter(id=item.product_data.get('id')).first()
                if p_obj and p_obj.load_capacity:
                    load_cap = float(p_obj.load_capacity)
            except Exception:
                pass

        load_cap_str = ""
        if load_cap:
            try:
                val = float(load_cap)
                if val >= 1000:
                    ton_val = val / 1000.0
                    if ton_val.is_integer():
                        load_cap_str = f"{int(ton_val)} Ton Capacity"
                    else:
                        load_cap_str = f"{ton_val:.1f} Ton Capacity"
                elif val > 0:
                    if val.is_integer():
                        load_cap_str = f"{int(val)} Ton Capacity"
                    else:
                        load_cap_str = f"{val:.1f} Ton Capacity"
            except Exception:
                load_cap_str = f"{load_cap} Capacity"

        product_name_full = item.product_data.get('name', '') if item.product_data else ''
        description = item.description or product_name_full or "Parking System"

        if load_cap_str and "Capacity" not in description and "Ton" not in description and "KG" not in description:
            description = f"{description}\n{load_cap_str}"

        inst_amt = Decimal(str(getattr(item, 'mathadi_charges', None) or 0))
        inst_fmt = _fmt_inr(inst_amt) if inst_amt > 0 else '—'

        line_items.append({
            'description': description,
            'quantity': qty,
            'unit_price': unit_price,
            'unit_price_fmt': _fmt_inr(unit_price),
            'installation': inst_amt,
            'installation_fmt': inst_fmt,
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

    # Format dynamic Offer No: NNIT/{MM}-{YYYY}/{SEQ}RV{VERSION_NUM} (e.g. NNIT/08-2026/003RV3)
    raw_no = quotation.quotation_no or ""
    date_ref = version.created_at if (version and getattr(version, 'created_at', None)) else (quotation.created_at if getattr(quotation, 'created_at', None) else datetime.now())
    m_str = date_ref.strftime("%m")
    y_str = date_ref.strftime("%Y")
    seq_str = f"{quotation.id:03d}" if quotation.id else "001"

    if "/" in raw_no:
        parts = raw_no.split("/")
        last_p = parts[-1]
        for delim in ["RV", "-R", "R"]:
            if delim in last_p:
                last_p = last_p.split(delim)[0]
                break
        parts[-1] = last_p
        base_offer_no = "/".join(parts)
    else:
        base_offer_no = f"NNIT/{m_str}-{y_str}/{seq_str}"

    if not base_offer_no.startswith("NNIT/"):
        base_offer_no = f"NNIT/{m_str}-{y_str}/{seq_str}"

    v_str = str(getattr(version, 'version_no', '') or '')
    version_num = "1"
    if "R" in v_str:
        num_part = v_str.split("R")[-1]
        if num_part.isdigit():
            version_num = num_part

    formatted_offer_no = f"{base_offer_no}RV{version_num}"

    # Contact person / Signatory name for NNIT Car Parking Systems Pvt Ltd
    contact_person_name = getattr(quotation, 'contact_person', None)
    if not contact_person_name or contact_person_name.strip() == "" or (quotation.customer and contact_person_name == quotation.customer.name):
        contact_person_name = "Nilesh Sali"

    quotation_date_str = date_ref.strftime("%d/%m/%Y")
    base64_signature = _get_base64_signature()

    return {
        'quotation': quotation,
        'version': version,
        'formatted_offer_no': formatted_offer_no,
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
        'transport_charges': Decimal(str(getattr(version, 'transportation_charges', 0) or 0)),
        'transport_charges_fmt': _fmt_inr(Decimal(str(getattr(version, 'transportation_charges', 0) or 0))),
        'packing_forwarding_charges': Decimal(str(getattr(version, 'packing_forwarding_charges', 0) or 0)),
        'packing_forwarding_charges_fmt': _fmt_inr(Decimal(str(getattr(version, 'packing_forwarding_charges', 0) or 0))),
        'loading_unloading_charges': Decimal(str(getattr(version, 'loading_unloading_charges', 0) or 0)),
        'loading_unloading_charges_fmt': _fmt_inr(Decimal(str(getattr(version, 'loading_unloading_charges', 0) or 0))),
        'insurance_charges': Decimal(str(getattr(version, 'insurance_charges', 0) or 0)),
        'insurance_charges_fmt': _fmt_inr(Decimal(str(getattr(version, 'insurance_charges', 0) or 0))),
        'miscellaneous_charges': Decimal(str(getattr(version, 'miscellaneous_charges', 0) or 0)),
        'miscellaneous_charges_fmt': _fmt_inr(Decimal(str(getattr(version, 'miscellaneous_charges', 0) or 0))),
        'grand_total_fmt': grand_total_fmt,
        'amount_in_words': grand_total_words,
        'terms': processed_terms,
        'base64_logo': base64_logo,  # Cached base64 logo
        'base64_signature': base64_signature,
        'contact_person_name': contact_person_name,
        'quotation_date': quotation_date_str,
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
