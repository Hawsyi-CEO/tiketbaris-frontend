UPDATE users SET organizer_name = username WHERE role = 'panitia' AND organizer_name IS NULL;
