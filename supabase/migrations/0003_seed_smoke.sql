-- =============================================================================
-- Smoke-test seed: inserts one real graduate (Musa Mohsin) to verify the
-- end-to-end path from React → Supabase → Postgres → RLS → back to React.
-- Safe to run multiple times (upsert on slug).
-- =============================================================================

insert into graduates (
  slug, country, university, graduation_year, graduation_month,
  duration_years, gpa, focus_areas, story,
  teaching_location, target_hours_monthly, status
) values (
  'musa-mohsin',
  'Tanzania',
  'Islamic University of Madinah',
  2025, 7,
  5.5, 4.80,
  array[
    'Tajweed lessons for children',
    'Tawheed and Fiqh for adults',
    'Friday khutbahs at local masjid',
    'Community lectures in surrounding villages'
  ],
  'After graduating, I returned home eager to teach. But I had to work to provide for my family. Dawah became weekends only. When this sponsorship came, everything changed. Now I teach from Fajr to Isha. May Allah reward those who made this possible.',
  'Dar es Salaam, Tanzania',
  132,
  'active'
)
on conflict (slug) do update set
  country            = excluded.country,
  graduation_year    = excluded.graduation_year,
  graduation_month   = excluded.graduation_month,
  duration_years     = excluded.duration_years,
  gpa                = excluded.gpa,
  focus_areas        = excluded.focus_areas,
  story              = excluded.story,
  teaching_location  = excluded.teaching_location,
  status             = excluded.status;
