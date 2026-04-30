import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fms_core.settings')

app = Celery('fms_core')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'check-vaccination-alerts-daily': {
        'task': 'alerts.tasks.check_vaccination_alerts',
        'schedule': crontab(hour=7, minute=0), # 7am EAT
    },
    'check-milk-yield-drop-daily': {
        'task': 'alerts.tasks.check_milk_yield_drop',
        'schedule': crontab(hour=9, minute=0), # 9am EAT
    },
    'check-subscription-expiry-daily': {
        'task': 'alerts.tasks.check_subscription_expiry',
        'schedule': crontab(hour=8, minute=0), # 8am EAT
    },
    'send-weekly-farm-summary': {
        'task': 'alerts.tasks.send_weekly_farm_summary',
        'schedule': crontab(day_of_week='monday', hour=6, minute=0), # Mon 6am EAT
    },
}
