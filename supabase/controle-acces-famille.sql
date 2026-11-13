-- Lecture uniquement. À exécuter dans le SQL Editor administrateur de Supabase.
select fm.display_name, fm.email,
       (u.id is not null) as compte_auth_deja_cree,
       u.email_confirmed_at, u.last_sign_in_at
from public.family_members fm
left join auth.users u on lower(u.email) = lower(fm.email)
order by fm.display_name;
-- L'absence de compte auth est normale avant la première connexion.
-- Cette requête ne vérifie ni SMTP ni les URL de redirection.
