-- 手机号查邮箱 + user_profile 扩展

-- 1. user_profile 添加 phone 字段
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. 手机号查邮箱函数 (SECURITY DEFINER 绕过 RLS)
CREATE OR REPLACE FUNCTION lookup_email_by_phone(search_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  found_email TEXT;
BEGIN
  SELECT u.email INTO found_email
  FROM auth.users u
  JOIN public.user_profile p ON u.id = p.user_id
  WHERE p.phone = search_phone
  LIMIT 1;

  RETURN found_email;
END;
$$;

GRANT EXECUTE ON FUNCTION lookup_email_by_phone(TEXT) TO anon, authenticated;
