from django.core.management.base import BaseCommand
from quotation.terms_models import TermsMaster


class Command(BaseCommand):
    help = 'Add all 18 default terms & conditions to the database'

    def handle(self, *args, **options):
        # Clear existing terms
        TermsMaster.objects.all().delete()
        self.stdout.write("Cleared existing terms...")

        terms_data = [
            {
                'sequence': 1,
                'title': 'Scope of Work',
                'content': '''<p>The work to be executed under this contract is the complete design, fabrication, assembly/ erection, installation, testing & commissioning NNIT's Hydraulic Car Parking Systems (G+1) Weight 2000KG as per the technical specifications attached.</p>'''
            },
            {
                'sequence': 2,
                'title': 'Price & Terms of Payment',
                'content': '''<p>The total consideration for execution of the above works contract shall be inclusive GST Rs. which shall be due and payable as under:</p>
<p>1) 50% of order value including GST @ 18% as advance along with your order.</p>
<p>2) 40% of order value including GST @ 18% after readiness of material against Proforma invoice.</p>
<p>3) 10% of order value including GST @ 18% after successful trial, installation & handover of the System.</p>
<p>Any delay in payments as per the above schedule shall carry interest @ 24% p.a. Our Rates are based on current prices of steel. If rates of steel escalate more than 2% of current prices of steel at the time of execution of the works contract, then our quoted prices will escalate proportionately.</p>'''
            },
            {
                'sequence': 3,
                'title': 'Taxation',
                'content': '''<p>Quoted prices are inclusive of GST @ 18%, as applicable on works contracts defined under section 2(119) of the Central Goods & Services Tax Act, 2017 and the Maharashtra Goods & Services Tax Act, 2017. Any increase in the present taxation structure by the central/state/local authorities or any additional taxes demanded by the said authorities in respect of this works contract will be borne by you. In case any levies, taxes, or duties applicable at the time of accepting this purchase order are revised, reviewed, renamed, or modified in any manner whatsoever till the completion of this works contract, the increase or modification will be exclusively borne by you. Any entry taxes which are applicable shall be borne by you with all documents / information related to the entry in your territory / state to be provided by you. Also, you shall provide us your GSTIN number along with a copy of your GST registration certificate at the time of placing of the order.</p>'''
            },
            {
                'sequence': 4,
                'title': 'Validity',
                'content': '''<p>Our prices are valid for 30 days from the date of this proposal.</p>'''
            },
            {
                'sequence': 5,
                'title': 'Time line',
                'content': '''<p>Once the order is received along with the advance payment as mentioned above, we require approximately 1 to 2 weeks to design the parking solution according to your specific requirements. We shall submit the General Arrangement (GA) Drawings within one week of receiving the complete building data, the duly signed order copy, and the advance payment. Upon approval of the design and receipt of the necessary technical clearance, we require approximately 2 to 12 weeks for fabrication, assembly, and erection of the parking solution at the site. Thereafter, we will endeavour to complete the trial run and testing of the parking solution within 12 to 16 weeks, provided the site is handed over to us for uninterrupted use along with the required power supply and storage facilities. Upon successful completion of the trial run and testing, NNIT will formally hand over the fully operational parking solution to you.</p>'''
            },
            {
                'sequence': 6,
                'title': 'Deemed Hand-over',
                'content': '''<p>The Parking solution are deemed to be handed over after 7 days of completion of installation and testing unless proper reason is given by you within the said period regarding non-completion of our work in writing. The payments against handing over shall fall due immediately against commissioning and handover.</p>'''
            },
            {
                'sequence': 7,
                'title': 'Design and Subsequent Modifications in the Parking Solution',
                'content': '''<p>The parking solution shall be custom-designed, fabricated, assembled, erected, installed, and commissioned at your site in accordance with the specifications and dimensions provided by you. Any changes to the approved specifications after the initial design approval will require rework, which shall be charged separately based on the stage of project completion and the additional time, labour, and materials involved. The estimated cost of such rework will be discussed with you and approved before the work is undertaken. Please note that once the parking solution has been installed and commissioned at the site, any major modification, relocation, or shifting of the system may not be feasible.</p>'''
            },
            {
                'sequence': 8,
                'title': 'Preparation at site',
                'content': '''<p>You agree at your cost:</p>
<p>i) To construct and complete the civil work as per the general arrangement drawings.</p>
<p>ii) To provide drains and water proofing.</p>
<p>iii) To Provide a steel ladder in the pit (if applicable).</p>
<p>iv) To Paint all the walls to minimize the accumulation and circulation of dust.</p>
<p>v) To provide us free of cost, a 3-phase and single-phase power supply for Installation, Testing & Commissioning.</p>
<p>vi) To provide adequate lighting and ventilation in the area of where the parking solution is to be assembled/ installed.</p>
<p>vii) To provide a safe, easily accessible, covered, weather proof and lockable storage room of approximately 50 sq. mtrs to our fabrication/ erection crew pending until the testing and handover is complete.</p>
<p>viii) To provide adequate safety and security measures to prevent any damage, theft or pilferage of material until the testing and handover is complete.</p>'''
            },
            {
                'sequence': 9,
                'title': 'Title to Property',
                'content': '''<p>It is hereby expressly agreed that the intention of both parties is to transfer ownership of the installed parking solution as a complete and integrated system upon full payment. Until the entire purchase price and all applicable charges have been paid in full by you, the installed parking solution, including all components, accessories, and integral parts thereof, shall remain the sole property of NNIT, and you shall have no ownership rights over the system until such payment is received. All tools, tackles, machinery, equipment, and other materials used by NNIT for fabrication, assembly, erection, installation, commissioning, testing, and related activities shall remain the exclusive property of NNIT and may be removed by NNIT upon completion of the work without any objection or claim from you.</p>'''
            },
            {
                'sequence': 10,
                'title': 'Training of Personnel',
                'content': '''<p>We shall train 2 to 4 members from your maintenance staff in handling the parking solution subsequent to the commissioning.</p>'''
            },
            {
                'sequence': 11,
                'title': 'Cancellation of contract',
                'content': '''<p>In the event of cancellation of this works contract at any point of time, we shall be charging you as follows:</p>
<p>i) 10% of the Contract Value plus all applicable taxes before approval of drawings.</p>
<p>ii) 50% of the Contract Value plus all applicable taxes after approval of drawings if the fabrication work has commenced.</p>
<p>iii) 80% of the Contract Value plus all applicable taxes if the fabrication work has already been completed.</p>
<p>iv) 100% of the Contract Value plus all applicable taxes if the assembly/ erection work has commenced at the site.</p>'''
            },
            {
                'sequence': 12,
                'title': 'TDS / Withholding Tax',
                'content': '''<p>Any deduction made from the payment on account of Tax Deducted at Source (TDS), Works Contract Tax (WCT), or any other withholding tax applicable under the prevailing laws shall be duly intimated to NNIT at the time of payment. In the event that the prescribed tax deduction certificates are not received by NNIT within the relevant financial year, NNIT reserves the right to debit the corresponding deducted amount back to your account. Please note that tax deduction certificates submitted after the close of the relevant financial year will not be accepted. Furthermore, all payments made by cheque shall be deemed received only upon successful realisation and clearance of the cheque in NNIT's designated bank account.</p>'''
            },
            {
                'sequence': 13,
                'title': 'Intellectual Property Rights',
                'content': '''<p>As part of this works contract, NNIT shall provide you with the necessary engineering designs, technical drawings, and control software required for the operation, maintenance, and repair of the parking solution. You acknowledge and agree that all such designs, software, documentation, source code, technical know-how, and other intellectual property rights shall remain the exclusive property of NNIT. No ownership or proprietary rights in these intellectual properties are transferred to you, except for a limited, non-exclusive, non-transferable licence to use the control software solely for operating the parking solution in the manner intended by NNIT. You further agree that you shall not copy, reproduce, modify, distribute, sublicense, disclose, reverse engineer, decompile, disassemble, or otherwise exploit the designs, software, documentation, or any other intellectual property belonging to NNIT without the prior written consent of NNIT.</p>'''
            },
            {
                'sequence': 14,
                'title': 'Arbitration',
                'content': '''<p>Any dispute, controversy, or claim arising out of or in connection with this Contract, including its interpretation, performance, breach, termination, or validity, shall be referred to and finally resolved by arbitration in accordance with the provisions of the Arbitration and Conciliation Act, 1996, as amended from time to time. The arbitration shall be conducted by a sole arbitrator mutually appointed by both parties. In the event that the parties fail to mutually agree upon the appointment of the arbitrator, the appointment shall be made in accordance with the provisions of the said Act. The arbitral proceedings shall be conducted in the English language, and the seat as well as the venue of arbitration shall be Pune, Maharashtra, India. The arbitral award shall be final, binding, and enforceable upon both parties, and each party shall comply with the award without delay, subject only to such remedies as may be available under the applicable law.</p>'''
            },
            {
                'sequence': 15,
                'title': 'Jurisdiction',
                'content': '''<p>The contract is deemed to be conducted at Pune and only courts in this place shall have jurisdiction in the event of any dispute whatsoever.</p>'''
            },
            {
                'sequence': 16,
                'title': 'Force Major Conditions',
                'content': '''<p>NNIT shall not be liable for any failure, delay, or inability to perform its obligations under this Contract to the extent such failure or delay is caused by events beyond its reasonable control, including but not limited to government actions or restrictions, embargoes, strikes, lockouts, labour disputes, fire, accidents, explosions, theft, floods, earthquakes, cyclones, pandemics, epidemics, riots, civil commotion, war, terrorism, malicious acts, power shortages, energy crises, transportation disruptions, rail or road transport strikes, go-slows, bandhs, acts of God, acts of the State or its enemies, or any act or omission of a third party ("Force Majeure Event"). Upon the occurrence of any such Force Majeure Event, NNIT shall notify you in writing within two (2) weeks of becoming aware of the event, providing reasonable details of the circumstances and an estimate of the expected duration of the Force Majeure Event. During the continuance of such event, the obligations of NNIT affected by the Force Majeure Event shall remain suspended to the extent of such impact, and the time for performance shall be extended accordingly without any liability to NNIT.</p>'''
            },
            {
                'sequence': 17,
                'title': 'Warranty/ Maintenance',
                'content': '''<p>NNIT warrants the installed parking solution for a period of Twelve (12) months from the date of handover or deemed handover, covering only the mechanical components of the system against defects arising from faulty workmanship or manufacturing under normal operating conditions. Electrical, electronic, control, software, sensors, motors, drives, cables, and other electrical or electronic components are specifically excluded from this warranty unless otherwise expressly agreed in writing. The warranty shall not cover defects or damages resulting from misuse, negligence, unauthorised modifications, accidents, improper operation, inadequate maintenance, power fluctuations, natural calamities, or normal wear and tear. Upon expiry of the warranty period, preventive and corrective maintenance services may be continued only through the execution of a separate Annual Maintenance Contract (AMC). The AMC shall be offered on a Non-Comprehensive basis at an annual charge of 5% of the total contract value, or at such prevailing rates as may be mutually agreed between the parties at the time of renewal.</p>'''
            },
            {
                'sequence': 18,
                'title': 'Exclusions to Warranty',
                'content': '''<p>Any unauthorised use, operation, modification, tampering, or attempted unauthorised use of the parking solution shall immediately render the warranty and any complimentary maintenance services provided during the warranty period null and void. NNIT shall not be responsible for repairing or replacing any component that is damaged or becomes defective due to improper operation, misuse, negligence, overloading, unauthorised alterations, accidents, power fluctuations, vandalism, or any use contrary to the operating instructions provided by NNIT. Furthermore, NNIT shall have no liability for defects, failures, or depreciation arising from accidents, natural calamities, fire, floods, earthquakes, or any other abnormal or unforeseen conditions beyond its reasonable control. The warranty shall also automatically cease to apply if you operate or attempt to use the parking solution prior to its formal handover or commissioning by NNIT, or if any repair, maintenance, replacement, modification, or servicing is carried out by any person, contractor, or service provider other than NNIT or its authorised representatives, or if non-approved spare parts or components are used without the prior written approval of NNIT. Any breach of the terms and conditions of this Contract shall likewise result in the immediate termination of the warranty obligations of NNIT.</p>'''
            },
        ]

        created_count = 0
        for term_data in terms_data:
            term, created = TermsMaster.objects.get_or_create(
                sequence=term_data['sequence'],
                defaults={
                    'title': term_data['title'],
                    'content': term_data['content'],
                    'is_active': True,
                    'is_default': True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f"✓ Created Term {term.sequence}: {term.title}")
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f"○ Term {term.sequence} already exists: {term.title}")
                )

        self.stdout.write(
            self.style.SUCCESS(f"\n✅ Successfully added {created_count} terms to database!")
        )
        self.stdout.write(f"Total active terms: {TermsMaster.objects.filter(is_active=True).count()}")
