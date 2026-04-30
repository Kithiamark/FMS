def get_user_farm(user):
    """Return the farm a request should operate under.

    Head farmers have `user.farm` through the Farm.owner one-to-one relation.
    Enterprise workers use `assigned_farm`. Reverse one-to-one access raises
    when missing, so keep this helper instead of using raw getattr everywhere.
    """
    if not user or not getattr(user, 'is_authenticated', False):
        return None
    try:
        return user.farm
    except Exception:
        return getattr(user, 'assigned_farm', None)
