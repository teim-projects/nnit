# How to Use Terms & Conditions in Quotation

## 📋 Overview
The Terms & Conditions system allows you to:
1. Manage master terms templates
2. Attach terms to quotations
3. Customize terms per quotation
4. Display terms in PDF output

---

## 🎯 CURRENT STATUS

### ✅ What's Already Working:
1. **Terms Master Management** - Full CRUD functionality at `/terms-conditions`
2. **18 Default Terms** - Pre-populated from NNIT document
3. **Backend APIs** - All endpoints working
4. **QuotationTermsSelector Component** - Created but not integrated yet
5. **QuotationTermsView Component** - Created for viewing terms

### ⚠️ What Needs Integration:
1. **Add Terms Selector to Quotation Form** - Not yet integrated
2. **Display Terms in PDF** - Not yet implemented

---

## 🚀 STEP-BY-STEP USAGE GUIDE

### Step 1: Manage Master Terms (Already Working)

Navigate to **Terms & Conditions** page:
```
http://localhost:5173/terms-conditions
```

**Actions Available:**
- ✅ View all 18 terms
- ✅ Add new term
- ✅ Edit existing term
- ✅ Delete term
- ✅ Toggle Active/Inactive
- ✅ Mark as Default (will auto-include in new quotations)

---

### Step 2: Integration Needed - Add Terms to Quotation Form

**Current Issue:** The `QuotationTermsSelector` component exists but is not integrated into the quotation creation form.

#### Option A: Simple Quotation (Current Form)
The current `AddQuotation.jsx` is a simple form. To add terms:

**Add this import:**
```javascript
import QuotationTermsSelector from '../QuotationTermsSelector';
```

**Add state for selected terms:**
```javascript
const [selectedTerms, setSelectedTerms] = useState([]);
```

**Add the component before the submit buttons:**
```jsx
{/* Terms & Conditions Selector */}
<QuotationTermsSelector
  quotationId={null}  // null for new quotation
  onTermsChange={(terms) => setSelectedTerms(terms)}
/>
```

**Include terms in the payload:**
```javascript
const payload = {
  customer: parseInt(customerId),
  parking_product_id: parseInt(productId),
  quantity: qty,
  unit_price: unitPriceRaw,
  gst_percent: gst,
  terms_ids: selectedTerms,  // Add this
};
```

#### Option B: Full Quotation Form (Recommended)
Create a comprehensive quotation form with:
- Customer details
- Line items (High-side/Low-side)
- Terms & Conditions selector
- Bank details
- Notes

---

## 📱 HOW IT WORKS - User Workflow

### Creating a New Quotation:

1. **Click "+ Add Quotation"**
   
2. **Fill Basic Details:**
   - Select Customer
   - Select Product
   - Enter Quantity
   - Set Price

3. **Select Terms & Conditions:**
   - Component shows all 18 terms
   - Default terms are pre-selected (✓)
   - Uncheck terms you don't want
   - All selected terms will be attached to quotation

4. **Click "Create Quotation"**
   - Quotation created
   - Selected terms automatically attached
   - Terms will appear in PDF

### Editing an Existing Quotation:

1. **Click Edit on a Quotation**

2. **Terms & Conditions Section Shows:**
   - Currently attached terms
   - Each term shows:
     - ✏️ Edit button - Customize the term
     - 🗑️ Delete button - Remove from quotation
   - "Apply Defaults" button - Reset to default terms

3. **Customize a Term:**
   - Click ✏️ Edit icon
   - Modify title or content
   - Click Save
   - Term marked as "Customized"
   - Original master term unchanged

4. **Save Changes**

---

## 🔧 INTEGRATION STEPS (For Developer)

### Step 1: Update AddQuotation.jsx

Add Terms Selector to the simple quotation form:

```jsx
// At top - Add import
import QuotationTermsSelector from '../QuotationTermsSelector';

// In component - Add state
const [selectedTerms, setSelectedTerms] = useState([]);

// In JSX - Add before buttons
<QuotationTermsSelector
  quotationId={id}  // Pass id if editing, null if creating
  onTermsChange={(terms) => setSelectedTerms(terms)}
/>

// In handleSubmit - Add to payload
const payload = {
  customer: parseInt(customerId),
  parking_product_id: parseInt(productId),
  quantity: qty,
  unit_price: unitPriceRaw,
  gst_percent: gst,
  terms_ids: selectedTerms,  // ← Add this line
};
```

### Step 2: Update Backend Simple Quotation Serializer

File: `crm-project-backend/quotation/serializers.py`

Add terms handling:
```python
class SimpleQuotationSerializer(serializers.ModelSerializer):
    terms_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = SimpleQuotation
        fields = ['id', 'customer', 'parking_product_id', 'quantity', 
                  'unit_price', 'gst_percent', 'terms_ids']  # Add terms_ids
    
    def create(self, validated_data):
        terms_ids = validated_data.pop('terms_ids', [])
        instance = super().create(validated_data)
        
        # Create quotation terms
        for idx, term_id in enumerate(terms_ids, start=1):
            QuotationTerms.objects.create(
                quotation=instance,
                master_term_id=term_id,
                sequence=idx
            )
        
        return instance
```

### Step 3: Add Terms to PDF Generator

File: `crm-project-backend/quotation/utils/pdf_generator.py`

Update to include terms in PDF:
```python
def generate_quotation_pdf(quotation_version):
    # ... existing code ...
    
    # Add Terms & Conditions section
    quotation_terms = QuotationTerms.objects.filter(
        quotation=quotation_version.quotation,
        is_active=True
    ).order_by('sequence')
    
    if quotation_terms.exists():
        # Add new page for terms
        p.showPage()
        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, 800, "Terms & Conditions")
        
        y_position = 770
        for term in quotation_terms:
            # Draw term title
            p.setFont("Helvetica-Bold", 10)
            p.drawString(50, y_position, f"{term.sequence}. {term.title}")
            
            # Draw term content
            p.setFont("Helvetica", 9)
            y_position -= 20
            lines = term.content.split('\n')
            for line in lines:
                p.drawString(70, y_position, line)
                y_position -= 15
            
            y_position -= 10  # Space between terms
```

---

## 📊 API Endpoints Reference

### Terms Master Management:
```
GET    /api/quotation/terms/                    # List all terms
POST   /api/quotation/terms/                    # Create new term
GET    /api/quotation/terms/{id}/               # Get specific term
PATCH  /api/quotation/terms/{id}/               # Update term
DELETE /api/quotation/terms/{id}/               # Delete term
```

### Quotation Terms Management:
```
GET    /api/quotation/quotation-terms/?quotation={id}       # Get terms for quotation
POST   /api/quotation/quotation-terms/bulk-create/          # Attach multiple terms
POST   /api/quotation/quotation-terms/apply-defaults/       # Apply default terms
PATCH  /api/quotation/quotation-terms/{id}/                 # Update/customize term
DELETE /api/quotation/quotation-terms/{id}/                 # Remove term from quotation
```

---

## 🎨 UI/UX Flow

### Collapsed State:
```
┌─────────────────────────────────────────┐
│ Terms & Conditions         [18 terms] ▼ │
│ [Apply Defaults]                         │
└─────────────────────────────────────────┘
```

### Expanded State - New Quotation:
```
┌──────────────────────────────────────────┐
│ Terms & Conditions          [18 terms] ▲ │
│ [Apply Defaults]                          │
├──────────────────────────────────────────┤
│ ℹ️ Select terms to include in quotation  │
│                                           │
│ ☑ 1. Scope of Work            [Default]  │
│     This contract covers...               │
│                                           │
│ ☑ 2. Payment Terms            [Default]  │
│     Payment schedule as follows...        │
│                                           │
│ ☐ 3. Warranty                             │
│     One year warranty on...               │
│                                           │
│ ... (15 more terms)                       │
│                                           │
│ Selected: 15 of 18 terms                  │
│                     [Save Selected Terms] │
└──────────────────────────────────────────┘
```

### Expanded State - Existing Quotation:
```
┌──────────────────────────────────────────┐
│ Terms & Conditions          [15 terms] ▲ │
│ [Apply Defaults]                          │
├──────────────────────────────────────────┤
│ ℹ️ 15 terms attached to this quotation    │
│                                           │
│ 1. Scope of Work                 [✏️] [🗑️]│
│    This contract covers installation...   │
│                                           │
│ 2. Payment Terms [Customized]   [✏️] [🗑️]│
│    **Custom payment terms for this...**   │
│                                           │
│ ... (13 more terms)                       │
└──────────────────────────────────────────┘
```

---

## 🔍 Testing Checklist

### Master Terms:
- [ ] Navigate to `/terms-conditions`
- [ ] Verify all 18 terms are visible
- [ ] Create a new term
- [ ] Edit an existing term
- [ ] Delete a term
- [ ] Toggle active status
- [ ] Toggle default status

### Quotation Integration (After Integration):
- [ ] Create new quotation
- [ ] Terms selector appears
- [ ] Default terms are pre-selected
- [ ] Can select/deselect terms
- [ ] Terms save with quotation
- [ ] Edit existing quotation
- [ ] Attached terms display
- [ ] Can customize term content
- [ ] Can delete term from quotation
- [ ] "Apply Defaults" works
- [ ] Terms appear in PDF

---

## 📝 Next Implementation Tasks

1. **Integrate Terms Selector into Quotation Form**
   - File: `src/components/quotations/AddQuotation.jsx`
   - Add `QuotationTermsSelector` component
   - Handle selected terms in payload

2. **Update Backend to Save Terms**
   - File: `quotation/serializers.py`
   - Add `terms_ids` field handling
   - Create QuotationTerms on quotation creation

3. **Add Terms to PDF Output**
   - File: `quotation/utils/pdf_generator.py`
   - Fetch quotation terms
   - Add new pages with terms
   - Format terms nicely

4. **Test Complete Workflow**
   - Create quotation with terms
   - Edit and customize terms
   - Generate PDF with terms

---

## 💡 Pro Tips

1. **Default Terms**: Mark frequently used terms as "Default" so they auto-select for new quotations

2. **Customization**: Customize terms per quotation without affecting the master template

3. **Sequence**: Terms display in sequence order (1, 2, 3...) - you can reorder in master management

4. **Active/Inactive**: Inactive terms won't show in the selector but remain in existing quotations

5. **PDF Output**: Terms will automatically appear in quotation PDFs after integration

---

## 🆘 Support

If you need help with:
- Integration steps
- Custom requirements
- PDF formatting
- Additional features

Just ask! 🚀
