-- First, let's create a function to properly set up the super admin after auth user creation
CREATE OR REPLACE FUNCTION public.setup_super_admin_after_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if this is the super admin email
    IF NEW.email = 'sujan1nepal@gmail.com' THEN
        -- Check if user record already exists
        UPDATE users 
        SET auth_user_id = NEW.id,
            role = 'super_admin',
            status = 'active'
        WHERE email = 'sujan1nepal@gmail.com';
        
        -- If no existing record was updated, create a new one
        IF NOT FOUND THEN
            INSERT INTO users (
                auth_user_id,
                tenant_id,
                email,
                first_name,
                last_name,
                role,
                status
            ) VALUES (
                NEW.id,
                '00000000-0000-0000-0000-000000000000',
                'sujan1nepal@gmail.com',
                'Sujan',
                'Nepal',
                'super_admin',
                'active'
            );
        END IF;
        
        -- Grant super admin permissions
        INSERT INTO user_permissions (user_id, permission, granted_by) 
        SELECT 
            (SELECT id FROM users WHERE auth_user_id = NEW.id),
            unnest(ARRAY[
                'super_admin_access',
                'create_schools',
                'manage_schools',
                'create_admins',
                'manage_users',
                'view_all_data',
                'system_settings',
                'billing_management',
                'tenant_management'
            ]),
            (SELECT id FROM users WHERE auth_user_id = NEW.id)
        ON CONFLICT (user_id, permission) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to auto-setup super admin on signup
DROP TRIGGER IF EXISTS on_auth_user_created_super_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_super_admin
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.setup_super_admin_after_signup();

-- Clean up existing user record first
DELETE FROM users WHERE email = 'sujan1nepal@gmail.com';

-- Now you need to manually sign up with sujan1nepal@gmail.com/precioussn through the UI
-- The trigger will automatically set up the super admin account