# 🧪 TESTING GUIDE - Quotation PDF & Terms & Conditions

**Date**: Context Transfer Session
**Purpose**: Test all fixes applied for PDF formatting and dropdown functionality

---

## 📋 PRE-TESTING CHECKLIST

### Backend Status:
- ✅ 18 master terms created in database
- ✅ All terms formatted with HTML `<p>` tags
- ✅ PDF templates updated with paragraph CSS
- ✅ Terms page is last page in PDF
- ✅ No signature section on terms page

### Frontend Status:
- ✅ Dropdown fixed to load all terms (page_size=100)
- ✅ Component properly handles term selection

### Files Modified:
1. ✅ `crm-project-backend/templates/pdf/quotation.html`
2. ✅ `crm-project-backend/templates/pdf/quotation_print.html`
3. ✅ `crm-project-frontend/src/components/QuotationTermsSelector.jsx`

---

## 🚀 TESTING STEPS

### PART 1: Frontend Dropdown Testing

#### Step 1: Restart Frontend (if needed)
```bash
cd c:\Users\OWNER\Desktop\nnit\nnit\crm-project-frontend
# If dev server is running, stop and restart
npm run dev
```

#### Step 2: Open Quotation Form
1. Open your browser
2. Navigate to the quotation creation/edit page
3. Locate the "Terms & Conditions" section

#### Step 3: Test Dropdown
**Expected Results:**
- ✅ Badge shows "18 terms" (not "10 terms")
- ✅ Clicking the dropdown arrow expands the list
- ✅ All 18 terms are visible in the expanded list
- ✅ Default terms are pre-selected
- ✅ Can select/deselect terms with checkboxes

**If dropdown doesn't show 18 terms:**
- Check browser console (F12) for JavaScript errors
- Verify the API call includes `page_size=100` parameter
- Check Network tab to see the actual API request

---

### PART 2: PDF Generation Testing

#### Step 1: Create/Select a Quotation
1. Create a new quotation OR open an existing one
2. Make sure it has terms attached
3. Generate the PDF

#### Step 2: Verify PDF Structure
**Check Page Order:**
- ✅ Page 1: Quotation details with items table
- ✅ Page 2: Terms & Conditions (LAST PAGE)

**Check Header:**
- ✅ Full-width header image on all pages
- ✅ Header image is NOT cut/cropped
- ✅ Natural image size (height: auto)
- ✅ No orange/blue strips at TOP
- ✅ Orange/blue strips ONLY at bottom (footer)

**Check Content Spacing:**
- ✅ No overlap between header and content
- ✅ Proper spacing (170px top padding)
- ✅ Content starts below header

#### Step 3: Verify Terms & Conditions Page
**Layout:**
- ✅ "TERMS & CONDITIONS" title at top (24px, bold, uppercase)
- ✅ No signature section on this page
- ✅ Orange/blue footer strips at bottom

**Typography:**
- ✅ Font: Calibri (not Arial)
- ✅ Main title font size: 13px, bold
- ✅ Content font size: 12px
- ✅ Line height: 1.8 (comfortable reading)
- ✅ Text alignment: Justified

**Paragraph Formatting (MOST IMPORTANT):**
- ✅ Paragraphs flow naturally (not as bullet points)
- ✅ Each paragraph is separated by proper spacing
- ✅ Only actual numbered/lettered items show as lists (1, 2, i, ii)
- ✅ Regular paragraphs display as blocks of text
- ✅ No unwanted bullet points (•) anywhere

**Content Display:**
- ✅ Each term has sequence number + title (bold)
- ✅ Content flows naturally below the title
- ✅ Proper spacing between different terms (24px)
- ✅ Title-to-content spacing (8px)

#### Step 4: Verify Quotation Page (First Page)
**Styling:**
- ✅ All borders are black (2-3px)
- ✅ No colored backgrounds (white only)
- ✅ No colored text (black only)
- ✅ Clean, minimal, professional appearance
- ✅ Tables have black borders
- ✅ Signature lines are black (1px)

---

## 🔍 SPECIFIC TESTS FOR PARAGRAPH ISSUE

### Test 1: Visual Inspection
Open the PDF and look at the Terms & Conditions page:

**CORRECT (✅):**
```
1. Scope of Work:
The work to be executed under this contract is the complete design, fabrication,
assembly/erection, installation, testing & commissioning NNIT's Hydraulic Car
Parking Systems (G+1) Weight 2000KG as per the technical specifications attached.

2. Delivery Schedule:
Delivery will be completed within 45 days from the date of receipt of order
confirmation and advance payment.
```

**INCORRECT (❌ - Old Issue):**
```
1. Scope of Work:
• The work to be executed under this contract...
• (showing as bullet point instead of paragraph)
```

### Test 2: Check HTML Source (in PDF)
If you can inspect the PDF source:
- ✅ `<p>` tags should be rendered as block elements
- ✅ No `<ul>` or `<li>` tags wrapping paragraphs
- ✅ CSS property: `list-style: none` applied

### Test 3: Compare with Example PDF
Compare your generated PDF with the original example PDF:
- ✅ Paragraph flow matches the example
- ✅ Spacing matches the example
- ✅ Font sizes match the example
- ✅ Overall appearance is professional and clean

---

## 🐛 TROUBLESHOOTING

### Issue 1: Dropdown Still Shows "10 terms"

**Possible Causes:**
1. Frontend not restarted after changes
2. Browser cache not cleared
3. Frontend code change didn't take effect

**Solutions:**
```bash
# Stop frontend dev server
Ctrl+C

# Clear node cache
npm cache clean --force

# Restart dev server
npm run dev
```

Then:
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh the page (Ctrl+Shift+R)
- Check browser console for errors

### Issue 2: Dropdown Still Doesn't Expand

**Possible Causes:**
1. JavaScript error preventing state change
2. Click event being blocked
3. Component state not updating

**Solutions:**
1. Open browser console (F12)
2. Click the dropdown arrow
3. Look for errors in console
4. Check if `expanded` state is changing
5. Try clicking different parts of the header area

### Issue 3: Paragraphs Still Show as Bullet Points

**Possible Causes:**
1. Template cache not cleared
2. Old PDF cached in browser
3. CSS not being applied

**Solutions:**

**Backend:**
```bash
cd c:\Users\OWNER\Desktop\nnit\nnit\crm-project-backend

# Restart Django server
python manage.py runserver
```

**Frontend:**
- Generate a NEW PDF (don't use cached one)
- Download PDF instead of viewing in browser
- Check if terms content has `<p>` tags:
```bash
python manage.py shell
```
```python
from quotation.terms_models import TermsMaster
term = TermsMaster.objects.first()
print(term.content[:200])
# Should show: <p>The work to be executed...</p>
```

### Issue 4: Header Overlaps Content

**Check:**
- Content padding-top should be 170px
- Header should be position: fixed
- Content should have z-index: 5

**Fix (if needed):**
Look in `quotation.html` line ~50:
```css
.content {
  padding-top: 170px;  /* This MUST be present */
  ...
}
```

---

## ✅ SUCCESS CRITERIA

Your testing is successful when ALL of these are true:

### Dropdown:
- [x] Shows "18 terms"
- [x] Expands/collapses on click
- [x] All terms visible
- [x] Can select/deselect terms

### PDF Layout:
- [x] Header on all pages (full width)
- [x] No header overlap
- [x] Terms page is LAST
- [x] No signature on terms page
- [x] Footer strips on all pages

### PDF Styling:
- [x] Font: Calibri
- [x] Font sizes: 12px content, 13px titles
- [x] All black & white
- [x] Black borders only
- [x] Professional appearance

### Paragraph Formatting (CRITICAL):
- [x] Paragraphs flow naturally
- [x] NO bullet points on paragraphs
- [x] Only actual lists show as lists
- [x] Proper spacing between paragraphs
- [x] Text is justified
- [x] Readable and professional

---

## 📊 TEST RESULTS TEMPLATE

Copy this and fill it out after testing:

```
## TEST RESULTS - [Your Name] - [Date]

### DROPDOWN TESTING:
- Term count shown: _____ (should be 18)
- Dropdown expands: YES / NO
- All terms visible: YES / NO
- Issues found: _______________

### PDF STRUCTURE:
- Pages in correct order: YES / NO
- Header appears correctly: YES / NO
- No overlap with content: YES / NO
- Terms page is last: YES / NO
- Issues found: _______________

### PARAGRAPH FORMATTING:
- Paragraphs flow naturally: YES / NO
- No unwanted bullet points: YES / NO
- Proper spacing: YES / NO
- Font sizes correct: YES / NO
- Issues found: _______________

### OVERALL RATING:
- Dropdown: PASS / FAIL
- PDF Layout: PASS / FAIL
- Terms Formatting: PASS / FAIL

### SCREENSHOTS ATTACHED:
- [ ] Dropdown showing 18 terms
- [ ] Terms & Conditions page in PDF
- [ ] Paragraph formatting closeup
```

---

## 🆘 NEED HELP?

If you encounter issues during testing:

1. **Check the logs:**
   - Browser console (F12) for frontend errors
   - Django server logs for backend errors

2. **Verify the changes:**
   - Check if files were actually modified
   - Search for "page_size=100" in QuotationTermsSelector.jsx
   - Search for ".terms-content p" in quotation.html

3. **Re-run commands:**
   - Restart both frontend and backend servers
   - Clear all caches
   - Generate a fresh PDF

4. **Database check:**
```bash
cd c:\Users\OWNER\Desktop\nnit\nnit\crm-project-backend
python manage.py shell -c "from quotation.terms_models import TermsMaster; print(f'Total terms: {TermsMaster.objects.filter(is_active=True).count()}')"
```

Expected output: `Total terms: 18`

---

**Good luck with testing!** 🎉

All changes have been applied and should work as expected. If you encounter any issues, refer to the troubleshooting section above.
