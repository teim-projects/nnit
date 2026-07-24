# 🚀 Quick Start Guide - Terms & Conditions

## START SERVERS

### Terminal 1 - Backend
```bash
cd crm-project-backend
python manage.py runserver
```

### Terminal 2 - Frontend
```bash
cd crm-project-frontend
npm run dev
```

---

## ACCESS THE SYSTEM

1. **Open Browser:** http://localhost:5173
2. **Login** with your credentials
3. **Click** "Terms & Conditions" in sidebar
4. **View** 18 pre-populated terms

---

## QUICK ACTIONS

### Add New Term
1. Click "Add New Term" button
2. Fill: Sequence, Title, Content
3. Toggle Active/Default
4. Click "Create"

### Edit Term
1. Click edit icon (pencil)
2. Modify fields
3. Click "Update"

### Delete Term
1. Click delete icon (trash)
2. Confirm deletion

### Attach Terms to Quotation
1. Go to Quotations
2. Create/Edit quotation
3. Expand "Terms & Conditions"
4. Select terms
5. Click "Save Selected Terms"

---

## API ENDPOINTS

```
GET    /api/quotation/terms/                    # List all terms
POST   /api/quotation/terms/                    # Create term
PATCH  /api/quotation/terms/{id}/               # Update term
DELETE /api/quotation/terms/{id}/               # Delete term

GET    /api/quotation/quotation-terms/          # List quotation terms
POST   /api/quotation/quotation-terms/bulk-create/  # Bulk attach
POST   /api/quotation/quotation-terms/apply-defaults/  # Apply defaults
```

---

## FILES CREATED/MODIFIED

### Backend
- ✅ `quotation/terms_models.py`
- ✅ `quotation/serializers.py`
- ✅ `quotation/views.py`
- ✅ `quotation/urls.py`
- ✅ `quotation/admin.py`
- ✅ `quotation/management/commands/populate_terms.py`

### Frontend
- ✅ `src/pages/TermsManagement.jsx`
- ✅ `src/components/QuotationTermsSelector.jsx`
- ✅ `src/components/QuotationTermsView.jsx`
- ✅ `src/App.jsx`
- ✅ `src/components/Sidebar.jsx`

---

## 18 DEFAULT TERMS

1. Scope of Work
2. Price & Terms of Payment
3. Taxation
4. Validity
5. Time line
6. Deemed Hand-over
7. Design and Subsequent Modifications
8. Preparation at site
9. Title to Property
10. Training of Personnel
11. Cancellation of contract
12. TDS / Withholding Tax
13. Intellectual Property Rights
14. Arbitration
15. Jurisdiction
16. Force Major Conditions
17. Warranty/ Maintenance
18. Exclusions to Warranty

---

## TROUBLESHOOTING

**Backend not starting?**
```bash
# Kill existing process on port 8000
# Or use different port:
python manage.py runserver 8001
```

**Frontend errors?**
```bash
# Reinstall dependencies
npm install
npm run dev
```

**Terms not loading?**
- Check browser console (F12)
- Verify backend is running
- Check API: http://localhost:8000/api/quotation/terms/

---

## SUCCESS! ✅

Your Terms & Conditions system is ready to use!

📄 Full documentation: `TERMS_COMPLETE_READY_TO_TEST.md`
