-- =====================================================
-- UPDATE USER ROLE FOR DEVELOPMENT
-- Run this to give your user admin access
-- =====================================================

-- Update all existing users to have admin role
UPDATE public.user_profiles 
SET role = 'admin'
WHERE role = 'viewer';

-- This will allow you to create journal entries and perform all operations
