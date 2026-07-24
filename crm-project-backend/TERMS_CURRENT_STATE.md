# Terms & Conditions - Current Implementation State

## 📊 STATUS OVERVIEW

| Component | Status | Location |
|-----------|--------|----------|
| Backend Models | ✅ Complete | `quotation/terms_models.py` |
| Backend APIs | ✅ Working | `quotation/views.py`, `quotation/urls.py` |
| Frontend Management UI | ✅ Working | `src/pages/TermsManagement.jsx` |
| Terms Selector Component | ✅ Created | `src/components/QuotationTermsSelector.jsx` |
| Terms View Component | ✅ Created | `src/components/QuotationTermsView.jsx` |
| 18 Default Terms | ✅ Populated | Database via `populate_terms` command |
| Sidebar Menu | ✅ Added | "Terms & Conditions" menu item |
| **Quotation Integration** | ❌ Not Done | Need to add to quotation form |
| **PDF Integration** | ❌ Not Done | Need to add to PDF generator |

---

## ✅ WHAT'S WORKING RIGHT NOW

### 1. Terms Management Page (`/terms-conditions`)

**Fully Functional CRUD Operations:**

```
Access: http://localhost:5173/terms-conditions
```

**Features:**
- ✅ View all terms in table format
- ✅ Add new term (modal form)
- ✅ Edit existing term (modal form)
- ✅ Delete term (with confirmation)
- ✅ Toggle Active/Inactive status
- ✅ Toggle Default status
- ✅ Real-time stats (Total, Active, Default counts)
- ✅ Sequence ordering
- ✅ Preview content in table
- ✅ Beautiful Tailwind CSS design
- ✅ JWT authentication with 'access' token

**All 18 Terms Pre-loaded:**
1. Scope of Work
2. Payment Terms
3. Warranty
4. Installation Schedule
5. Site Requirements
6. Training
7. Maintenance
8. Spare Parts
9. Force Majeure
10. Termination
11. Intellectual Property
12. Confidentiality
13. Liability
14. Insurance
15. Compliance
16. Dispute Resolution
17. Amendments
18. Governing Law

---

### 2. Backend APIs - All Endpoints Working

**Base URL:** `http://localhost:8000/api/quotation/`

#### Terms Master Endpoints:
```bash
# List all terms
GET /api/quotation/terms/
Response: [
  {
    "id": 1,
    "sequence": 1,
    "title": "Scope of Work",
    "content": "This contract covers...",
    "is_active": true,
    "is_default": true,
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T10:00:00Z"
  },
  ...
]

# Create new term
POST /api/quotation/terms/
Body: {
  "sequence": 19,
  "title": "New Term",
  "content": "Term content here...",
  "is_active": true,
  "is_default": false
}

# Get specific term
GET /api/quotation/terms/1/

# Update term
PATCH /api/quotation/terms/1/
Body: {
  "title": "Updated Title",
  "content": "Updated content..."
}

# Delete term
DELETE /api/quotation/terms/1/
```

#### Quotation Terms Endpoints:
```bash
# Get terms for a quotation
GET /api/quotation/quotation-terms/?quotation=42

# Bulk create terms for quotation
POST /api/quotation/quotation-terms/bulk-create/
Body: {
  "quotation": 42,
  "terms": [
    {"master_term": 1, "sequence": 1},
    {"master_term": 2, "sequence": 2},
    ...
  ]
}

# Apply default terms to quotation
POST /api/quotation/quotation-terms/apply-defaults/
Body: {
  "quotation": 42
}

# Update/customize specific term
PATCH /api/quotation/quotation-terms/101/
Body: {
  "title": "Custom Title",
  "content": "Custom content for this quotation only...",
  "is_customized": true
}

# Delete term from quotation
DELETE /api/quotation/quotation-terms/101/
```

---

### 3. Frontend Components Ready

#### A. QuotationTermsSelector Component
**File:** `src/components/QuotationTermsSelector.jsx`

**Status:** ✅ Created, NOT integrated into quotation form

**Features:**
- Collapsible panel
- Shows all active master terms
- Checkbox selection
- Default terms pre-selected
- "Apply Defaults" button
- Save selected terms
- For existing quotations:
  - Shows attached terms
  - Edit/customize term content
  - Delete term from quotation
  - Mark as customized

**Usage (Not Yet Active):**
```jsx
import QuotationTermsSelector from './QuotationTermsSelector';

<QuotationTermsSelector
  quotationId={quotationId}  // null for new, id for existing
  onTermsChange={(selectedTerms) => {
    // Handle selected term IDs
  }}
/>
```

#### B. QuotationTermsView Component
**File:** `src/components/QuotationTermsView.jsx`

**Status:** ✅ Created, ready to use

**Features:**
- Read-only display of terms
- Formatted title and content
- Sequence numbering
- Customized badge

**Usage:**
```jsx
import QuotationTermsView from './QuotationTermsView';

<QuotationTermsView quotationId={quotationId} />
```

---

## ❌ WHAT'S NOT INTEGRATED YET

### 1. Quotation Form Integration

**Current State:**
- Simple quotation form exists: `src/components/quotations/AddQuotation.jsx`
- Form only has: Customer, Product, Quantity, Price, GST
- No terms selector included

**What's Needed:**
```jsx
// In AddQuotation.jsx

// 1. Add import
import QuotationTermsSelector from '../QuotationTermsSelector';

// 2. Add state
const [selectedTerms, setSelectedTerms] = useState([]);

// 3. Add component in form (before buttons)
<QuotationTermsSelector
  quotationId={id}
  onTermsChange={(terms) => setSelectedTerms(terms)}
/>

// 4. Include in payload
const payload = {
  // ... existing fields ...
  terms_ids: selectedTerms,  // Add this
};
```

**Estimated Time:** 15 minutes

---

### 2. Backend Integration in Simple Quotation

**Current State:**
- SimpleQuotation model exists
- Does NOT handle terms_ids in create/update

**What's Needed:**
```python
# In quotation/serializers.py - SimpleQuotationSerializer

class SimpleQuotationSerializer(serializers.ModelSerializer):
    terms_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = SimpleQuotation
        fields = [..., 'terms_ids']  # Add to fields
    
    def create(self, validated_data):
        terms_ids = validated_data.pop('terms_ids', [])
        instance = super().create(validated_data)
        
        # Create quotation terms
        from quotation.terms_models import QuotationTerms
        for idx, term_id in enumerate(terms_ids, start=1):
            QuotationTerms.objects.create(
                quotation=instance,
                master_term_id=term_id,
                sequence=idx
            )
        
        return instance
    
    def update(self, instance, validated_data):
        terms_ids = validated_data.pop('terms_ids', None)
        instance = super().update(instance, validated_data)
        
        # Update terms if provided
        if terms_ids is not None:
            # Delete existing terms
            QuotationTerms.objects.filter(quotation=instance).delete()
            # Create new terms
            for idx, term_id in enumerate(terms_ids, start=1):
                QuotationTerms.objects.create(
                    quotation=instance,
                    master_term_id=term_id,
                    sequence=idx
                )
        
        return instance
```

**Estimated Time:** 20 minutes

---

### 3. PDF Integration

**Current State:**
- PDF generator exists: `quotation/utils/pdf_generator.py`
- Does NOT include terms in PDF output

**What's Needed:**
```python
# In quotation/utils/pdf_generator.py

def generate_quotation_pdf(quotation_version):
    # ... existing code for main quotation ...
    
    # Add Terms & Conditions section
    from quotation.terms_models import QuotationTerms
    
    quotation_terms = QuotationTerms.objects.filter(
        quotation=quotation_version.quotation,
        is_active=True
    ).order_by('sequence')
    
    if quotation_terms.exists():
        # Add new page for terms
        p.showPage()
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, 800, "TERMS & CONDITIONS")
        p.line(50, 795, 550, 795)
        
        y_position = 770
        p.setFont("Helvetica", 9)
        
        for term in quotation_terms:
            # Check if we need a new page
            if y_position < 100:
                p.showPage()
                y_position = 800
            
            # Draw term title (bold)
            p.setFont("Helvetica-Bold", 10)
            title_text = f"{term.sequence}. {term.title}"
            p.drawString(50, y_position, title_text)
            y_position -= 15
            
            # Draw term content
            p.setFont("Helvetica", 9)
            
            # Word wrap the content
            from reportlab.lib.utils import simpleSplit
            lines = simpleSplit(term.content, "Helvetica", 9, 500)
            
            for line in lines:
                if y_position < 100:
                    p.showPage()
                    y_position = 800
                p.drawString(70, y_position, line)
                y_position -= 12
            
            y_position -= 10  # Space between terms
    
    # ... rest of PDF generation ...
```

**Estimated Time:** 30 minutes

---

## 🎯 INTEGRATION PRIORITY

### Priority 1: Quotation Form (Frontend + Backend)
**Time:** ~35 minutes
**Impact:** Users can select terms when creating quotations
**Files:**
1. `src/components/quotations/AddQuotation.jsx`
2. `quotation/serializers.py`

### Priority 2: PDF Output
**Time:** ~30 minutes
**Impact:** Terms appear in quotation PDFs
**Files:**
1. `quotation/utils/pdf_generator.py`

### Priority 3: Testing
**Time:** ~20 minutes
**Tests:**
1. Create quotation with terms
2. Edit quotation and customize terms
3. Generate PDF with terms
4. Email PDF with terms

**Total Integration Time:** ~1.5 hours

---

## 🔍 TESTING THE CURRENT FEATURES

### Test Terms Management (Works Now!)

1. **Open Terms Page:**
   ```
   http://localhost:5173/terms-conditions
   ```

2. **Verify 18 Terms Loaded:**
   - Should see all terms in table
   - Stats should show: Total: 18, Active: 18, Default: 18

3. **Test Add Term:**
   - Click "+ Add New Term"
   - Fill form:
     - Sequence: 19
     - Title: "Test Term"
     - Content: "This is a test term content..."
     - Check "Active" and "Default"
   - Click "Create"
   - Verify term appears in table

4. **Test Edit Term:**
   - Click ✏️ on any term
   - Modify title or content
   - Click "Update"
   - Verify changes saved

5. **Test Delete Term:**
   - Click 🗑️ on test term
   - Confirm deletion
   - Verify term removed

6. **Test Toggle Active:**
   - Click toggle switch
   - Verify color changes (blue = active, gray = inactive)

7. **Test Toggle Default:**
   - Click checkbox
   - Verify checkmark appears/disappears

---

## 📁 FILE STRUCTURE

```
crm-project-backend/
├── quotation/
│   ├── terms_models.py              ✅ Models: TermsMaster, QuotationTerms
│   ├── serializers.py               ✅ Serializers for terms APIs
│   ├── views.py                     ✅ ViewSets for CRUD
│   ├── urls.py                      ✅ URL routing
│   ├── admin.py                     ✅ Admin registration
│   ├── management/commands/
│   │   └── populate_terms.py        ✅ 18 default terms
│   └── utils/
│       └── pdf_generator.py         ❌ Need to add terms

crm-project-frontend/
├── src/
│   ├── pages/
│   │   └── TermsManagement.jsx      ✅ Full CRUD UI
│   ├── components/
│   │   ├── Sidebar.jsx              ✅ Menu item added
│   │   ├── QuotationTermsSelector.jsx  ✅ Ready, not integrated
│   │   ├── QuotationTermsView.jsx   ✅ Ready, not integrated
│   │   └── quotations/
│   │       └── AddQuotation.jsx     ❌ Need to add selector
│   └── App.jsx                      ✅ Route added
```

---

## 💡 QUICK INTEGRATION GUIDE

### For Developer - Do This Next:

1. **Add to Quotation Form (15 min):**
   ```jsx
   // File: src/components/quotations/AddQuotation.jsx
   import QuotationTermsSelector from '../QuotationTermsSelector';
   
   // Add state
   const [selectedTerms, setSelectedTerms] = useState([]);
   
   // Add in JSX before buttons
   <QuotationTermsSelector
     quotationId={id}
     onTermsChange={setSelectedTerms}
   />
   
   // Add to payload
   terms_ids: selectedTerms
   ```

2. **Update Backend (20 min):**
   ```python
   # File: quotation/serializers.py
   # Add terms_ids handling to SimpleQuotationSerializer
   # (See detailed code above)
   ```

3. **Add to PDF (30 min):**
   ```python
   # File: quotation/utils/pdf_generator.py
   # Fetch quotation terms and add to PDF
   # (See detailed code above)
   ```

4. **Test Everything (20 min):**
   - Create quotation with terms
   - Edit and customize terms
   - View PDF with terms
   - Email/Download PDF

---

## 🎉 SUMMARY

### What You Have Now:
- ✅ Complete Terms Management System
- ✅ 18 Pre-loaded Terms
- ✅ Full CRUD Operations
- ✅ Beautiful UI
- ✅ All Backend APIs Working
- ✅ Components Ready to Use

### What You Need:
- ❌ 15 minutes: Add selector to quotation form
- ❌ 20 minutes: Update backend serializer
- ❌ 30 minutes: Add terms to PDF

### Total Time to Complete: ~1.5 hours

### Then You'll Have:
- ✅ Full Terms Management
- ✅ Terms Selection in Quotations
- ✅ Terms Customization per Quotation
- ✅ Terms in PDF Output
- ✅ Complete Feature!

---

## 📞 Ready to Integrate?

The components are ready, the APIs work, the data is loaded.

Just need to connect the pieces! 🚀

Want me to do the integration now? Just say "integrate terms into quotation" and I'll do it! 💪
