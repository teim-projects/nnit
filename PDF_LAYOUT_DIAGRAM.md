# 📐 Quotation PDF Layout Diagram

## Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│ ███████████████████████████████████████████ ORANGE STRIP 8px│
│ ███████████████████████████████████████████ BLUE STRIP 3px  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────┐   NNIT CAR PARKING SYSTEMS PVT. LTD.           │
│  │        │   (NILESH NIRMAN INNOVATIVE TECHNOLOGIES)        │
│  │  NNIT  │   Office: Survey No.37 Ground Floor...          │
│  │  LOGO  │   ☎ +91 9518377159  🌐 www.nnitcarparking.in   │
│  │        │   ✉ info@nnitcarparking.in                     │
│  └────────┘   ─────────────────────────────────────         │
│                                                               │
│                      QUOTATION                                │
│                      ──────────                               │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Project Name: Pune Residency Complex                 │   │
│  │ Product Name: Automated Parking System               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Parking Solution │ Units │ Rate │ Install │ Cars │ Total│
│  ├─────────────────────────────────────────────────────┤   │
│  │ 2-Post Parking   │   5   │50,000│  5,000  │  10  │...  │
│  │ System           │       │      │         │      │     │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Basic Total Value      │  2,75,000.00   │   │
│  │              Add: SGST @ 9.00%      │     24,750.00  │   │
│  │              Add: CGST @ 9.00%      │     24,750.00  │   │
│  │              Grand Total Value      │  3,24,500.00   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Total Contract Value in words:                       │   │
│  │ Rs. Three Lakhs Twenty Four Thousand Five Hundred    │   │
│  │ Rupees Only                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
│                                                               │
│  Customer's Seal &          For NNIT Car Parking Systems    │
│  Signature                                                   │
│  ─────────────              ─────────────                   │
│                             Authorized Signatory             │
│                                                               │
│                    [WATERMARK: Faded NNIT logo]              │
│                                                               │
│ ███████████████████████████████████████████ ORANGE STRIP 8px│
│ ███████████████████████████████████████████ BLUE STRIP 3px  │
└─────────────────────────────────────────────────────────────┘
```

---

## Color Coding

```
████ ORANGE STRIP (#d97706) - 8px height
███  BLUE STRIP (#123b73) - 3px height
```

---

## Page Measurements

```
┌─ 0mm (page edge)
│
├─ 11mm (top strip + blue strip)
│
├─ 28mm (content starts) ◄──── TOP MARGIN
│  ┌─────────────────────────
│  │
│  │  HEADER (Logo + Company)
│  │
│  │  TITLE
│  │
│  │  PROJECT BOX
│  │
│  │  PRODUCT TABLE
│  │
│  │  GST TOTALS
│  │
│  │  AMOUNT IN WORDS
│  │
│  │  SIGNATURES
│  │
│  │
│  └─────────────────────────
│
├─ 279mm (content ends) ◄──── BOTTOM MARGIN (18mm from bottom)
│
├─ 286mm (orange strip starts)
│
├─ 294mm (blue strip starts)
│
└─ 297mm (page edge)

◄──────── 210mm wide ────────►
   12mm │  186mm content │ 12mm
   margin                margin
```

---

## Z-Index Layers

```
┌─────────────────────────────────────────┐
│                                         │
│  Layer 5 (z-index: 5) - CONTENT        │
│  ┌────────────────────────────────┐   │
│  │ • Header                        │   │
│  │ • Tables                        │   │
│  │ • Text                          │   │
│  │ • Footer                        │   │
│  └────────────────────────────────┘   │
│                                         │
│  Layer 0 (z-index: 0) - WATERMARK     │
│  ┌────────────────────────────────┐   │
│  │    [Faded NNIT Logo 6% opacity]│   │
│  │         330px wide             │   │
│  └────────────────────────────────┘   │
│                                         │
│  Layer -1 (position: absolute) - STRIPS│
│  ┌────────────────────────────────┐   │
│  │ Top Orange (8px)                │   │
│  │ Top Blue (3px)                  │   │
│  │ Bottom Orange (8px)             │   │
│  │ Bottom Blue (3px)               │   │
│  └────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Header Layout Details

```
┌──────────────────────────────────────────────┐
│ ┌────────┐  ┌──────────────────────────┐   │
│ │        │  │   COMPANY NAME (Orange)   │   │
│ │  LOGO  │  │   Subtitle (Blue)         │   │
│ │ 125px  │  │   Address                 │   │
│ │        │  │   Contact Details         │   │
│ │        │  │   ───────────────         │   │
│ └────────┘  └──────────────────────────┘   │
│   140px              Centered                │
│   wide               flex: 1                 │
└──────────────────────────────────────────────┘
```

---

## Typography Scale

```
COMPANY NAME
├─ Font Size: 24px
├─ Color: #d97706 (Orange)
├─ Weight: Bold
└─ Alignment: Center

SUBTITLE
├─ Font Size: 12px
├─ Color: #123b73 (Blue)
└─ Alignment: Center

QUOTATION TITLE
├─ Font Size: 17px
├─ Weight: Bold
├─ Decoration: Underline
└─ Alignment: Center

ADDRESS
├─ Font Size: 10px
├─ Color: #000
└─ Alignment: Center

CONTACT
├─ Font Size: 10px
├─ Weight: Bold
└─ Alignment: Center

BODY TEXT
├─ Font Size: 11px
├─ Family: Arial, Helvetica
└─ Line Height: 1.5

TABLE TEXT
├─ Font Size: 9.5px
└─ Line Height: 1.4
```

---

## Strip Positions

### Top Strips
```
┌──────────────────────────────┐ ◄─ 0px (page top)
│ ORANGE STRIP (8px height)     │
├──────────────────────────────┤ ◄─ 8px
│ BLUE STRIP (3px height)       │
└──────────────────────────────┘ ◄─ 11px
```

### Bottom Strips
```
┌──────────────────────────────┐ ◄─ 5px from bottom
│ ORANGE STRIP (8px height)     │
├──────────────────────────────┤ ◄─ 8px from bottom
│ BLUE STRIP (3px height)       │
└──────────────────────────────┘ ◄─ 0px (page bottom)
```

---

## Watermark Configuration

```css
.page::before {
  content: "";
  position: absolute;
  top: 90px;           ◄─ Starts 90px from page top
  left: 0;
  right: 0;
  bottom: 0;
  background: url("logo-nnit.png") 
              center 45% no-repeat;
  background-size: 330px;  ◄─ Logo width
  opacity: .06;        ◄─ Very light (6%)
  z-index: 0;          ◄─ Behind everything
}
```

### Visual Effect
```
┌────────────────────────────┐
│                            │
│   Regular Content          │
│   (100% opacity)           │
│                            │
│     ┌──────────┐          │
│     │          │          │
│     │  NNIT    │ 6% opacity
│     │  LOGO    │          │
│     │          │          │
│     └──────────┘          │
│                            │
│   More Content             │
│                            │
└────────────────────────────┘
```

---

## Table Structure

```
┌────────────────────────────────────────────────────┐
│ Parking Solution │Units│Rate│Install│Cars│ Total  │
│      28%         │ 9% │17% │  17%  │ 9%│  20%   │
├────────────────────────────────────────────────────┤
│ 2-Post Parking   │  5  │... │  ...  │ 10│ 55,000 │
│ System           │     │    │       │   │        │
├────────────────────────────────────────────────────┤
│                     Basic Total Value │  2,75,000 │
├────────────────────────────────────────────────────┤
│              Add: SGST @ 9.00%        │    24,750 │
│              Add: CGST @ 9.00%        │    24,750 │
├────────────────────────────────────────────────────┤
│                  Grand Total Value    │  3,24,500 │
└────────────────────────────────────────────────────┘
```

---

## Responsive Breakpoints

### A4 Portrait
- Width: 210mm (8.27 inches)
- Height: 297mm (11.69 inches)
- Orientation: Portrait
- DPI: 96 (default)

### Content Area
- Width: 186mm (210mm - 12mm - 12mm)
- Height: 251mm (297mm - 28mm - 18mm)

---

## Print Margins

```
        12mm
    ┌─────────────┐
    │             │
28mm│   CONTENT   │18mm
    │             │
    └─────────────┘
        12mm
```

---

## Color Palette Summary

| Element           | Color Code | Visual        |
|-------------------|------------|---------------|
| Orange Strip      | #d97706    | ████████████  |
| Blue Strip        | #123b73    | ████████████  |
| Company Name      | #d97706    | NNIT PARKING  |
| Subtitle          | #123b73    | (NILESH...)   |
| Body Text         | #000000    | Black         |
| Table Header      | #ececec    | Light Gray    |
| Grand Total Row   | #fff9e6    | Light Yellow  |
| Watermark         | #d97706    | 6% opacity    |

---

## Elements Checklist

### Page 1 (Quotation)
- [x] Top Orange Strip (8px)
- [x] Top Blue Strip (3px)
- [x] Logo Image (125px wide)
- [x] Company Name (Orange, 24px, Bold)
- [x] Subtitle (Blue, 12px)
- [x] Address (10px)
- [x] Contact Row (Phone, Web, Email)
- [x] Orange Separator Line (2px)
- [x] "QUOTATION" Title (17px, Bold, Underlined)
- [x] Project Box (Border, Details)
- [x] Product Table (6 columns)
- [x] GST Breakdown Table
- [x] Amount in Words Box
- [x] Customer Signature Section
- [x] Company Signature Section
- [x] Watermark (Faded Logo, 6% opacity)
- [x] Bottom Orange Strip (8px)
- [x] Bottom Blue Strip (3px)

### Page 2 (Terms & Conditions)
- [x] Same Header Design
- [x] "TERMS & CONDITIONS" Title
- [x] Terms List (Numbered)
- [x] Same Footer Design
- [x] Same Watermark
- [x] Same Strips

---

## CSS Classes Reference

```css
.page               // Main page container
.top-orange         // Top orange strip
.top-blue           // Top blue strip
.header             // Header container
.logo               // Logo wrapper
.company            // Company info container
.company h1         // Company name
.company h2         // Subtitle
.company p          // Address
.company-contact    // Contact row
.header-line        // Orange separator
.doc-title          // Page title
.project-box        // Project details box
.main-table         // Product table
.totals-table       // GST breakdown table
.amount-words       // Amount in words box
.footer             // Signatures container
.sig-line           // Signature underline
.footer-orange      // Bottom orange strip
.footer-blue        // Bottom blue strip
```

---

## Testing Checklist

When you test the PDF, verify these visual elements:

✅ **Top Section**
- [ ] Orange strip at very top (thick)
- [ ] Blue strip below orange (thin)
- [ ] Logo visible on left
- [ ] Company name in orange, centered
- [ ] Contact details with icons

✅ **Middle Section**
- [ ] "QUOTATION" centered and underlined
- [ ] Project/product box with border
- [ ] Table with all data
- [ ] Numbers formatted correctly (Indian style)
- [ ] GST breakdown showing percentages

✅ **Bottom Section**
- [ ] Signature sections on left and right
- [ ] Orange strip (thick)
- [ ] Blue strip (thin)

✅ **Throughout**
- [ ] Watermark visible but very light
- [ ] No overlapping text
- [ ] Professional spacing
- [ ] Colors match brand

---

**File**: This layout is implemented in `templates/pdf/quotation.html`  
**Status**: ✅ Complete  
**Ready**: Yes - test by viewing any quotation PDF
