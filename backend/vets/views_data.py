from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import serializers
from django.db.models import Count, Q
from django.utils import timezone
from .models import VetFarmConnection, VetVisit, VetProfile
from .permissions import IsVet, VetFarmAccessMixin
from .models_extra import SharedNote
from animals.models import Animal, HealthRecord, VaccinationRecord
from dairy.models import MilkRecord
from farms.models import Farm
from alerts.models import Alert
from chat_module.models import Message
from core.views import BaseViewSet
from django.shortcuts import get_object_or_404

# Serializers (Define locally or move to serializers.py if large)
class VetDashboardSerializer(serializers.Serializer):
    active_farms = serializers.IntegerField()
    pending_connections = serializers.IntegerField()
    animals_at_risk = serializers.ListField()
    upcoming_visits = serializers.ListField()
    unread_messages = serializers.IntegerField()
    recent_health_records = serializers.ListField()

class SharedNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    class Meta:
        model = SharedNote
        fields = '__all__'
        read_only_fields = ['author', 'created_at']

class VetDataViewSet(VetFarmAccessMixin, BaseViewSet):
    permission_classes = [IsVet]
    queryset = Animal.objects.all() # Needed for detail routes to find objects initially
    serializer_class = serializers.Serializer # Dummy

    @action(detail=False, methods=['get'], url_path='dashboard')
    def dashboard(self, request):
        vet = request.user.vet_profile
        
        # Stats
        active_farms_count = VetFarmConnection.objects.filter(vet=vet, status=VetFarmConnection.Status.ACTIVE).count()
        pending_connections = VetFarmConnection.objects.filter(vet=vet, status=VetFarmConnection.Status.PENDING).count()
        
        # Upcoming Visits
        start = timezone.now()
        end = start + timezone.timedelta(days=7)
        visits = VetVisit.objects.filter(vet=vet, scheduled_date__range=[start, end], status=VetVisit.Status.SCHEDULED)
        visits_data = [{'farm': v.farm.name, 'date': v.scheduled_date, 'type': v.visit_type} for v in visits]

        # Recent Health Records (created by this vet)
        connected_farms = VetFarmConnection.objects.filter(vet=vet, status=VetFarmConnection.Status.ACTIVE).values_list('farm_id', flat=True)
        recent_health = HealthRecord.objects.filter(animal__farm_id__in=connected_farms).order_by('-date')[:5]
        health_data = [{'animal': h.animal.name, 'diagnosis': h.diagnosis, 'date': h.date} for h in recent_health]
        
        animals_at_risk = [] 
        unread_messages = Message.objects.filter(
            conversation__vet=vet,
            is_read=False,
        ).exclude(sender=request.user).count()

        data = {
            'active_farms': active_farms_count,
            'pending_connections': pending_connections,
            'animals_at_risk': animals_at_risk,
            'upcoming_visits': visits_data,
            'unread_messages': unread_messages,
            'recent_health_records': health_data
        }
        return Response(data)

    @action(detail=False, methods=['get'], url_path='farms')
    def list_farms(self, request):
        vet = request.user.vet_profile
        connections = VetFarmConnection.objects.filter(vet=vet, status=VetFarmConnection.Status.ACTIVE).select_related('farm')
        farms = [c.farm for c in connections]
        data = [{'id': f.id, 'name': f.name, 'owner': f.owner.full_name} for f in farms]
        return Response(data)

    @action(detail=False, methods=['get'], url_path=r'farms/(?P<farm_id>\d+)/animals')
    def list_farm_animals(self, request, farm_id=None):
        farm = get_object_or_404(Farm, pk=farm_id)
        self.check_vet_farm_access(request, farm=farm)
        animals = Animal.objects.filter(farm=farm)
        data = [{'id': a.id, 'name': a.name, 'tag': a.ear_tag, 'status': 'Active' if a.is_active else 'Inactive', 'health': a.health_status} for a in animals]
        return Response(data)
    
    @action(detail=False, methods=['get'], url_path=r'farms/(?P<farm_id>\d+)/milk-summary')
    def farm_milk_summary(self, request, farm_id=None):
        farm = get_object_or_404(Farm, pk=farm_id)
        self.check_vet_farm_access(request, farm=farm)
        today = timezone.now().date()
        total_today = 0 
        return Response({'farm': farm.name, 'total_today': total_today, 'status': 'Healthy'})

    @action(detail=True, methods=['get'], url_path='details') # /api/v1/vet/data/{animal_id}/details/
    def animal_details(self, request, pk=None):
        animal = self.get_object() # Uses Mixin to check access
        
        data = {
            'id': animal.id,
            'name': animal.name,
            'tag': animal.ear_tag,
            'breed': animal.breed,
            'dob': animal.date_of_birth,
            'health_status': animal.health_status,
            'weight': animal.weight_kg,
            'farm': animal.farm.name
        }
        return Response(data)

    @action(detail=True, methods=['get', 'post'], url_path='health')
    def animal_health(self, request, pk=None):
        animal = self.get_object()

        if request.method == 'POST':
            data = request.data
            record = HealthRecord.objects.create(
                animal=animal,
                diagnosis=data.get('diagnosis'),
                treatment=data.get('treatment'),
                cost_kes=data.get('cost_kes', 0),
                notes=data.get('notes', ''),
                created_by=request.user,
                vet=request.user,
                date=timezone.now().date()
            )
            
            Alert.objects.create(
                farm=animal.farm,
                animal=animal,
                alert_type=Alert.AlertType.HEALTH_CHECKUP,
                message=f"Follow-up checkup for {animal.name} (Diagnosis: {record.diagnosis})",
                scheduled_at=timezone.now() + timezone.timedelta(days=30),
                channel=Alert.Channel.SMS
            )
            
            return Response({'status': 'created', 'id': record.id}, status=status.HTTP_201_CREATED)
        
        else:
            records = HealthRecord.objects.filter(animal=animal).order_by('-date')
            data = [{'id': r.id, 'diagnosis': r.diagnosis, 'date': r.date, 'treatment': r.treatment} for r in records]
            return Response(data)

    @action(detail=True, methods=['get', 'post'], url_path='vaccinations')
    def animal_vaccinations(self, request, pk=None):
        animal = self.get_object()

        if request.method == 'POST':
            data = request.data
            next_due = data.get('next_due_date')
            record = VaccinationRecord.objects.create(
                animal=animal,
                vaccine_name=data.get('vaccine_name'),
                date_given=data.get('date_administered') or data.get('date_given') or timezone.now().date(),
                next_due_date=next_due,
                given_by=f"Dr. {request.user.full_name}"
            )

            if next_due:
                from datetime import datetime
                due_date = datetime.strptime(next_due, '%Y-%m-%d').date() if isinstance(next_due, str) else next_due
                alert_date = due_date - timezone.timedelta(days=7)
                
                Alert.objects.create(
                    farm=animal.farm,
                    animal=animal,
                    alert_type=Alert.AlertType.VACCINATION_DUE,
                    message=f"Vaccination due for {animal.name} on {next_due}",
                    scheduled_at=timezone.make_aware(datetime.combine(alert_date, datetime.min.time())),
                    channel=Alert.Channel.SMS
                )

            return Response({'status': 'created', 'id': record.id}, status=status.HTTP_201_CREATED)
        
        else:
            records = VaccinationRecord.objects.filter(animal=animal).order_by('-date_given')
            data = [{'id': r.id, 'vaccine': r.vaccine_name, 'date': r.date_given, 'next_due': r.next_due_date} for r in records]
            return Response(data)

    @action(detail=True, methods=['patch'], url_path='health-status')
    def update_health_status(self, request, pk=None):
        animal = self.get_object()
        
        new_status = request.data.get('status')
        if new_status not in [c[0] for c in Animal.HealthStatus.choices]:
             return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        animal.health_status = new_status
        animal.save()
        return Response({'status': 'updated', 'new_status': animal.health_status})

    @action(detail=True, methods=['post'], url_path='notes')
    def add_note(self, request, pk=None):
        animal = self.get_object()
        
        SharedNote.objects.create(
            animal=animal,
            author=request.user,
            content=request.data.get('content'),
            is_pinned=request.data.get('is_pinned', False)
        )
        return Response({'status': 'created'}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='records')
    def all_records(self, request):
        vet = request.user.vet_profile
        connected_farms = VetFarmConnection.objects.filter(vet=vet, status=VetFarmConnection.Status.ACTIVE).values_list('farm_id', flat=True)
        
        health_records = HealthRecord.objects.filter(animal__farm_id__in=connected_farms).select_related('animal', 'animal__farm').order_by('-date')[:50]
        vaccinations = VaccinationRecord.objects.filter(animal__farm_id__in=connected_farms).select_related('animal', 'animal__farm').order_by('-date_given')[:50]
        
        data = {
            'health': [{'id': r.id, 'animal': r.animal.name, 'farm': r.animal.farm.name, 'diagnosis': r.diagnosis, 'date': r.date, 'treatment': r.treatment} for r in health_records],
            'vaccinations': [{'id': r.id, 'animal': r.animal.name, 'farm': r.animal.farm.name, 'vaccine': r.vaccine_name, 'date': r.date_given, 'next_due': r.next_due_date} for r in vaccinations]
        }
        return Response(data)

    @action(detail=False, methods=['get'], url_path='visits')
    def all_visits(self, request):
        vet = request.user.vet_profile
        visits = VetVisit.objects.filter(vet=vet).select_related('farm').order_by('-scheduled_date')
        
        data = [{'id': v.id, 'farm': v.farm.name, 'date': v.scheduled_date, 'type': v.visit_type, 'status': v.status, 'notes': v.notes} for v in visits]
        return Response(data)

    @action(detail=False, methods=['get', 'post'], url_path='connections')
    def manage_connections(self, request):
        vet = request.user.vet_profile
        if request.method == 'POST':
            conn_id = request.data.get('id')
            action = request.data.get('action')
            conn = get_object_or_404(VetFarmConnection, id=conn_id, vet=vet)
            if action == 'accept':
                conn.status = VetFarmConnection.Status.ACTIVE
                conn.save()
            elif action == 'reject':
                conn.status = VetFarmConnection.Status.REJECTED
                conn.save()
            return Response({'status': 'updated'})
            
        connections = VetFarmConnection.objects.filter(vet=vet).select_related('farm').order_by('-created_at')
        data = [{'id': c.id, 'farm': c.farm.name, 'owner': c.farm.owner.full_name, 'status': c.status, 'date': c.created_at} for c in connections]
        return Response(data)
