-- Create custom types for the school management system
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'principal', 'teacher', 'student', 'parent', 'vendor');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE school_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE plan_tier AS ENUM ('basic', 'premium', 'enterprise');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE assignment_status AS ENUM ('draft', 'published', 'closed');
CREATE TYPE submission_status AS ENUM ('not_submitted', 'submitted', 'graded', 'returned');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE message_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- Create tenants table for multi-tenancy
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    subdomain VARCHAR NOT NULL UNIQUE,
    plan_tier plan_tier DEFAULT 'basic',
    max_schools INTEGER DEFAULT 1,
    max_users INTEGER DEFAULT 100,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create schools table
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    website VARCHAR,
    logo_url VARCHAR,
    school_type VARCHAR DEFAULT 'public',
    grade_range VARCHAR DEFAULT 'K-12',
    established_date DATE,
    principal_id UUID,
    current_enrollment INTEGER DEFAULT 0,
    student_capacity INTEGER,
    accreditation VARCHAR,
    status school_status DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    school_id UUID REFERENCES schools(id),
    email VARCHAR NOT NULL UNIQUE,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    phone VARCHAR,
    address TEXT,
    date_of_birth DATE,
    gender VARCHAR,
    profile_image_url VARCHAR,
    role user_role NOT NULL,
    status user_status DEFAULT 'active',
    last_login TIMESTAMPTZ,
    emergency_contact JSONB,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user permissions table
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    permission VARCHAR NOT NULL,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, permission)
);

-- Create audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR NOT NULL,
    resource_type VARCHAR NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create academic years table
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    name VARCHAR NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create grade levels table
CREATE TABLE grade_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    grade_number INTEGER NOT NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subjects table
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    name VARCHAR NOT NULL,
    code VARCHAR NOT NULL,
    description TEXT,
    department VARCHAR,
    credits DECIMAL DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create teachers table
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    school_id UUID NOT NULL REFERENCES schools(id),
    employee_id VARCHAR NOT NULL,
    department VARCHAR,
    hire_date DATE,
    contract_type VARCHAR DEFAULT 'full-time',
    salary DECIMAL,
    qualifications JSONB,
    certifications JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    school_id UUID NOT NULL REFERENCES schools(id),
    grade_level_id UUID NOT NULL REFERENCES grade_levels(id),
    student_id VARCHAR NOT NULL,
    admission_date DATE,
    graduation_date DATE,
    gpa DECIMAL DEFAULT 0.00,
    credits_earned DECIMAL DEFAULT 0.0,
    attendance_percentage DECIMAL DEFAULT 100.00,
    medical_info JSONB,
    transportation_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create parents table
CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    school_id UUID NOT NULL REFERENCES schools(id),
    relationship VARCHAR DEFAULT 'parent',
    occupation VARCHAR,
    workplace VARCHAR,
    work_phone VARCHAR,
    is_guardian BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_parents relationship table
CREATE TABLE student_parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    parent_id UUID NOT NULL REFERENCES parents(id),
    relationship VARCHAR NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    can_pickup BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create classes table
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    grade_level_id UUID NOT NULL REFERENCES grade_levels(id),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    name VARCHAR NOT NULL,
    section VARCHAR,
    room_number VARCHAR,
    max_students INTEGER DEFAULT 30,
    current_enrollment INTEGER DEFAULT 0,
    schedule JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create class enrollments table
CREATE TABLE class_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id),
    student_id UUID NOT NULL REFERENCES students(id),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR DEFAULT 'active',
    final_grade VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    date DATE NOT NULL,
    status attendance_status DEFAULT 'present',
    notes TEXT,
    recorded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assignments table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    title VARCHAR NOT NULL,
    description TEXT,
    instructions TEXT,
    assignment_type VARCHAR DEFAULT 'homework',
    due_date TIMESTAMPTZ,
    points_possible DECIMAL DEFAULT 100.00,
    attachments JSONB DEFAULT '[]',
    rubric JSONB,
    status assignment_status DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assignment submissions table
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id),
    student_id UUID NOT NULL REFERENCES students(id),
    submission_text TEXT,
    attachments JSONB DEFAULT '[]',
    submitted_at TIMESTAMPTZ,
    status submission_status DEFAULT 'not_submitted',
    points_earned DECIMAL,
    grade VARCHAR,
    feedback TEXT,
    graded_by UUID REFERENCES teachers(id),
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exams table
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    title VARCHAR NOT NULL,
    description TEXT,
    instructions TEXT,
    exam_type VARCHAR DEFAULT 'written',
    exam_date TIMESTAMPTZ,
    duration_minutes INTEGER,
    total_points DECIMAL DEFAULT 100.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exam results table
CREATE TABLE exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id),
    student_id UUID NOT NULL REFERENCES students(id),
    points_earned DECIMAL,
    percentage DECIMAL,
    grade VARCHAR,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fee categories table
CREATE TABLE fee_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    name VARCHAR NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fee structures table
CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    fee_category_id UUID NOT NULL REFERENCES fee_categories(id),
    grade_level_id UUID REFERENCES grade_levels(id),
    amount DECIMAL NOT NULL,
    due_date DATE,
    late_fee_amount DECIMAL DEFAULT 0.00,
    late_fee_days INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payment transactions table
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    fee_structure_id UUID NOT NULL REFERENCES fee_structures(id),
    amount DECIMAL NOT NULL,
    payment_method VARCHAR,
    transaction_id VARCHAR,
    reference_number VARCHAR,
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    status payment_status DEFAULT 'pending',
    notes TEXT,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create message threads table
CREATE TABLE message_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id),
    subject VARCHAR NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    priority message_priority DEFAULT 'normal',
    is_announcement BOOLEAN DEFAULT FALSE,
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create message participants table
CREATE TABLE message_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES message_threads(id),
    user_id UUID NOT NULL REFERENCES users(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_read_at TIMESTAMPTZ
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES message_threads(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR DEFAULT 'general',
    priority message_priority DEFAULT 'normal',
    action_url VARCHAR,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables that have updated_at column
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON academic_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grade_levels_updated_at BEFORE UPDATE ON grade_levels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_enrollments_updated_at BEFORE UPDATE ON class_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exams_updated_at BEFORE UPDATE ON exams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_results_updated_at BEFORE UPDATE ON exam_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fee_categories_updated_at BEFORE UPDATE ON fee_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fee_structures_updated_at BEFORE UPDATE ON fee_structures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_threads_updated_at BEFORE UPDATE ON message_threads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for super admin access
CREATE POLICY "Super admin can access all tenants" ON tenants FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.auth_user_id = auth.uid() 
        AND users.role = 'super_admin'
    )
);

CREATE POLICY "Super admin can access all schools" ON schools FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.auth_user_id = auth.uid() 
        AND users.role = 'super_admin'
    )
);

CREATE POLICY "Super admin can access all users" ON users FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.auth_user_id = auth.uid() 
        AND u.role = 'super_admin'
    )
);

CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (
    auth.uid() = auth_user_id
);

CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (
    auth_user_id = auth.uid()
);

-- Create function to setup super admin
CREATE OR REPLACE FUNCTION setup_real_super_admin(auth_user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    existing_user_id UUID;
BEGIN
    -- Check if user with this email already exists
    SELECT id INTO existing_user_id FROM users WHERE email = 'sujan1nepal@gmail.com';
    
    IF existing_user_id IS NOT NULL THEN
        -- Update existing user
        UPDATE users SET
            auth_user_id = auth_user_uuid,
            role = 'super_admin',
            status = 'active',
            first_name = 'Sujan',
            last_name = 'Nepal',
            tenant_id = '00000000-0000-0000-0000-000000000000'
        WHERE id = existing_user_id;
        
        RAISE NOTICE 'Updated existing user to super admin with auth_user_id: %', auth_user_uuid;
    ELSE
        -- Create new super admin user
        INSERT INTO users (
            auth_user_id,
            tenant_id,
            email,
            first_name,
            last_name,
            role,
            status
        ) VALUES (
            auth_user_uuid,
            '00000000-0000-0000-0000-000000000000',
            'sujan1nepal@gmail.com',
            'Sujan',
            'Nepal',
            'super_admin',
            'active'
        );
        
        RAISE NOTICE 'Created new super admin user with auth_user_id: %', auth_user_uuid;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to grant super admin permissions
CREATE OR REPLACE FUNCTION grant_super_admin_permissions()
RETURNS VOID AS $$
DECLARE
    super_admin_user_id UUID;
BEGIN
    -- Find the super admin user
    SELECT id INTO super_admin_user_id FROM users 
    WHERE email = 'sujan1nepal@gmail.com' AND role = 'super_admin';
    
    IF super_admin_user_id IS NOT NULL THEN
        -- Delete existing permissions
        DELETE FROM user_permissions WHERE user_id = super_admin_user_id;
        
        -- Grant all super admin permissions
        INSERT INTO user_permissions (user_id, permission, granted_by) 
        SELECT 
            super_admin_user_id,
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
            super_admin_user_id
        ON CONFLICT (user_id, permission) DO NOTHING;
        
        RAISE NOTICE 'Granted all permissions to super admin user: %', super_admin_user_id;
    ELSE
        RAISE NOTICE 'Super admin user not found';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create demo tenant
INSERT INTO tenants (
    id,
    name,
    subdomain,
    plan_tier,
    max_schools,
    max_users
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'SchoolOS Demo',
    'demo',
    'enterprise',
    10,
    1000
) ON CONFLICT (id) DO NOTHING;

-- Create function to create demo schools and users
CREATE OR REPLACE FUNCTION create_demo_schools_and_users()
RETURNS VOID AS $$
BEGIN
    -- Create demo schools
    INSERT INTO schools (
        id,
        tenant_id,
        name,
        address,
        phone,
        email,
        website,
        school_type,
        grade_range,
        status,
        current_enrollment,
        student_capacity
    ) VALUES 
    (
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'Demo Elementary School',
        '123 Education St, Learning City, LC 12345',
        '+1-555-0123',
        'info@demo.school',
        'https://demo.school',
        'public',
        'K-5',
        'active',
        245,
        300
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111',
        'Demo High School',
        '456 Knowledge Ave, Learning City, LC 12345',
        '+1-555-0124',
        'info@demohigh.school',
        'https://demohigh.school',
        'public',
        '9-12',
        'active',
        680,
        800
    ) ON CONFLICT (id) DO NOTHING;

    -- Create demo users with proper UUIDs (these are for demo/fallback purposes only)
    INSERT INTO users (
        id,
        auth_user_id,
        tenant_id,
        school_id,
        email,
        first_name,
        last_name,
        role,
        status
    ) VALUES (
        uuid_generate_v4(),
        '10000000-0000-0000-0000-000000000002',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        'admin@schoolos.com',
        'Demo',
        'Admin',
        'admin',
        'active'
    ) ON CONFLICT (email) DO UPDATE SET
        role = 'admin',
        status = 'active',
        school_id = '22222222-2222-2222-2222-222222222222';

    INSERT INTO users (
        id,
        auth_user_id,
        tenant_id,
        school_id,
        email,
        first_name,
        last_name,
        role,
        status
    ) VALUES (
        uuid_generate_v4(),
        '10000000-0000-0000-0000-000000000003',
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        'teacher@demo.school',
        'Demo',
        'Teacher',
        'teacher',
        'active'
    ) ON CONFLICT (email) DO UPDATE SET
        role = 'teacher',
        status = 'active',
        school_id = '22222222-2222-2222-2222-222222222222';

    RAISE NOTICE 'Demo schools and users created successfully';
END;
$$ LANGUAGE plpgsql;

-- Execute demo data creation
SELECT create_demo_schools_and_users();