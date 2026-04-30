import pytest
import factory
from factory.django import DjangoModelFactory
from accounts.models import User
from farms.models import Farm
from animals.models import Animal
from dairy.models import MilkRecord

class UserFactory(DjangoModelFactory):
    class Meta:
        model = User
    
    email = factory.Sequence(lambda n: f'user{n}@example.com')
    full_name = factory.Faker('name')
    phone_number = factory.Sequence(lambda n: f'+254700000{n:03d}')
    password = factory.PostGenerationMethodCall('set_password', 'password123')

class FarmFactory(DjangoModelFactory):
    class Meta:
        model = Farm
    
    name = factory.Faker('company')
    owner = factory.SubFactory(UserFactory)

class AnimalFactory(DjangoModelFactory):
    class Meta:
        model = Animal
    
    farm = factory.SubFactory(FarmFactory)
    name = factory.Faker('first_name')
    ear_tag = factory.Sequence(lambda n: f'TAG-{n}')
    breed = 'Friesian'
    date_of_birth = factory.Faker('date_between', start_date='-5y', end_date='-1y')
    weight_kg = 450.0  # Added default weight to fix NOT NULL constraint error

class MilkRecordFactory(DjangoModelFactory):
    class Meta:
        model = MilkRecord
    
    animal = factory.SubFactory(AnimalFactory)
    date = factory.Faker('date_this_year')
    morning_yield = 10.0
    evening_yield = 8.0
    recorded_by = factory.SubFactory(UserFactory)
