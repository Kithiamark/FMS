import africastalking
from django.conf import settings
from .models import SmsLog

# Initialize SDK
africastalking.initialize(settings.AFRICASTALKING_USERNAME, settings.AFRICASTALKING_API_KEY)
sms = africastalking.SMS

def send_sms(phone_number, message):
    try:
        # Africa's Talking expects list of recipients
        recipients = [phone_number]
        # In sandbox, use test numbers or verify your own
        response = sms.send(message, recipients)
        
        status = 'Failed'
        cost = 0
        
        if response['SMSMessageData']['Recipients']:
            recipient_data = response['SMSMessageData']['Recipients'][0]
            status = recipient_data['status']
            # Cost string format "KES 0.8000"
            cost_str = recipient_data.get('cost', 'KES 0.00')
            try:
                cost = float(cost_str.split(' ')[1])
            except:
                pass

        SmsLog.objects.create(
            phone_number=phone_number,
            message=message,
            status=status,
            cost_kes=cost
        )
        return status == 'Success' or status == 'Sent'
    except Exception as e:
        print(f"SMS Error: {e}")
        SmsLog.objects.create(
            phone_number=phone_number,
            message=message,
            status=f"Error: {str(e)}",
            cost_kes=0
        )
        return False
