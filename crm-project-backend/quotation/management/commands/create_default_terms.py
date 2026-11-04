from django.core.management.base import BaseCommand
from quotation.terms_models import TermsMaster


class Command(BaseCommand):
    help = 'Create default Terms & Conditions for quotations'

    def handle(self, *args, **options):
        # Clear existing default terms
        TermsMaster.objects.filter(is_default=True).delete()
        
        terms_data = [
            {
                'sequence': 1,
                'title': 'Scope of Work',
                'content': '''The work to be executed under this contract is the complete design, fabrication, assembly/ erection, installation, testing & commissioning NNIT's Hydraulic Car Parking Systems (G+1) Weight 2000KG as per the technical specifications attached.'''
            },
            {
                'sequence': 2,
                'title': 'Price & Terms of Payment',
                'content': '''The total consideration for execution of the above works contract shall be inclusive GST Rs. which shall be due and payable as under:

1) 50% of order value including GST @ 18% as advance along with your order.

2) 40% of order value including GST @ 18% after readiness of material against Proforma invoice.

3) 10% of order value including GST @ 18% after successful trial, installation & handover of the System.

Any delay in payments as per the above schedule shall carry interest @ 24% p.a. Our Rates are based on current prices of steel. If rates of steel escalate more than 2% of current prices of steel at the time of execution of the works contract, then our quoted prices will escalate proportionately.'''
            },
            {
                'sequence': 3,
                'title': 'Taxation',
                'content': '''Quoted prices are inclusive of GST @ 18%, as applicable on works contract defined under section 2(119) of the Central Goods & Services Tax Act, 2017 and the Maharashtra Goods & Services Tax Act, 2017.

Any increase in the present taxation structure by the Central/ State/Local Authorities or any additional taxes demanded by the said authorities in respect of this works contract will be borne by you.

In case any levies, taxes, duties applicable at the time of accepting this purchase order are revised, reviewed, renamed, modified in any manner whatsoever till the completion of this works contract, the increase or modification will be exclusively borne by you.

Any entry taxes which are applicable shall be borne by you with all documents / information related to the entry in your territory / state to be provided by you.

Also, you shall provide us your GSTIN number along with a copy of your GST registration certificate at the time of placing of the order.'''
            },
            {
                'sequence': 4,
                'title': 'Validity',
                'content': '''Our prices are valid for 30 days from the date of this proposal.'''
            },
            {
                'sequence': 5,
                'title': 'Time line',
                'content': '''Once the order is received with the advance as mentioned above, we require 1 to 2 weeks for designing the parking solution to your specific requirements. We shall submit General Arrangement Drawings within one week of receipt of building data, duly signed order copy and advance.

On approval of the design and once technical clearance is obtained for the same, we require 2 to 12 weeks for the fabrication work and assembly/ erection at site.

We will endeavour to carry out the trial run/ testing of the Parking Solution within a period of 12 to 16 weeks from the date of completion of the installation, if the site is handed over for our uninterrupted usage, along with the necessary power supply and storage facilities.

NNIT will hand-over the parking solution to you after completion of trial run/ testing.'''
            },
            {
                'sequence': 6,
                'title': 'Deemed Hand-over',
                'content': '''The Parking solution are deemed to be handed over after 7 days of completion of installation and testing unless proper reason is given by you within the said period regarding non-completion of our work in writing.

The payments against handing over shall fall due immediately against commissioning and handover.'''
            },
            {
                'sequence': 7,
                'title': 'Design and Subsequent Modifications in the Parking Solution',
                'content': '''The parking solution shall be custom-designed and assembled/ erected and installed/ commissioned at your site according to the specifications/ dimensions supplied by you.

Any changes in the specifications subsequent to the initial design approval shall involve rework which shall be invoiced for separately, based on the stage of progress and the time and material involvement.

The estimates of the same shall be discussed with you before commencing the rework.

Please note that no major modification or shifting of the parking solution shall not be possible once the same has been installed on site.'''
            },
            {
                'sequence': 8,
                'title': 'Preparation at site',
                'content': '''You agree at your cost:

i) To construct and complete the civil work as per the general arrangement drawings.

ii) To provide drains and water proofing.

iii) To Provide a steel ladder in the pit (if applicable).

iv) To Paint all the walls to minimize the accumulation and circulation of dust.

v) To provide us free of cost, a 3-phase and single-phase power supply for Installation, Testing & Commissioning.

vi) To provide adequate lighting and ventilation in the area of where the parking solution is to be assembled/ installed.

vii) To provide a safe, easily accessible, covered, weather proof and lockable storage room of approximately 50 sq. mtrs to our fabrication/ erection crew pending until the testing and handover is complete.

viii) To provide adequate safety and security measures to prevent any damage, theft or pilferage of material until the testing and handover is complete.'''
            },
            {
                'sequence': 9,
                'title': 'Title to Property',
                'content': '''It is hereby expressly agreed that the intention of both parties is to transfer the property comprised in the installed parking solution as a whole.

The installed parking solution, including the components/ accessories fitted and comprised therein and forming an integral part there of shall remain the property of NNIT until the payment for the same is made in full by you and you shall not be entitled to use the installed parking solution without such payment.

All tools and tackles and any other equipment used for fabrication, assembly, erection, installation, testing etc. shall remain the property of NNIT and shall be removed by NNIT alone without any objection from you.'''
            },
            {
                'sequence': 10,
                'title': 'Training of Personnel',
                'content': '''We shall train 2 to 4 members from your maintenance staff in handling the parking solution subsequent to the commissioning.'''
            },
            {
                'sequence': 11,
                'title': 'Cancellation of contract',
                'content': '''In the event of cancellation of this works contract at any point of time, we shall be charging you as follows:

i) 10% of the Contract Value plus all applicable taxes before approval of drawings.

ii) 50% of the Contract Value plus all applicable taxes after approval of drawings if the fabrication work has commenced.

iii) 80% of the Contract Value plus all applicable taxes if the fabrication work has already been completed.

iv) 100% of the Contract Value plus all applicable taxes if the assembly/ erection work has commenced at the site.'''
            },
            {
                'sequence': 12,
                'title': 'TDS / Withholding Tax',
                'content': '''Any deduction made from the payment on account of tax deduction at source or works contract tax or any sort of withholding tax under any law in force should be intimated at the time of payment.

In case of non-receipt of the prescribed deduction certificates during the financial year, we have the right to debit any such amount deducted back to your account.

We will not accept any deduction certificates once the financial year has elapsed.

Your account will only be cleared on clearance of cheque in our account.'''
            },
            {
                'sequence': 13,
                'title': 'Intellectual Property Rights',
                'content': '''By and as part of this works contract, NNIT shall be providing you with certain designs as also certain control software which enables routine operation and maintenance/ repair of the parking solution.

You agree that such intellectual properties shall remain the property of NNIT and that no rights in the same are being transferred to you, except a non-exclusive license to use the control software to operate the parking solution as designed.

You expressly agree that you shall have no rights to reproduce, reverse engineer or otherwise deal in the designs or the control software or any other intellectual property rights in any manner.'''
            },
            {
                'sequence': 14,
                'title': 'Arbitration',
                'content': '''Any Dispute shall be referred to and finally resolved by arbitration under the Arbitration and Conciliation Act, 1996 as amended time to time.

The number of arbitrators shall be one, mutually accepted by the parties.

Any arbitral award shall be final and binding on the parties.

The seat of the arbitration shall be Pune.

The language of the arbitration shall be English.'''
            },
            {
                'sequence': 15,
                'title': 'Jurisdiction',
                'content': '''The contract is deemed to be conducted at Pune and only courts in this place shall have jurisdiction in the event of any dispute whatsoever.'''
            },
            {
                'sequence': 16,
                'title': 'Force Major Conditions',
                'content': '''NNIT shall not be liable for any loss, damage or delay due to any cause beyond NNIT's reasonable control including but not limited to lack of embargoes, acts of governments, strikes, lockouts, fire, accident, explosion, theft, floods, riots, civil commotion, war, malicious mischief, energy crisis, rail/road transporter's strike, go-slow bundhs, act of God or of the State's Enemies or act of a third party.

NNIT shall intimate in writing within two weeks of occurrence of the force majeure conditions as defined in the clause hereinabove to you together with an estimate of the likely duration of the persistence of the force majeure conditions.'''
            },
            {
                'sequence': 17,
                'title': 'Warranty/ Maintenance',
                'content': '''NNIT shall warrant the installed parking solution for period of Twelve months from date of handover/ deemed handover only for mechanical parts, electrical & electronics parts are not covered under warranty.

After the expiry of warranty period, further maintenance shall be carried out only with the execution of a separate Annual Maintenance Contract at a rate of 5%(Non Comprehensive) of the contract value per annum.'''
            },
            {
                'sequence': 18,
                'title': 'Exclusions to Warranty',
                'content': '''Any unauthorized use or attempt of unauthorized use of the parking solution shall render the warranty and free maintenance during the aforesaid period null and void.

NNIT shall not be liable to repair/replace any part, which is damaged or becomes faulty due to improper use.

NNIT shall have no liability for defects or depreciation caused by accidents, natural disasters, negligence or other abnormal conditions.

NNIT shall also cease to be liable for the warranty in case you attempt to use the parking solution before the formal handover or attempt to repair the parking solution or replace parts therein with a contractor or parts other than those approved or recommended by NNIT in writing or upon breach of any of the other conditions comprised herein.'''
            },
        ]

        created_count = 0
        for term_data in terms_data:
            term, created = TermsMaster.objects.get_or_create(
                sequence=term_data['sequence'],
                defaults={
                    'title': term_data['title'],
                    'content': term_data['content'],
                    'is_default': True,
                    'is_active': True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created: {term.sequence}. {term.title}')
                )
            else:
                # Update existing
                term.title = term_data['title']
                term.content = term_data['content']
                term.is_default = True
                term.is_active = True
                term.save()
                self.stdout.write(
                    self.style.WARNING(f'Updated: {term.sequence}. {term.title}')
                )

        self.stdout.write(
            self.style.SUCCESS(f'\n✅ Successfully processed {len(terms_data)} default terms!')
        )
        self.stdout.write(
            self.style.SUCCESS(f'   - Created: {created_count}')
        )
        self.stdout.write(
            self.style.SUCCESS(f'   - Updated: {len(terms_data) - created_count}')
        )
