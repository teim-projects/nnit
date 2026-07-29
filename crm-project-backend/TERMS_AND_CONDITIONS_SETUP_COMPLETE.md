# Terms & Conditions Setup Complete ✅

## What Was Done

### 1. **Default Terms Created**
   - ✅ 18 standard terms & conditions created in database
   - ✅ All terms based on your PDF format
   - ✅ Command: `create_default_terms`

### 2. **Existing Quotations Updated**
   - ✅ Terms added to all existing quotations (2 quotations)
   - ✅ 1 quotation already had terms (skipped)
   - ✅ Command: `add_terms_to_existing_quotations`

### 3. **Automatic Terms Addition**
   - ✅ Signal created to auto-add terms to new quotations
   - ✅ Every new quotation will automatically get all 18 terms
   - ✅ File: `quotation/signals.py`

### 4. **PDF Template Ready**
   - ✅ Terms & Conditions will now appear on separate page
   - ✅ Header repeats on terms page
   - ✅ No overlap with header

## Terms List (18 Total)

1. **Scope of Work**
2. **Price & Terms of Payment**
3. **Taxation**
4. **Validity**
5. **Time line**
6. **Deemed Hand-over**
7. **Design and Subsequent Modifications in the Parking Solution**
8. **Preparation at site**
9. **Title to Property**
10. **Training of Personnel**
11. **Cancellation of contract**
12. **TDS / Withholding Tax**
13. **Intellectual Property Rights**
14. **Arbitration**
15. **Jurisdiction**
16. **Force Major Conditions**
17. **Warranty/ Maintenance**
18. **Exclusions to Warranty**

## How It Works

### For New Quotations
```
User creates quotation
    ↓
Signal automatically triggers
    ↓
18 default terms added automatically
    ↓
PDF generated with terms page
```

### For Existing Quotations
```
Already updated ✅
All existing quotations now have terms
```

## Commands Available

### 1. Create/Update Default Terms
```bash
python manage.py create_default_terms
```
- Creates 18 default master terms
- Can be run anytime to update terms content
- Terms are marked as `is_default=True`

### 2. Add Terms to Existing Quotations
```bash
python manage.py add_terms_to_existing_quotations
```
- Adds default terms to quotations that don't have any
- Skips quotations that already have terms
- Shows summary at the end

## Database Structure

### TermsMaster
- Stores master/default terms
- Can be reused across all quotations
- Fields: `title`, `content`, `sequence`, `is_default`, `is_active`

### QuotationTerms
- Links terms to specific quotations
- Can be customized per quotation
- Fields: `quotation`, `master_term`, `title`, `content`, `sequence`, `is_customized`

## Admin Panel

You can manage terms from Django admin:
1. Go to Admin → Terms & Conditions Master
2. Add/Edit/Delete master terms
3. Set `is_default=True` for terms to auto-include
4. Set `is_active=False` to hide terms

## Customization

### To Edit a Term for Specific Quotation
1. Go to Admin → Quotation Terms & Conditions
2. Find the quotation
3. Edit the term
4. Mark `is_customized=True`

### To Add New Default Term
1. Go to Admin → Terms & Conditions Master
2. Click "Add Term"
3. Fill: Title, Content, Sequence
4. Check: `is_default` and `is_active`
5. Save
6. New quotations will automatically get this term

## PDF Display

### Page 1: Quotation Details
- Header (with logo)
- Project info
- Items table
- Totals
- Amount in words
- Signature section

### Page 2: Terms & Conditions
- Header repeats (fixed)
- Title: "TERMS & CONDITIONS"
- All 18 terms listed
- Clean formatting
- Signature section at bottom

## Result Summary

✅ **Terms Created**: 18 default terms
✅ **Quotations Updated**: 2 quotations
✅ **Auto-add Enabled**: New quotations get terms automatically
✅ **PDF Ready**: Terms will show on page 2

## Testing

1. **Create a new quotation** → Check if terms added automatically
2. **Generate PDF** → Verify terms appear on page 2
3. **View in browser** → Check formatting
4. **Download PDF** → Verify all pages

## Status: COMPLETE ✅

All quotations (existing and new) will now have Terms & Conditions!
PDF generation will include terms on a separate page with proper formatting.
