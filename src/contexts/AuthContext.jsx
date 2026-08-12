import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId, userEmail = '') => {
    if (!userId) {
      setProfile(null)
      return null
    }
    try {
      const { data } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      const profileData = data || {
        id: userId,
        name: userEmail ? userEmail.split('@')[0] : 'Usuário',
        onboarding_completed: true,
      }

      setProfile(profileData)
      return profileData
    } catch (err) {
      console.error('fetchProfile error:', err)
      const fallback = { id: userId, name: 'Usuário', onboarding_completed: true }
      setProfile(fallback)
      return fallback
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Initialize session instantly from Supabase local storage
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          const currentUser = session?.user ?? null
          setUser(currentUser)
          setLoading(false) // Unblock UI immediately!
          if (currentUser) {
            fetchProfile(currentUser.id, currentUser.email)
          }
        }
      } catch (err) {
        console.error('Init auth error:', err)
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      const currentUser = session?.user ?? null
      setUser(currentUser)
      setLoading(false)
      if (currentUser) {
        fetchProfile(currentUser.id, currentUser.email)
      } else {
        setProfile(null)
      }
    })

    // Safety fallback: maximum 5s loading screen
    const timer = setTimeout(() => {
      if (mounted && loading) setLoading(false)
    }, 5000)

    return () => {
      mounted = false
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  const uploadAvatar = async (userId, file) => {
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`
      const { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
      if (error) { console.error('Avatar upload error:', error); return null }
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
      return publicUrl
    } catch (err) {
      console.error('Avatar error:', err)
      return null
    }
  }

  const signUp = async ({ email, password, name, avatarFile }) => {
    try {
      // Step 1: Create account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (signUpError) {
        let msg = signUpError.message
        if (msg.includes('User already registered')) msg = 'Este e-mail já está cadastrado. Tente fazer login.'
        if (msg.includes('Password should be')) msg = 'A senha deve ter pelo menos 6 caracteres.'
        return { data: null, error: { message: msg } }
      }

      // Step 2: Sign in immediately
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) return { data: null, error: signInError }

      const activeUser = signInData.user
      if (!activeUser) return { data: null, error: new Error('Falha ao autenticar após cadastro') }

      // Step 3: Upload avatar if provided
      let avatarUrl = null
      if (avatarFile) {
        avatarUrl = await uploadAvatar(activeUser.id, avatarFile)
      }

      // Step 4: Upsert profile in database
      await supabase.from('perfis').upsert({
        id: activeUser.id,
        name: name || email.split('@')[0],
        avatar_url: avatarUrl,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })

      setUser(activeUser)
      await fetchProfile(activeUser.id, activeUser.email)

      return { data: signInData, error: null }
    } catch (err) {
      console.error('signUp error:', err)
      return { data: null, error: { message: 'Erro ao criar conta. Tente novamente.' } }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        let msg = error.message
        if (msg === 'Invalid login credentials') msg = 'E-mail ou senha incorretos.'
        if (msg.includes('Email not confirmed')) msg = 'E-mail não confirmado. Verifique sua caixa de entrada.'
        if (msg.includes('Failed to fetch')) msg = 'Sem conexão com a internet. Verifique sua rede.'
        return { data: null, error: { message: msg } }
      }
      if (data?.user) {
        setUser(data.user)
        fetchProfile(data.user.id, data.user.email)
      }
      return { data, error: null }
    } catch (err) {
      return { data: null, error: { message: 'Erro ao entrar. Tente novamente.' } }
    }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
    return { data, error }
  }

  const updateProfile = async ({ name, avatarFile }) => {
    if (!user) return { error: 'Não autenticado' }
    let avatarUrl = profile?.avatar_url
    if (avatarFile) {
      const newUrl = await uploadAvatar(user.id, avatarFile)
      if (newUrl) avatarUrl = newUrl
    }
    const { data, error } = await supabase
      .from('perfis')
      .update({ name: name || profile?.name, avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()
    if (!error && data) setProfile(data)
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const completeOnboarding = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('perfis')
      .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()
    if (!error && data) setProfile(data)
    return { data, error }
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signUp, signIn, signInWithGoogle, updateProfile, signOut, completeOnboarding,
      refreshProfile: () => user && fetchProfile(user.id, user.email)
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
