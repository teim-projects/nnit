import logging
from datetime import timedelta
from django.utils import timezone
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import ServiceRequest, ServiceStatus

logger = logging.getLogger(__name__)
User = get_user_model()


def get_admin_emails():
    """Returns a list of admin emails to notify."""
    admin_emails = set()
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None) or getattr(settings, 'EMAIL_HOST_USER', None)
    if from_email:
        admin_emails.add(from_email)

    try:
        superusers = User.objects.filter(is_superuser=True, is_active=True).exclude(email='').values_list('email', flat=True)
        for email in superusers:
            if email:
                admin_emails.add(email)
    except Exception as e:
        logger.warning(f"Error fetching superuser emails: {e}")

    return list(admin_emails)


def send_2day_service_reminder(service):
    """
    Sends 2-day prior service reminder emails to:
    1. Customer
    2. Assigned Technician (if assigned and email exists)
    3. Admin
    
    Updates reminder_2days_sent = True on success.
    """
    results = {
        "service_id": service.service_id or f"SRV-{service.id}",
        "customer_email_sent": False,
        "technician_email_sent": False,
        "admin_email_sent": False,
        "errors": []
    }

    customer = service.customer
    technician = service.assigned_technician
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'connectteim@gmail.com')
    scheduled_date_str = service.scheduled_date.strftime("%d %B %Y (%A)") if service.scheduled_date else "Scheduled Soon"

    # Common details
    customer_name = getattr(customer, 'name', None) or getattr(customer, 'company_name', None) or "Valued Customer"
    customer_email = getattr(customer, 'email', None) or getattr(customer, 'secondary_email', None)
    customer_phone = getattr(customer, 'contact_number', None) or getattr(customer, 'poc_contact_number', None) or "N/A"
    site_address = getattr(customer, 'site_address', None) or getattr(customer, 'address', None) or "Address on record"
    
    tech_name = technician.name if technician else "To be assigned"
    tech_email = technician.email if (technician and technician.email) else None
    tech_phone = technician.phone if technician else "N/A"
    tech_spec = technician.specialization if technician else "General Maintenance"

    product_name = service.product_name or "Car Parking / Service Equipment"
    service_title = service.title or "Routine Service & Maintenance Visit"
    service_type_display = service.get_service_type_display() if hasattr(service, 'get_service_type_display') else service.service_type

    # Header Image URL
    header_img_url = "https://files.catbox.moe/4i67y4.jpg"

    # =========================================================================
    # 1. CUSTOMER EMAIL
    # =========================================================================
    if customer_email:
        cust_subject = f"Reminder: Upcoming Service in 2 Days [{service.service_id or 'Service'}] — NNIT Systems"
        cust_html = f'''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#f4f6f9; margin:0; padding:20px; color:#333;">
  <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
    <img src="{header_img_url}" alt="NNIT Car Parking Systems" style="width:100%; display:block; border:0;" />
    <div style="padding:28px; line-height:1.6;">
      <div style="display:inline-block; background-color:#dbeafe; color:#1e40af; font-size:13px; font-weight:600; padding:6px 14px; border-radius:20px; margin-bottom:15px;">
        🗓️ Upcoming Service Notice — 2 Days Left
      </div>
      <h2 style="color:#0f172a; margin-top:5px; margin-bottom:15px; font-size:22px;">Dear {customer_name},</h2>
      <p style="font-size:15px; color:#475569;">
        This is a friendly reminder from <strong>NNIT Car Parking Systems</strong> that your service visit is scheduled in <strong>2 days</strong> on <span style="color:#2563eb; font-weight:700;">{scheduled_date_str}</span>.
      </p>
      
      <div style="background-color:#f8fafc; border-left:4px solid #2563eb; padding:18px; border-radius:6px; margin:20px 0;">
        <h4 style="margin:0 0 12px 0; color:#1e293b; font-size:16px;">📌 Service Details:</h4>
        <table style="width:100%; border-collapse:collapse; font-size:14px; color:#334155;">
          <tr><td style="padding:4px 0; width:40%; font-weight:600;">Service ID:</td><td>{service.service_id or 'N/A'}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Service Type:</td><td>{service_type_display}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Product / Equipment:</td><td>{product_name}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Subject / Title:</td><td>{service_title}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Scheduled Date:</td><td style="color:#2563eb; font-weight:700;">{scheduled_date_str}</td></tr>
        </table>
      </div>

      <div style="background-color:#f1f5f9; padding:16px; border-radius:8px; margin-bottom:20px;">
        <h4 style="margin:0 0 8px 0; color:#0f172a; font-size:15px;">👨‍🔧 Assigned Technician Info:</h4>
        <p style="margin:0; font-size:14px; color:#475569;">
          <strong>Name:</strong> {tech_name}<br>
          <strong>Contact Phone:</strong> {tech_phone}<br>
          <strong>Specialization:</strong> {tech_spec}
        </p>
      </div>

      <p style="font-size:14px; color:#64748b;">
        Please ensure the site is accessible for our technician. If you need to reschedule or have questions, please reach out to us.
      </p>
      
      <hr style="border:0; border-top:1px solid #e2e8f0; margin:25px 0;">
      <p style="margin:0; font-size:13px; color:#94a3b8; text-align:center;">
        Thank you for choosing <strong>NNIT Car Parking Systems</strong>!<br>
        Need help? Contact support at <a href="mailto:{from_email}" style="color:#2563eb;">{from_email}</a>
      </p>
    </div>
  </div>
</body>
</html>'''

        try:
            msg = EmailMultiAlternatives(cust_subject, f"Dear {customer_name},\nYour service {service.service_id or ''} is scheduled in 2 days on {scheduled_date_str}.", from_email, [customer_email])
            msg.attach_alternative(cust_html, "text/html")
            msg.send(fail_silently=False)
            results["customer_email_sent"] = True
            logger.info(f"Customer 2-day reminder email sent to {customer_email} for service {service.service_id}")
        except Exception as e:
            err_msg = f"Failed customer email ({customer_email}): {str(e)}"
            logger.error(err_msg)
            results["errors"].append(err_msg)

    # =========================================================================
    # 2. TECHNICIAN EMAIL
    # =========================================================================
    if tech_email:
        tech_subject = f"Work Reminder: Service Scheduled in 2 Days [{service.service_id or 'Service'}]"
        tech_html = f'''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#f4f6f9; margin:0; padding:20px; color:#333;">
  <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
    <img src="{header_img_url}" alt="NNIT Car Parking Systems" style="width:100%; display:block; border:0;" />
    <div style="padding:28px; line-height:1.6;">
      <div style="display:inline-block; background-color:#fef3c7; color:#92400e; font-size:13px; font-weight:600; padding:6px 14px; border-radius:20px; margin-bottom:15px;">
        ⚠️ Work Assignment Reminder — Scheduled in 2 Days
      </div>
      <h2 style="color:#0f172a; margin-top:5px; margin-bottom:15px; font-size:22px;">Hello {tech_name},</h2>
      <p style="font-size:15px; color:#475569;">
        You have an upcoming service assignment scheduled in <strong>2 days</strong> on <span style="color:#d97706; font-weight:700;">{scheduled_date_str}</span>. Please review the assignment details below:
      </p>

      <div style="background-color:#fffbeb; border-left:4px solid #f59e0b; padding:18px; border-radius:6px; margin:20px 0;">
        <h4 style="margin:0 0 12px 0; color:#78350f; font-size:16px;">🛠️ Service Assignment Details:</h4>
        <table style="width:100%; border-collapse:collapse; font-size:14px; color:#451a03;">
          <tr><td style="padding:4px 0; width:40%; font-weight:600;">Service ID:</td><td>{service.service_id or 'N/A'}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Service Type:</td><td>{service_type_display}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Product / Equipment:</td><td>{product_name}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Title / Task:</td><td>{service_title}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Scheduled Date:</td><td style="color:#d97706; font-weight:700;">{scheduled_date_str}</td></tr>
        </table>
      </div>

      <div style="background-color:#f8fafc; padding:16px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:20px;">
        <h4 style="margin:0 0 8px 0; color:#0f172a; font-size:15px;">🏢 Customer & Site Information:</h4>
        <p style="margin:0; font-size:14px; color:#334155;">
          <strong>Customer Name:</strong> {customer_name}<br>
          <strong>Contact Number:</strong> {customer_phone}<br>
          <strong>Site Address:</strong> {site_address}
        </p>
      </div>

      {f'<div style="background-color:#f1f5f9; padding:12px; border-radius:6px; font-size:14px; color:#475569; margin-bottom:20px;"><strong>Work Instructions:</strong> {service.description}</div>' if service.description else ''}

      <p style="font-size:14px; color:#64748b;">
        Please prepare necessary tools/spares and arrive at the site on time.
      </p>
    </div>
  </div>
</body>
</html>'''

        try:
            msg = EmailMultiAlternatives(tech_subject, f"Hello {tech_name},\nYou have a service task {service.service_id or ''} scheduled in 2 days on {scheduled_date_str}.", from_email, [tech_email])
            msg.attach_alternative(tech_html, "text/html")
            msg.send(fail_silently=False)
            results["technician_email_sent"] = True
            logger.info(f"Technician 2-day reminder email sent to {tech_email} for service {service.service_id}")
        except Exception as e:
            err_msg = f"Failed technician email ({tech_email}): {str(e)}"
            logger.error(err_msg)
            results["errors"].append(err_msg)

    # =========================================================================
    # 3. ADMIN EMAIL
    # =========================================================================
    admin_emails = get_admin_emails()
    if admin_emails:
        admin_subject = f"Admin Notification: Service Scheduled in 2 Days [{service.service_id or 'Service'}]"
        admin_html = f'''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#f4f6f9; margin:0; padding:20px; color:#333;">
  <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
    <img src="{header_img_url}" alt="NNIT Car Parking Systems" style="width:100%; display:block; border:0;" />
    <div style="padding:28px; line-height:1.6;">
      <div style="display:inline-block; background-color:#ecfdf5; color:#047857; font-size:13px; font-weight:600; padding:6px 14px; border-radius:20px; margin-bottom:15px;">
        📢 Admin System Alert — Service Scheduled in 2 Days
      </div>
      <h2 style="color:#0f172a; margin-top:5px; margin-bottom:15px; font-size:20px;">Service Reminder Alert</h2>
      <p style="font-size:15px; color:#475569;">
        The following service is scheduled to take place in <strong>2 days</strong> on <span style="color:#059669; font-weight:700;">{scheduled_date_str}</span>.
      </p>

      <div style="background-color:#f0fdf4; border-left:4px solid #10b981; padding:18px; border-radius:6px; margin:20px 0;">
        <table style="width:100%; border-collapse:collapse; font-size:14px; color:#064e3b;">
          <tr><td style="padding:4px 0; width:40%; font-weight:600;">Service ID:</td><td>{service.service_id or 'N/A'}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Service Type:</td><td>{service_type_display}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Customer Name:</td><td>{customer_name} ({customer_email or customer_phone})</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Assigned Technician:</td><td>{tech_name} ({tech_phone})</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Product / Equipment:</td><td>{product_name}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Scheduled Date:</td><td style="color:#059669; font-weight:700;">{scheduled_date_str}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Status:</td><td>{service.get_status_display() if hasattr(service, 'get_status_display') else service.status}</td></tr>
        </table>
      </div>

      <p style="font-size:13px; color:#64748b;">
        ✅ Customer Email Sent: <strong>{'Yes' if results['customer_email_sent'] else 'No / Skipped'}</strong><br>
        ✅ Technician Email Sent: <strong>{'Yes' if results['technician_email_sent'] else 'No / Skipped'}</strong>
      </p>
    </div>
  </div>
</body>
</html>'''

        try:
            msg = EmailMultiAlternatives(admin_subject, f"Admin Alert: Service {service.service_id or ''} scheduled in 2 days on {scheduled_date_str}.", from_email, admin_emails)
            msg.attach_alternative(admin_html, "text/html")
            msg.send(fail_silently=False)
            results["admin_email_sent"] = True
            logger.info(f"Admin 2-day reminder alert email sent to {admin_emails} for service {service.service_id}")
        except Exception as e:
            err_msg = f"Failed admin email ({admin_emails}): {str(e)}"
            logger.error(err_msg)
            results["errors"].append(err_msg)

    # Mark reminder sent on service record
    service.reminder_2days_sent = True
    service.reminder_2days_sent_at = timezone.now()
    service.save(update_fields=['reminder_2days_sent', 'reminder_2days_sent_at'])

    return results


def send_2day_amc_contract_expiry_reminder(amc_contract):
    """
    Sends 2-day prior AMC Contract Expiry & Renewal Reminder emails to:
    1. Customer
    2. Support Coordinator / Assigned Technician
    3. Admin
    """
    results = {
        "contract_id": amc_contract.contract_id or f"AMC-{amc_contract.id}",
        "customer_email_sent": False,
        "technician_email_sent": False,
        "admin_email_sent": False,
        "errors": []
    }

    customer = amc_contract.customer
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'connectteim@gmail.com')
    end_date_str = amc_contract.end_date.strftime("%d %B %Y (%A)") if amc_contract.end_date else "N/A"

    customer_name = getattr(customer, 'name', None) or getattr(customer, 'company_name', None) or "Valued Customer"
    customer_email = getattr(customer, 'email', None) or getattr(customer, 'secondary_email', None)
    
    tech = amc_contract.assigned_technician
    tech_name = tech.name if tech else "General AMC Team"
    tech_email = tech.email if (tech and tech.email) else None

    header_img_url = "https://files.catbox.moe/4i67y4.jpg"

    # Customer AMC Renewal Notice
    if customer_email:
        cust_subject = f"AMC Contract Expiring in 2 Days [{amc_contract.contract_id or 'AMC'}] — Renewal Notice"
        cust_html = f'''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#f4f6f9; margin:0; padding:20px; color:#333;">
  <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
    <img src="{header_img_url}" alt="NNIT Car Parking Systems" style="width:100%; display:block; border:0;" />
    <div style="padding:28px; line-height:1.6;">
      <div style="display:inline-block; background-color:#fff7ed; color:#c2410c; font-size:13px; font-weight:600; padding:6px 14px; border-radius:20px; margin-bottom:15px;">
        ⏳ AMC Contract Expiry Alert — 2 Days Remaining
      </div>
      <h2 style="color:#0f172a; margin-top:5px; margin-bottom:15px; font-size:22px;">Dear {customer_name},</h2>
      <p style="font-size:15px; color:#475569;">
        Your Annual Maintenance Contract (AMC) <strong>{amc_contract.contract_id or ''}</strong> with <strong>NNIT Car Parking Systems</strong> is expiring in <strong>2 days</strong> on <span style="color:#ea580c; font-weight:700;">{end_date_str}</span>.
      </p>

      <div style="background-color:#fff7ed; border-left:4px solid #ea580c; padding:18px; border-radius:6px; margin:20px 0;">
        <h4 style="margin:0 0 12px 0; color:#9a3412; font-size:16px;">📜 AMC Contract Summary:</h4>
        <table style="width:100%; border-collapse:collapse; font-size:14px; color:#7c2d12;">
          <tr><td style="padding:4px 0; width:40%; font-weight:600;">Contract ID:</td><td>{amc_contract.contract_id or 'N/A'}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Product / Equipment:</td><td>{amc_contract.product}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">AMC Type:</td><td>{amc_contract.get_amc_type_display()}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Contract Expiry Date:</td><td style="color:#ea580c; font-weight:700;">{end_date_str}</td></tr>
        </table>
      </div>

      <p style="font-size:14px; color:#475569;">
        To ensure uninterrupted maintenance, priority support, and regular inspection visits, please renew your AMC contract today.
      </p>

      <hr style="border:0; border-top:1px solid #e2e8f0; margin:25px 0;">
      <p style="margin:0; font-size:13px; color:#94a3b8; text-align:center;">
        Thank you for trusting <strong>NNIT Car Parking Systems</strong>!<br>
        For AMC Renewal queries, contact <a href="mailto:{from_email}" style="color:#ea580c;">{from_email}</a>
      </p>
    </div>
  </div>
</body>
</html>'''

        try:
            msg = EmailMultiAlternatives(cust_subject, f"Dear {customer_name},\nYour AMC contract {amc_contract.contract_id or ''} is expiring in 2 days on {end_date_str}.", from_email, [customer_email])
            msg.attach_alternative(cust_html, "text/html")
            msg.send(fail_silently=False)
            results["customer_email_sent"] = True
        except Exception as e:
            results["errors"].append(str(e))

    # Admin Alert for AMC Contract Expiry
    admin_emails = get_admin_emails()
    if admin_emails:
        admin_subject = f"Admin Alert: AMC Contract Expiring in 2 Days [{amc_contract.contract_id or 'AMC'}]"
        admin_html = f'''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#f4f6f9; margin:0; padding:20px; color:#333;">
  <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
    <img src="{header_img_url}" alt="NNIT Car Parking Systems" style="width:100%; display:block; border:0;" />
    <div style="padding:28px; line-height:1.6;">
      <div style="display:inline-block; background-color:#fef2f2; color:#dc2626; font-size:13px; font-weight:600; padding:6px 14px; border-radius:20px; margin-bottom:15px;">
        🚨 Admin AMC Expiry Notification — 2 Days Left
      </div>
      <h2 style="color:#0f172a; margin-top:5px; margin-bottom:15px; font-size:20px;">AMC Renewal Reminder Alert</h2>
      <p style="font-size:15px; color:#475569;">
        The AMC Contract <strong>{amc_contract.contract_id or ''}</strong> for <strong>{customer_name}</strong> expires in <strong>2 days</strong> on <span style="color:#dc2626; font-weight:700;">{end_date_str}</span>.
      </p>

      <div style="background-color:#fef2f2; border-left:4px solid #ef4444; padding:18px; border-radius:6px; margin:20px 0;">
        <table style="width:100%; border-collapse:collapse; font-size:14px; color:#991b1b;">
          <tr><td style="padding:4px 0; width:40%; font-weight:600;">Contract ID:</td><td>{amc_contract.contract_id or 'N/A'}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Customer:</td><td>{customer_name} ({customer_email or 'N/A'})</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Product:</td><td>{amc_contract.product}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Expiry Date:</td><td style="color:#dc2626; font-weight:700;">{end_date_str}</td></tr>
        </table>
      </div>
    </div>
  </div>
</body>
</html>'''

        try:
            msg = EmailMultiAlternatives(admin_subject, f"Admin Alert: AMC Contract {amc_contract.contract_id or ''} expires in 2 days on {end_date_str}.", from_email, admin_emails)
            msg.attach_alternative(admin_html, "text/html")
            msg.send(fail_silently=False)
            results["admin_email_sent"] = True
        except Exception as e:
            results["errors"].append(str(e))

    amc_contract.expiry_reminder_2days_sent = True
    amc_contract.save(update_fields=['expiry_reminder_2days_sent'])

    return results


def send_2day_amc_visit_reminder(visit):
    """
    Sends 2-day prior AMC Service Visit reminder emails to:
    1. Customer
    2. Assigned Technicians (if any assigned)
    3. Admin
    """
    results = {
        "visit_id": visit.id,
        "contract_id": visit.amc_contract.contract_id if visit.amc_contract else "AMC",
        "customer_email_sent": False,
        "technician_email_sent": False,
        "admin_email_sent": False,
        "errors": []
    }

    contract = visit.amc_contract
    customer = contract.customer if contract else None
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'connectteim@gmail.com')
    service_date_str = visit.service_date.strftime("%d %B %Y (%A)") if visit.service_date else "Scheduled Soon"

    customer_name = getattr(customer, 'name', None) or getattr(customer, 'company_name', None) or "Valued Customer"
    customer_email = getattr(customer, 'email', None) or getattr(customer, 'secondary_email', None)
    customer_phone = getattr(customer, 'contact_number', None) or getattr(customer, 'poc_contact_number', None) or "N/A"
    site_address = getattr(customer, 'site_address', None) or getattr(customer, 'address', None) or "Address on record"

    techs = list(visit.technicians.all())
    if not techs and contract and contract.assigned_technician:
        techs = [contract.assigned_technician]

    tech_names = ", ".join([t.name for t in techs]) if techs else "To be assigned"
    tech_emails = [t.email for t in techs if t.email]
    tech_phones = ", ".join([t.phone for t in techs if t.phone]) or "N/A"

    product_name = visit.product.name if (visit.product and hasattr(visit.product, 'name')) else (contract.product if contract else "Car Parking System")

    header_img_url = "https://files.catbox.moe/4i67y4.jpg"

    # Customer Email
    if customer_email:
        cust_subject = f"Reminder: AMC Service Visit in 2 Days [{contract.contract_id or 'AMC'}] — NNIT Systems"
        cust_html = f'''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#f4f6f9; margin:0; padding:20px; color:#333;">
  <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
    <img src="{header_img_url}" alt="NNIT Car Parking Systems" style="width:100%; display:block; border:0;" />
    <div style="padding:28px; line-height:1.6;">
      <div style="display:inline-block; background-color:#dbeafe; color:#1e40af; font-size:13px; font-weight:600; padding:6px 14px; border-radius:20px; margin-bottom:15px;">
        ⚙️ Scheduled AMC Visit — 2 Days Remaining
      </div>
      <h2 style="color:#0f172a; margin-top:5px; margin-bottom:15px; font-size:22px;">Dear {customer_name},</h2>
      <p style="font-size:15px; color:#475569;">
        This is a friendly reminder from <strong>NNIT Car Parking Systems</strong> that your scheduled AMC Maintenance Visit is in <strong>2 days</strong> on <span style="color:#2563eb; font-weight:700;">{service_date_str}</span>.
      </p>

      <div style="background-color:#f8fafc; border-left:4px solid #2563eb; padding:18px; border-radius:6px; margin:20px 0;">
        <h4 style="margin:0 0 12px 0; color:#1e293b; font-size:16px;">📌 AMC Visit Details:</h4>
        <table style="width:100%; border-collapse:collapse; font-size:14px; color:#334155;">
          <tr><td style="padding:4px 0; width:40%; font-weight:600;">Contract ID:</td><td>{contract.contract_id or 'N/A'}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Product / Equipment:</td><td>{product_name}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Scheduled Visit Date:</td><td style="color:#2563eb; font-weight:700;">{service_date_str}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Assigned Technician:</td><td>{tech_names} ({tech_phones})</td></tr>
        </table>
      </div>

      <p style="font-size:14px; color:#64748b;">
        Our service engineer will inspect and perform preventive maintenance for your parking system. Please ensure site access.
      </p>
    </div>
  </div>
</body>
</html>'''

        try:
            msg = EmailMultiAlternatives(cust_subject, f"Dear {customer_name},\nYour scheduled AMC visit is in 2 days on {service_date_str}.", from_email, [customer_email])
            msg.attach_alternative(cust_html, "text/html")
            msg.send(fail_silently=False)
            results["customer_email_sent"] = True
        except Exception as e:
            results["errors"].append(str(e))

    # Technician Emails
    if tech_emails:
        tech_subject = f"Work Assignment Reminder: AMC Visit Scheduled in 2 Days [{contract.contract_id or 'AMC'}]"
        tech_html = f'''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#f4f6f9; margin:0; padding:20px; color:#333;">
  <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
    <img src="{header_img_url}" alt="NNIT Car Parking Systems" style="width:100%; display:block; border:0;" />
    <div style="padding:28px; line-height:1.6;">
      <div style="display:inline-block; background-color:#fef3c7; color:#92400e; font-size:13px; font-weight:600; padding:6px 14px; border-radius:20px; margin-bottom:15px;">
        ⚠️ AMC Service Visit Reminder — 2 Days Left
      </div>
      <h2 style="color:#0f172a; margin-top:5px; margin-bottom:15px; font-size:22px;">Hello {tech_names},</h2>
      <p style="font-size:15px; color:#475569;">
        You have an assigned AMC service visit scheduled in <strong>2 days</strong> on <span style="color:#d97706; font-weight:700;">{service_date_str}</span>.
      </p>

      <div style="background-color:#fffbeb; border-left:4px solid #f59e0b; padding:18px; border-radius:6px; margin:20px 0;">
        <table style="width:100%; border-collapse:collapse; font-size:14px; color:#451a03;">
          <tr><td style="padding:4px 0; width:40%; font-weight:600;">Contract ID:</td><td>{contract.contract_id or 'N/A'}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Customer Name:</td><td>{customer_name} ({customer_phone})</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Product / Equipment:</td><td>{product_name}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Site Address:</td><td>{site_address}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Scheduled Date:</td><td style="color:#d97706; font-weight:700;">{service_date_str}</td></tr>
        </table>
      </div>
    </div>
  </div>
</body>
</html>'''

        try:
            msg = EmailMultiAlternatives(tech_subject, f"Hello {tech_names},\nYou have an AMC service visit scheduled in 2 days on {service_date_str}.", from_email, tech_emails)
            msg.attach_alternative(tech_html, "text/html")
            msg.send(fail_silently=False)
            results["technician_email_sent"] = True
        except Exception as e:
            results["errors"].append(str(e))

    # Admin Email
    admin_emails = get_admin_emails()
    if admin_emails:
        admin_subject = f"Admin Alert: AMC Visit Scheduled in 2 Days [{contract.contract_id or 'AMC'}]"
        admin_html = f'''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif; background-color:#f4f6f9; margin:0; padding:20px; color:#333;">
  <div style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
    <img src="{header_img_url}" alt="NNIT Car Parking Systems" style="width:100%; display:block; border:0;" />
    <div style="padding:28px; line-height:1.6;">
      <div style="display:inline-block; background-color:#ecfdf5; color:#047857; font-size:13px; font-weight:600; padding:6px 14px; border-radius:20px; margin-bottom:15px;">
        📢 Admin Alert — AMC Service Visit in 2 Days
      </div>
      <h2 style="color:#0f172a; margin-top:5px; margin-bottom:15px; font-size:20px;">Scheduled AMC Visit Notice</h2>
      <p style="font-size:15px; color:#475569;">
        AMC Visit for contract <strong>{contract.contract_id or ''}</strong> is scheduled in <strong>2 days</strong> on <span style="color:#059669; font-weight:700;">{service_date_str}</span>.
      </p>

      <div style="background-color:#f0fdf4; border-left:4px solid #10b981; padding:18px; border-radius:6px; margin:20px 0;">
        <table style="width:100%; border-collapse:collapse; font-size:14px; color:#064e3b;">
          <tr><td style="padding:4px 0; width:40%; font-weight:600;">Contract ID:</td><td>{contract.contract_id or 'N/A'}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Customer:</td><td>{customer_name} ({customer_email or customer_phone})</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Technician(s):</td><td>{tech_names}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Product:</td><td>{product_name}</td></tr>
          <tr><td style="padding:4px 0; font-weight:600;">Scheduled Date:</td><td style="color:#059669; font-weight:700;">{service_date_str}</td></tr>
        </table>
      </div>
    </div>
  </div>
</body>
</html>'''

        try:
            msg = EmailMultiAlternatives(admin_subject, f"Admin Alert: AMC visit {contract.contract_id or ''} scheduled in 2 days on {service_date_str}.", from_email, admin_emails)
            msg.attach_alternative(admin_html, "text/html")
            msg.send(fail_silently=False)
            results["admin_email_sent"] = True
        except Exception as e:
            results["errors"].append(str(e))

    visit.reminder_sent = True
    visit.reminder_sent_at = timezone.now()
    visit.save(update_fields=['reminder_sent', 'reminder_sent_at'])

    return results


def process_all_2day_service_reminders(target_date=None, force=False):
    """
    Finds all services (Warranty, AMC, Normal), AMC Service Visits AND AMC Contracts expiring on `target_date` (defaults to today + 2 days).
    Sends reminders to Customer, Technician, and Admin.
    """
    if target_date is None:
        target_date = timezone.now().date() + timedelta(days=2)

    query = ServiceRequest.objects.filter(scheduled_date=target_date)
    if not force:
        query = query.filter(reminder_2days_sent=False).exclude(
            status__in=[ServiceStatus.COMPLETED, ServiceStatus.CANCELLED]
        )

    services = list(query)
    summary = {
        "target_date": str(target_date),
        "total_services_found": len(services),
        "processed": 0,
        "success_count": 0,
        "amc_expiry_processed": 0,
        "amc_visits_processed": 0,
        "details": []
    }

    # 1. Service Requests (AMC Visits, Warranty Visits, Normal Visits)
    for srv in services:
        res = send_2day_service_reminder(srv)
        summary["processed"] += 1
        summary["success_count"] += 1
        summary["details"].append(res)

    # 2. AMC Service Visits (from amc_service_visits table)
    try:
        from amc.models import AMCServiceVisit
        visit_query = AMCServiceVisit.objects.filter(service_date=target_date)
        if not force:
            visit_query = visit_query.filter(reminder_sent=False).exclude(allocation_status='CANCELLED')

        amc_visits = list(visit_query)
        for visit in amc_visits:
            res_visit = send_2day_amc_visit_reminder(visit)
            summary["amc_visits_processed"] += 1
            summary["details"].append(res_visit)
    except Exception as e:
        logger.error(f"Error checking AMC service visits: {e}")

    # 3. AMC Contracts Expiring in 2 Days
    try:
        from amc.models import AMCContract
        amc_query = AMCContract.objects.filter(end_date=target_date)
        if not force:
            amc_query = amc_query.filter(expiry_reminder_2days_sent=False)
        
        expiring_amcs = list(amc_query)
        for amc in expiring_amcs:
            res_amc = send_2day_amc_contract_expiry_reminder(amc)
            summary["amc_expiry_processed"] += 1
            summary["details"].append(res_amc)
    except Exception as e:
        logger.error(f"Error checking expiring AMC contracts: {e}")

    return summary
