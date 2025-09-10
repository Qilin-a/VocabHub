import { createClient } from '@supabase/supabase-js'

// Supabase 项目配置 - 从环境变量读取
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 管理员认证
export const signInAdmin = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

// 检查是否为管理员
export const isAdmin = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email === '3679044152@qq.com'
}

// 退出登录
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// 获取当前用户
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
