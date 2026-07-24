# Terms & Conditions - Quick Start Guide

## 🎯 Current Status

### ✅ WORKING NOW:
1. **Terms Management Page** - `/terms-conditions`
   - View all 18 terms
   - Add/Edit/Delete terms
   - Toggle Active/Default status

### ⚠️ NOT YET INTEGRATED:
2. **Quotation Form Integration** - Needs to be added
3. **PDF Display** - Needs implementation

---

## 📱 HOW TO USE (Current Features)

### 1. Access Terms Management

**Navigate to:** Sidebar → "Terms & Conditions"

or

**Direct URL:** `http://localhost:5173/terms-conditions`

---

### 2. View All Terms

You'll see a table with all 18 pre-loaded terms:

```
┌─────────────────────────────────────────────────────────────┐
│  Terms & Conditions Management              [+ Add New Term]│
├─────────────────────────────────────────────────────────────┤
│  ℹ️ Total: 18 terms | Active: 18 | Default: 18              │
├───┬─────────────────┬──────────────┬────────┬─────────┬─────┤
│ # │ Title           │ Preview      │ Active │ Default │ Act │
├───┼─────────────────┼──────────────┼────────┼─────────┼─────┤
│ 1 │ Scope of Work   │ This con...  │  ✓     │   ✓     │ ✏️🗑️│
│ 2 │ Payment Terms   │ Payment...   │  ✓     │   ✓     │ ✏️🗑️│
│ 3 │ Warranty        │ One year...  │  ✓     │   ✓     │ ✏️🗑️│
│...│ ...             │ ...          │  ...   │   ...   │ ... │
│18 │ Governing Law   │ This agr...  │  ✓     │   ✓     │ ✏️🗑️│
└───┴─────────────────┴──────────────┴────────┴─────────┴─────┘
```

---

### 3. Add New Term

**Click:** "+ Add New Term" button

**Fill in:**
```
┌─────────────────────────────────────┐
│  Add New Term                       │
├─────────────────────────────────────┤
│  Sequence Number:  [19]             │
│                                     │
│  Title: *                           │
│  [___________________________]      │
│                                     │
│  Content: *                         │
│  [___________________________]      │
│  [___________________________]      │
│  [___________________________]      │
│                                     │
│  ☑ Active                           │
│  ☑ Include by Default               │
│                                     │
│  [Cancel]  [Create]                 │
└─────────────────────────────────────┘
```

**Example:**
- Sequence: `19`
- Title: `Force Majeure`
- Content: `Neither party shall be liable for failure to perform...`
- ✓ Active
- ✓ Include by Default

**Click:** "Create" button

---

### 4. Edit Existing Term

**Click:** ✏️ Edit icon on any term

**Modify:** Title or Content

**Click:** "Update" button

---

### 5. Delete Term

**Click:** 🗑️ Delete icon on any term

**Confirm:** "Yes, delete it!"

⚠️ **Note:** If term is already used in quotations, it will still appear in those quotations but won't be available for new ones.

---

### 6. Toggle Active Status

**Click:** The toggle switch in "Active" column

- **ON (Blue)** ✓ - Term is available for selection
- **OFF (Gray)** ✗ - Term is hidden from new quotations

---

### 7. Mark as Default

**Check:** The checkbox in "Default" column

- **Checked** ✓ - Will auto-select in new quotations
- **Unchecked** ✗ - Must manually select

---

## 🔄 INTEGRATION WITH QUOTATION (Not Yet Active)

### Once Integrated, You'll Be Able To:

#### When Creating New Quotation:

```
┌─────────────────────────────────────────┐
│  Create New Quotation                   │
├─────────────────────────────────────────┤
│  Customer: [Select Customer ▼]          │
│  Product:  [Select Product ▼]           │
│  Quantity: [1]                          │
│  Price:    [6.5 Lakhs]                  │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Terms & Conditions      [18] ▼   │ │
│  │ [Apply Defaults]                 │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Create Quotation]  [Cancel]           │
└─────────────────────────────────────────┘
```

**Click:** ▼ to expand Terms section

```
┌─────────────────────────────────────────┐
│ Terms & Conditions            [18] ▲    │
│ [Apply Defaults]                         │
├─────────────────────────────────────────┤
│ ℹ️ Select terms to include              │
│                                          │
│ ☑ 1. Scope of Work         [Default]    │
│     This contract covers installation... │
│                                          │
│ ☑ 2. Payment Terms         [Default]    │
│     Payment schedule as follows...       │
│                                          │
│ ☐ 3. Warranty                            │
│     One year warranty on all...          │
│                                          │
│ ... (15 more)                            │
│                                          │
│ Selected: 15 of 18 terms                 │
│                     [Save Selected Terms]│
└─────────────────────────────────────────┘
```

**Actions:**
- ✓ Check/Uncheck terms to include
- Click "Apply Defaults" to reset
- Click "Save Selected Terms" to confirm

#### When Editing Existing Quotation:

```
┌─────────────────────────────────────────┐
│ Terms & Conditions            [15] ▲    │
│ [Apply Defaults]                         │
├─────────────────────────────────────────┤
│ ℹ️ 15 terms attached to this quotation   │
│                                          │
│ 1. Scope of Work            [✏️] [🗑️]    │
│    This contract covers installation...  │
│                                          │
│ 2. Payment Terms [Custom]   [✏️] [🗑️]    │
│    **Modified payment terms...**         │
│                                          │
│ ... (13 more)                            │
└─────────────────────────────────────────┘
```

**Actions:**
- ✏️ Edit - Customize term for this quotation only
- 🗑️ Delete - Remove term from quotation
- "Apply Defaults" - Reset to default terms

#### When Customizing a Term:

**Click:** ✏️ Edit icon

```
┌─────────────────────────────────────────┐
│ 2. Payment Terms                        │
├─────────────────────────────────────────┤
│ Title:                                  │
│ [Payment Terms - Special Discount]      │
│                                         │
│ Content:                                │
│ [Payment schedule with 10% discount...] │
│ [for early payment within 7 days...]    │
│                                         │
│ [✓ Save]  [Cancel]                      │
└─────────────────────────────────────────┘
```

**Result:** Term shows [Customized] badge, original template unchanged

---

## 📄 PDF OUTPUT (After Integration)

### Quotation PDF Will Show:

```
┌────────────────────────────────────────┐
│  NNIT CAR PARKING SYSTEMS             │
│  QUOTATION #KAC/2024/001              │
├────────────────────────────────────────┤
│                                        │
│  [Page 1: Header & Pricing]            │
│  Customer: ABC Company                 │
│  Product: Automated Parking System     │
│  Quantity: 1                           │
│  Total: ₹6,50,000/-                    │
│                                        │
├────────────────────────────────────────┤
│  [Page 2: Terms & Conditions]          │
│                                        │
│  1. SCOPE OF WORK                      │
│     This contract covers installation   │
│     and commissioning of...            │
│                                        │
│  2. PAYMENT TERMS                      │
│     Payment schedule as follows:       │
│     - 30% advance payment...           │
│                                        │
│  3. WARRANTY                           │
│     One year warranty on all parts...  │
│                                        │
│  ... (all selected terms)              │
│                                        │
├────────────────────────────────────────┤
│  [Last Page: Bank Details & Signature] │
│                                        │
│  Bank Details:                         │
│  Account Name: NNIT Car Parking...     │
│                                        │
│  For NNIT Car Parking Systems          │
│  Authorized Signatory                  │
└────────────────────────────────────────┘
```

---

## 🎯 WHAT YOU CAN DO RIGHT NOW

### ✅ Available Today:

1. **Go to Terms Management:**
   ```
   http://localhost:5173/terms-conditions
   ```

2. **View All 18 Terms:**
   - All terms from NNIT document are pre-loaded
   - Review each term's content
   - Check which are marked as default

3. **Customize Master Templates:**
   - Edit any term's content
   - Add new company-specific terms
   - Remove irrelevant terms
   - Reorder terms (change sequence number)

4. **Manage Active Status:**
   - Deactivate terms you don't use
   - Keep only relevant terms active

5. **Set Defaults:**
   - Mark frequently used terms as default
   - They'll auto-select in new quotations (once integrated)

### ⏳ Coming Soon (Needs Integration):

1. **Attach Terms to Quotations**
2. **Customize Terms per Quotation**
3. **View Terms in PDF**
4. **Print Quotations with Terms**

---

## 🔧 DEVELOPER NOTES

### To Integrate Terms into Quotation:

**Step 1:** Update `AddQuotation.jsx`
- Import `QuotationTermsSelector`
- Add state for selected terms
- Include terms in payload

**Step 2:** Update Backend Serializer
- Handle `terms_ids` field
- Create QuotationTerms records

**Step 3:** Update PDF Generator
- Fetch quotation terms
- Add terms pages to PDF

See `HOW_TO_USE_TERMS_IN_QUOTATION.md` for detailed integration steps.

---

## 📊 Database Structure

### TermsMaster (Template)
```
id: 1
sequence: 1
title: "Scope of Work"
content: "This contract covers..."
is_active: true
is_default: true
created_at: 2024-01-01
```

### QuotationTerms (Instance)
```
id: 101
quotation: 42
master_term: 1
sequence: 1
title: "Scope of Work"  (copied from master)
content: "This contract covers..."  (copied/customized)
is_customized: false
is_active: true
```

**Note:** When customized, the content changes but master_term reference remains.

---

## ❓ FAQs

**Q: Can I change a term that's already used in quotations?**
A: Yes! Changing the master term won't affect existing quotations. Only new quotations will get the updated version.

**Q: What happens if I delete a term that's in use?**
A: The term will be hidden from new quotations but will still appear in existing quotations that use it.

**Q: Can I customize terms per quotation?**
A: Yes! Once integrated, you can edit terms for a specific quotation without changing the master template.

**Q: How many terms can I have?**
A: Unlimited! You can add as many terms as needed.

**Q: Can terms be in multiple languages?**
A: Yes! Just create terms with content in your desired language.

**Q: Will terms appear in email quotes?**
A: Yes! Once PDF integration is complete, terms will be in all PDFs (view, download, email, print).

---

## 🚀 GET STARTED NOW!

1. **Open Terms Management:**
   ```
   http://localhost:5173/terms-conditions
   ```

2. **Review the 18 Pre-loaded Terms**

3. **Customize as Needed:**
   - Edit terms to match your business
   - Add custom terms
   - Set which are default

4. **Wait for Integration** or request developer to integrate

5. **Start Using in Quotations!**

---

## 📞 Need Help?

If you need:
- Integration assistance
- Custom features
- PDF formatting changes
- Additional functionality

Just ask! We're here to help. 🎉
