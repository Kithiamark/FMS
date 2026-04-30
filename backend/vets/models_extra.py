from django.db import models
from django.conf import settings
from animals.models import Animal

class SharedNote(models.Model):
    animal = models.ForeignKey(Animal, on_delete=models.CASCADE, related_name='shared_notes')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Note by {self.author.full_name} on {self.animal.name}"
