from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from accounts.models import User
from farms.models import Farm
from aggregators.models import AggregatorProfile, AggregatorFarmConnection, MilkCollection, AggregatorMessage

class Command(BaseCommand):
    help = "Seed realistic quality-graded milk collections, connections, and message history for the test aggregator account."

    def handle(self, *args, **options):
        # 1. Get or create test aggregator
        agg_user, _ = User.objects.get_or_create(
            phone_number='+254700999999',
            defaults={
                'full_name': 'Brookside Agent',
                'role': User.Role.AGGREGATOR,
                'is_active': True
            }
        )
        if not agg_user.has_usable_password():
            agg_user.set_password('pass1234')
            agg_user.save()

        agg_profile, _ = AggregatorProfile.objects.get_or_create(
            user=agg_user,
            defaults={
                'organization_name': 'Brookside Dairy Commercial Logistics',
                'business_reg_no': 'CPR/2024/098124',
                'kra_pin': 'P051888291X',
                'contact_person': 'David Mwangi',
                'office_address': 'Industrial Area, Road C, Cold Depot 4',
                'vehicle_capacity_litres': 5000,
                'payment_terms': 'Weekly',
                'operating_counties': ['Kiambu', 'Nairobi', 'Muranga'],
                'indemnity_agreed': True,
                'indemnity_agreed_at': timezone.now(),
                'is_verified': True
            }
        )
        if not agg_profile.indemnity_agreed:
            agg_profile.indemnity_agreed = True
            agg_profile.indemnity_agreed_at = timezone.now()
            agg_profile.save()

        # 2. Get or create test farmers
        farmer1, _ = User.objects.get_or_create(
            phone_number='+254700111111',
            defaults={'full_name': 'Joe Farmer', 'role': User.Role.FARMER, 'is_active': True}
        )
        farm1, _ = Farm.objects.get_or_create(
            owner=farmer1,
            defaults={'name': 'Baraka Dairy Farm', 'county': 'Kiambu'}
        )

        farmer2, _ = User.objects.get_or_create(
            phone_number='+254700111112',
            defaults={'full_name': 'Mary Wanjiku', 'role': User.Role.FARMER, 'is_active': True}
        )
        farm2, _ = Farm.objects.get_or_create(
            owner=farmer2,
            defaults={'name': 'Green Pastures Dairy', 'county': 'Kiambu'}
        )

        # 3. Create or get connections
        conn1, _ = AggregatorFarmConnection.objects.get_or_create(
            aggregator=agg_profile,
            farm=farm1,
            defaults={'status': AggregatorFarmConnection.Status.ACCEPTED}
        )
        conn1.status = AggregatorFarmConnection.Status.ACCEPTED
        conn1.save()

        conn2, _ = AggregatorFarmConnection.objects.get_or_create(
            aggregator=agg_profile,
            farm=farm2,
            defaults={'status': AggregatorFarmConnection.Status.ACCEPTED}
        )
        conn2.status = AggregatorFarmConnection.Status.ACCEPTED
        conn2.save()

        # 4. Seed 7+ days of quality-graded milk collections
        today = timezone.now().date()
        seed_collections = [
            (conn1, 6, Decimal('140.0'), Decimal('48.0'), Decimal('1.029'), Decimal('4.2'), True, MilkCollection.QualityGrade.GRADE_A, '', 'PAID'),
            (conn2, 6, Decimal('95.0'), Decimal('48.0'), Decimal('1.028'), Decimal('4.8'), True, MilkCollection.QualityGrade.GRADE_A, '', 'PAID'),
            (conn1, 5, Decimal('155.0'), Decimal('48.0'), Decimal('1.030'), Decimal('4.1'), True, MilkCollection.QualityGrade.GRADE_A, '', 'PAID'),
            (conn2, 5, Decimal('110.0'), Decimal('48.0'), Decimal('1.028'), Decimal('4.5'), True, MilkCollection.QualityGrade.GRADE_A, '', 'PAID'),
            (conn1, 4, Decimal('145.0'), Decimal('48.0'), Decimal('1.029'), Decimal('4.4'), True, MilkCollection.QualityGrade.GRADE_A, '', 'PAID'),
            (conn2, 4, Decimal('100.0'), Decimal('48.0'), Decimal('1.027'), Decimal('5.1'), True, MilkCollection.QualityGrade.GRADE_B, '', 'PAID'),
            (conn1, 3, Decimal('160.0'), Decimal('48.0'), Decimal('1.031'), Decimal('4.0'), True, MilkCollection.QualityGrade.GRADE_A, '', 'PAID'),
            (conn2, 3, Decimal('105.0'), Decimal('48.0'), Decimal('1.028'), Decimal('4.6'), True, MilkCollection.QualityGrade.GRADE_A, '', 'PAID'),
            (conn1, 2, Decimal('150.0'), Decimal('50.0'), Decimal('1.030'), Decimal('4.3'), True, MilkCollection.QualityGrade.GRADE_A, '', 'PAID'),
            (conn2, 2, Decimal('115.0'), Decimal('50.0'), Decimal('1.029'), Decimal('4.4'), True, MilkCollection.QualityGrade.GRADE_A, '', 'PAID'),
            (conn1, 1, Decimal('165.0'), Decimal('50.0'), Decimal('1.029'), Decimal('4.1'), True, MilkCollection.QualityGrade.GRADE_A, '', 'PAID'),
            (conn2, 1, Decimal('120.0'), Decimal('50.0'), Decimal('1.028'), Decimal('4.7'), True, MilkCollection.QualityGrade.GRADE_A, '', 'PAID'),
            # Today's pickup
            (conn1, 0, Decimal('170.0'), Decimal('50.0'), Decimal('1.030'), Decimal('4.2'), True, MilkCollection.QualityGrade.GRADE_A, '', 'PAID'),
            (conn2, 0, Decimal('125.0'), Decimal('50.0'), Decimal('1.029'), Decimal('4.5'), True, MilkCollection.QualityGrade.GRADE_A, '', 'PAID'),
            # One rejected historical batch to demonstrate QA controls
            (conn2, 7, Decimal('80.0'), Decimal('48.0'), Decimal('1.021'), Decimal('12.5'), False, MilkCollection.QualityGrade.REJECTED, 'Density below 1.026 - high water dilution detected via lactometer', 'UNPAID'),
        ]

        # Clear previous mock collections for clean seed
        MilkCollection.objects.filter(connection__in=[conn1, conn2]).delete()

        created_count = 0
        for conn, days_ago, litres, price, lacto, temp, alcohol_ok, grade, reason, p_status in seed_collections:
            c_date = today - timedelta(days=days_ago)
            c = MilkCollection(
                connection=conn,
                date=c_date,
                litres_collected=litres,
                price_per_litre=price,
                lactometer_reading=lacto,
                temperature_celsius=temp,
                alcohol_test_passed=alcohol_ok,
                quality_grade=grade,
                rejection_reason=reason,
                payment_status=p_status
            )
            c.save()
            created_count += 1

        # 5. Seed realistic conversation messages
        AggregatorMessage.objects.filter(connection__in=[conn1, conn2]).delete()

        # Messages with Joe Farmer (conn1)
        AggregatorMessage.objects.create(
            connection=conn1,
            sender=farmer1,
            content="Hello David, morning yield was high today! We have 170L ready in the chiller.",
            created_at=timezone.now() - timedelta(hours=3),
            is_read=True
        )
        AggregatorMessage.objects.create(
            connection=conn1,
            sender=agg_user,
            content="Great! Our driver Peter is on Route 1 (Githunguri) and will be at your farm in 20 minutes.",
            created_at=timezone.now() - timedelta(hours=2, minutes=45),
            is_read=True
        )
        AggregatorMessage.objects.create(
            connection=conn1,
            sender=farmer1,
            content="Noted, lactometer test is ready for verification.",
            created_at=timezone.now() - timedelta(hours=2, minutes=30),
            is_read=True
        )
        AggregatorMessage.objects.create(
            connection=conn1,
            sender=agg_user,
            content="Intake verified at 170L, Lactometer 1.030, Grade A premium. Thank you Joe!",
            created_at=timezone.now() - timedelta(hours=1),
            is_read=True
        )

        # Messages with Mary Wanjiku (conn2)
        AggregatorMessage.objects.create(
            connection=conn2,
            sender=farmer2,
            content="Hello Brookside, what time will the truck pass by today?",
            created_at=timezone.now() - timedelta(hours=2),
            is_read=True
        )
        AggregatorMessage.objects.create(
            connection=conn2,
            sender=agg_user,
            content="Truck arrives at 10:15 AM today. Please have your bulk can ready.",
            created_at=timezone.now() - timedelta(hours=1, minutes=15),
            is_read=True
        )

        self.stdout.write(self.style.SUCCESS(f"Successfully seeded {created_count} quality collections and chat history for {agg_profile}."))
