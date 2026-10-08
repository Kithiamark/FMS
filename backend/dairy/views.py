from core.utils import get_user_farm
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.core.exceptions import ValidationError
from django.utils import timezone
from .models import MilkRecord
from .serializers import MilkRecordSerializer
from accounts.permissions import IsFarmer, IsAdmin

class MilkRecordViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsFarmer | IsAdmin]
    serializer_class = MilkRecordSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return MilkRecord.objects.all()
        # MilkRecord belongs to an Animal, and Animal belongs to a Farm. Keep this
        # filter in one place so list/detail/summary endpoints all enforce tenancy.
        return MilkRecord.objects.filter(animal__farm=get_user_farm(user))

    def perform_create(self, serializer):
        # Defense in depth: serializers validate shape, this check validates ownership.
        animal = serializer.validated_data['animal']
        if animal.farm != get_user_farm(self.request.user) and self.request.user.role != 'ADMIN':
             raise PermissionError("Cannot add record for animal not in your farm")
        serializer.save(recorded_by=self.request.user)

    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk(self, request):
        # DailyMilkEntry sends all rows for a date together. update_or_create makes
        # repeated saves idempotent for the same animal/date pair.
        records = request.data if isinstance(request.data, list) else request.data.get('records', [])
        if not records:
            return Response({'error': 'No milk records supplied.'}, status=status.HTTP_400_BAD_REQUEST)

        saved = []
        errors = []
        for index, payload in enumerate(records):
            serializer = self.get_serializer(data=payload)
            if not serializer.is_valid():
                errors.append({'index': index, 'errors': serializer.errors})
                continue

            animal = serializer.validated_data['animal']
            if request.user.role != 'ADMIN' and animal.farm != request.user.farm:
                errors.append({'index': index, 'errors': {'animal': ['Animal does not belong to your farm.']}})
                continue

            try:
                instance, _ = MilkRecord.objects.update_or_create(
                    animal=animal,
                    date=serializer.validated_data['date'],
                    defaults={
                        'morning_yield': serializer.validated_data.get('morning_yield', 0),
                        'evening_yield': serializer.validated_data.get('evening_yield', 0),
                        'home_use_litres': serializer.validated_data.get('home_use_litres', 0),
                        'sold_litres': serializer.validated_data.get('sold_litres', 0),
                        'calf_litres': serializer.validated_data.get('calf_litres', 0),
                        'notes': serializer.validated_data.get('notes', ''),
                        'recorded_by': request.user,
                    }
                )
            except ValidationError as exc:
                errors.append({'index': index, 'errors': exc.message_dict if hasattr(exc, 'message_dict') else exc.messages})
                continue
            saved.append(instance)

        if errors:
            return Response({'saved': MilkRecordSerializer(saved, many=True).data, 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
        return Response(MilkRecordSerializer(saved, many=True).data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        # Stats logic here
        queryset = self.get_queryset()
        today = timezone.now().date()
        today_yield = queryset.filter(date=today).aggregate(total=Sum('morning_yield') + Sum('evening_yield'))['total'] or 0
        return Response({'today_yield': today_yield})

    @action(detail=False, methods=['get'], url_path=r'summary/daily')
    def daily_summary(self, request):
        # Dashboard and DailyMilkEntry both use this shape. Keep `usage`, `records`,
        # and `per_animal` stable unless the matching frontend hooks are updated.
        target_date = request.query_params.get('date') or timezone.now().date()
        queryset = self.get_queryset().filter(date=target_date)
        total = queryset.aggregate(total=Sum('total_yield'))['total'] or 0
        per_animal = (
            queryset
            .values('animal__id', 'animal__name', 'animal__ear_tag')
            .annotate(
                total_yield=Sum('total_yield'),
                home_use_litres=Sum('home_use_litres'),
                sold_litres=Sum('sold_litres'),
                calf_litres=Sum('calf_litres'),
            )
            .order_by('animal__name')
        )
        usage = queryset.aggregate(
            home=Sum('home_use_litres'),
            sold=Sum('sold_litres'),
            calves=Sum('calf_litres'),
        )
        allocated = float((usage['home'] or 0) + (usage['sold'] or 0) + (usage['calves'] or 0))
        return Response({
            'date': str(target_date),
            'total_farm_yield': float(total),
            'usage': {
                'home': float(usage['home'] or 0),
                'sold': float(usage['sold'] or 0),
                'calves': float(usage['calves'] or 0),
                'allocated': allocated,
                'unallocated': float(total) - allocated,
            },
            'records_count': queryset.count(),
            'records': MilkRecordSerializer(queryset.select_related('animal'), many=True).data,
            'per_animal': list(per_animal),
        })

    @action(detail=False, methods=['get'], url_path=r'summary/monthly')
    def monthly_summary(self, request):
        # ProductionDashboard expects one row per recorded day plus usage totals.
        # Missing days are intentionally omitted; the UI treats them as no records.
        today = timezone.now().date()
        year = int(request.query_params.get('year') or today.year)
        month = int(request.query_params.get('month') or today.month)
        queryset = self.get_queryset().filter(date__year=year, date__month=month)
        daily_totals = (
            queryset
            .annotate(day=TruncDate('date'))
            .values('day')
            .annotate(
                total=Sum('total_yield'),
                home=Sum('home_use_litres'),
                sold=Sum('sold_litres'),
                calves=Sum('calf_litres'),
            )
            .order_by('day')
        )
        totals = [float(row['total'] or 0) for row in daily_totals]
        return Response({
            'year': year,
            'month': month,
            'daily_totals': [
                {
                    'date': row['day'].isoformat(),
                    'total': float(row['total'] or 0),
                    'home': float(row['home'] or 0),
                    'sold': float(row['sold'] or 0),
                    'calves': float(row['calves'] or 0),
                }
                for row in daily_totals
            ],
            'stats': {
                'avg_daily': sum(totals) / len(totals) if totals else 0,
                'max_yield': max(totals) if totals else 0,
                'total_home': float(queryset.aggregate(total=Sum('home_use_litres'))['total'] or 0),
                'total_sold': float(queryset.aggregate(total=Sum('sold_litres'))['total'] or 0),
                'total_calves': float(queryset.aggregate(total=Sum('calf_litres'))['total'] or 0),
            }
        })
