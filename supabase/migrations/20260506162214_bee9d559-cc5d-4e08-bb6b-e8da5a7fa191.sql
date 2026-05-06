INSERT INTO public.organization_members (user_id, organization_id, role)
VALUES ('cff3dbd6-baab-407b-b384-0fe574310e27', '1f7a578f-77f6-46d2-af74-be65d5331b14', 'owner')
ON CONFLICT DO NOTHING;