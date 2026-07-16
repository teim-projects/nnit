# NNIT CRM - Frontend Update Guide

## 🎯 Updates Required

Backend me jo changes hue hain unke hisaab se frontend me yeh updates karne honge:

---

## 📝 FOLLOW-UP FORM CHANGES

### ❌ **Remove These Fields** (Ab requirement form me honge):
```javascript
// YEH FIELDS AB FOLLOW-UP FORM SE HATA DO:
- Site location
- Basement available (Yes/No)
- Pit possible (Yes/No)
- Type of cars (SUV/Sedan/Mixed)
- Budget range
- Timeline for installation
- Site challenges
```

### ✅ **Add These New Fields**:

#### 1. Discussion Notes Field
```jsx
<div>
  <label className="text-sm text-slate-700 mb-1 block">
    Discussion Notes (Detailed)
  </label>
  <textarea
    className="w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    rows={6}
    value={discussionNotes}
    onChange={(e) => setDiscussionNotes(e.target.value)}
    placeholder="Enter detailed conversation notes, customer requirements, concerns etc..."
  />
  <p className="text-xs text-gray-500 mt-1">
    Detailed notes about the discussion with customer
  </p>
</div>
```

#### 2. Suggested Solution Field (Product Recommendations)
```jsx
const [suggestedProducts, setSuggestedProducts] = useState([]);

// Add Product Button
<div className="border-t pt-4 mt-4">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-md font-semibold">Suggested Solutions</h3>
    <button
      type="button"
      onClick={() => handleAddProduct()}
      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
    >
      + Add Product Suggestion
    </button>
  </div>

  {/* Product List */}
  <div className="space-y-3">
    {suggestedProducts.map((product, index) => (
      <div key={index} className="border rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-medium">Product {index + 1}</h4>
          <button
            type="button"
            onClick={() => handleRemoveProduct(index)}
            className="text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>

        {/* Product Select */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-700 mb-1 block">
              Product <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 rounded-md border border-slate-200"
              value={product.product_id}
              onChange={(e) => handleProductChange(index, 'product_id', e.target.value)}
            >
              <option value="">Select Product</option>
              {productsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-700 mb-1 block">
              Category (Auto-filled)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-md border border-slate-200 bg-gray-100"
              value={product.category || ''}
              disabled
            />
          </div>
        </div>

        {/* Reason for Suggestion */}
        <div className="mt-3">
          <label className="text-sm text-slate-700 mb-1 block">
            Reason for Suggestion
          </label>
          <textarea
            className="w-full px-3 py-2 rounded-md border border-slate-200"
            rows={2}
            value={product.reason || ''}
            onChange={(e) => handleProductChange(index, 'reason', e.target.value)}
            placeholder="Why is this product recommended?"
          />
        </div>
      </div>
    ))}
  </div>

  {suggestedProducts.length === 0 && (
    <div className="text-sm text-gray-500 text-center py-4">
      No products suggested yet. Click "Add Product Suggestion" to add.
    </div>
  )}
</div>
```

---

## 🔄 API PAYLOAD UPDATE

### Old Payload (Remove karo):
```javascript
const payload = {
  lead: leadId,
  followup_date: followupDate,
  next_followup_date: nextFollowupDate,
  status: status,
  remarks: remarks,
  // REMOVE THESE ❌
  site_location: siteLocation,
  basement_available: basementAvailable,
  pit_possible: pitPossible,
  car_type: carType,
  budget_range: budgetRange,
  timeline: timeline,
  site_challenges: siteChallenges
};
```

### New Payload (Use karo):
```javascript
const payload = {
  lead: leadId,
  followup_date: followupDate,
  next_followup_date: nextFollowupDate || null,
  status: status,
  remarks: remarks.trim(),
  
  // ✅ NEW FIELDS
  discussion_notes: discussionNotes.trim(),
  
  // ✅ Suggested solution as JSON array
  suggested_solution: suggestedProducts
    .filter(p => p.product_id) // Only include valid products
    .map(p => ({
      product_id: Number(p.product_id),
      product_name: p.product_name,
      category: p.category,
      capacity: p.capacity,
      reason: p.reason || ''
    })),
  
  // FAQ answers (existing)
  faq_answers: faqPayload
};
```

---

## 📊 FOLLOW-UP HISTORY DISPLAY

### Update Timeline to Show Suggested Solutions:

```jsx
{lead.followups && lead.followups.map((fu, idx) => (
  <div key={fu.id} className="border-t py-4">
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-medium">
            🕐 {fu.followup_date}
          </span>
          <span className={`px-2 py-1 rounded text-xs ${
            fu.status === 'open' ? 'bg-blue-100 text-blue-700' :
            fu.status === 'in_process' ? 'bg-orange-100 text-orange-700' :
            'bg-green-100 text-green-700'
          }`}>
            {fu.status}
          </span>
        </div>

        {/* Remarks */}
        {fu.remarks && (
          <div className="text-sm mb-2">
            <span className="font-medium">Remarks:</span> {fu.remarks}
          </div>
        )}

        {/* ✅ NEW: Discussion Notes */}
        {fu.discussion_notes && (
          <div className="text-sm mb-3 bg-gray-50 p-3 rounded">
            <span className="font-medium">Discussion:</span>
            <p className="mt-1 text-gray-700">{fu.discussion_notes}</p>
          </div>
        )}

        {/* ✅ NEW: Suggested Solutions */}
        {fu.suggested_solution && fu.suggested_solution.length > 0 && (
          <div className="mt-3">
            <div className="font-medium text-sm mb-2">Suggested Solutions:</div>
            <div className="space-y-2">
              {fu.suggested_solution.map((product, pIdx) => (
                <div key={pIdx} className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-blue-900">
                        🏗️ {product.product_name}
                      </div>
                      <div className="text-xs text-blue-700 mt-1">
                        {product.category} | Capacity: {product.capacity} cars
                      </div>
                      {product.reason && (
                        <div className="text-xs text-gray-600 mt-1">
                          <span className="font-medium">Reason:</span> {product.reason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Answers (existing) */}
        {fu.faq_answers && fu.faq_answers.length > 0 && (
          <div className="mt-3 text-xs">
            <div className="font-medium mb-1">FAQs:</div>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              {fu.faq_answers.map((faq) => (
                <li key={faq.id}>
                  <span className="font-medium">{faq.faq_question}:</span> {faq.answer}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Follow-up */}
        {fu.next_followup_date && (
          <div className="text-xs text-gray-500 mt-2">
            Next: {fu.next_followup_date}
          </div>
        )}
      </div>

      {/* Created By */}
      {fu.created_by_name && (
        <div className="text-xs text-gray-500 ml-4">
          By: {fu.created_by_name}
        </div>
      )}
    </div>
  </div>
))}
```

---

## 👤 CUSTOMER DETAIL PAGE

### Add New Tab for Complete Follow-up History:

```jsx
import { useState, useEffect } from 'react';

function CustomerDetail({ customerId }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [followupHistory, setFollowupHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch customer's complete followup history
  const fetchFollowupHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${BASE_API}/lead/customer/${customerId}/followup-history/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setFollowupHistory(data);
      }
    } catch (error) {
      console.error('Error fetching followup history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'followup-history') {
      fetchFollowupHistory();
    }
  }, [activeTab]);

  return (
    <div>
      {/* Tabs */}
      <div className="border-b mb-4">
        <div className="flex gap-4">
          <button
            className={`px-4 py-2 ${activeTab === 'profile' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'leads' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
            onClick={() => setActiveTab('leads')}
          >
            Leads
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'followup-history' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
            onClick={() => setActiveTab('followup-history')}
          >
            📝 Follow-up History
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'invoices' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-600'}`}
            onClick={() => setActiveTab('invoices')}
          >
            Invoices
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && <CustomerProfileTab />}
      {activeTab === 'leads' && <CustomerLeadsTab />}
      {activeTab === 'followup-history' && (
        <FollowupHistoryTab 
          history={followupHistory} 
          loading={loading}
        />
      )}
      {activeTab === 'invoices' && <CustomerInvoicesTab />}
    </div>
  );
}

// Follow-up History Tab Component
function FollowupHistoryTab({ history, loading }) {
  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No follow-up history found for this customer
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-4">
        Complete follow-up history across all leads for this customer
      </div>

      {history.map((fu) => (
        <div key={fu.id} className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="font-medium text-lg">
                Lead: {fu.lead_customer_name}
              </div>
              <div className="text-sm text-gray-500">
                Lead #: {fu.lead}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">
                {fu.followup_date}
              </div>
              <span className={`inline-block px-2 py-1 rounded text-xs mt-1 ${
                fu.status === 'open' ? 'bg-blue-100 text-blue-700' :
                fu.status === 'in_process' ? 'bg-orange-100 text-orange-700' :
                'bg-green-100 text-green-700'
              }`}>
                {fu.status}
              </span>
            </div>
          </div>

          {fu.remarks && (
            <div className="mb-2">
              <span className="text-sm font-medium">Remarks:</span>
              <span className="text-sm text-gray-700 ml-2">{fu.remarks}</span>
            </div>
          )}

          {fu.discussion_notes && (
            <div className="bg-gray-50 p-3 rounded mb-3">
              <div className="text-sm font-medium mb-1">Discussion:</div>
              <div className="text-sm text-gray-700">{fu.discussion_notes}</div>
            </div>
          )}

          {fu.suggested_solution && fu.suggested_solution.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium mb-2">Suggested Products:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {fu.suggested_solution.map((product, idx) => (
                  <div key={idx} className="bg-blue-50 p-2 rounded border-l-2 border-blue-500">
                    <div className="font-medium text-sm">{product.product_name}</div>
                    <div className="text-xs text-gray-600">{product.category}</div>
                    {product.reason && (
                      <div className="text-xs text-gray-500 mt-1">{product.reason}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {fu.created_by_name && (
            <div className="text-xs text-gray-500 mt-3">
              Created by: {fu.created_by_name}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## 📋 COMPLETE IMPLEMENTATION STEPS

### Step 1: Update AddLeadFollowUpForm.jsx
```bash
File: src/components/lead/AddLeadFollowUpForm.jsx
```

**Changes:**
1. Add `discussionNotes` state
2. Add `suggestedProducts` state  
3. Fetch products list from API
4. Add discussion notes textarea
5. Add suggested products section with add/remove functionality
6. Update API payload to include new fields
7. Update validation

### Step 2: Update Follow-up History Display
```bash
File: src/components/lead/AddLeadFollowUpForm.jsx (FollowupHistoryModal component)
```

**Changes:**
1. Display `discussion_notes` field
2. Display `suggested_solution` products with styling
3. Show `created_by_name`
4. Better visual layout for suggestions

### Step 3: Update/Create Customer Detail Page
```bash
File: src/pages/Customer.jsx OR create CustomerDetail.jsx
```

**Changes:**
1. Add new tab "Follow-up History"
2. Create API call to fetch customer's complete history
3. Display all follow-ups across all leads
4. Show suggested products in history

### Step 4: Update Lead Detail Page (Optional)
```bash
File: src/components/lead/LeadDetails.jsx
```

**Changes:**
1. Show total followups count
2. Display latest followup summary
3. Add quick view of suggested products

---

## 🧪 TESTING CHECKLIST

- [ ] Follow-up form loads without old requirement fields
- [ ] Discussion notes field works correctly
- [ ] Can add multiple suggested products
- [ ] Can remove suggested products
- [ ] Product dropdown loads from API
- [ ] Category auto-fills when product selected
- [ ] API payload includes new fields
- [ ] Follow-up history shows discussion notes
- [ ] Follow-up history shows suggested products
- [ ] Customer detail page shows new follow-up history tab
- [ ] Complete history loads across all customer leads
- [ ] Mobile responsive design works

---

## 🎨 CSS/Styling Notes

### Colors to Use:
```css
/* Status badges */
.status-open { bg: #DBEAFE; color: #1E40AF; }
.status-in-process { bg: #FED7AA; color: #C2410C; }
.status-closed { bg: #BBF7D0; color: #15803D; }

/* Suggested product cards */
.product-suggestion {
  background: #EFF6FF;
  border-left: 4px solid #3B82F6;
  padding: 12px;
  border-radius: 8px;
}

/* Discussion notes */
.discussion-notes {
  background: #F9FAFB;
  padding: 12px;
  border-radius: 8px;
}
```

---

## 🚀 DEPLOYMENT NOTES

1. Backend API must be updated first
2. Test all API endpoints in Postman
3. Update frontend code
4. Test in development environment
5. Deploy to staging
6. User acceptance testing
7. Deploy to production

---

## 📞 SUPPORT

Issues face ho to:
1. Check browser console for errors
2. Verify API endpoint URLs
3. Check JWT token in localStorage
4. Verify backend migrations applied
5. Check CORS settings

---

**Last Updated:** July 15, 2026  
**Version:** 2.0  
**Status:** Ready for Implementation
