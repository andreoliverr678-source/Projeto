import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId, userEmail = '') => {
    if (!userId) { setProfile(null); return null }
    try {
      const { data } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
      if (data) {
        setProfile(data)
        return data
      } else {
        const fallback = {
          id: userId,
          name: userEmail ? userEmail.split('@')[0] : 'Usuário',
          onboarding_completed: true
        }
        setProfile(fallback)
        return fallback
      }
    } catch (err) {
      console.error('fetchProfile error:', err)
      const fallback = { id: userId, onboarding_completed: true }
      setProfile(fallback)
      return fallback
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Safety fallback: Never stay stuck in loading state for more than 2.5 seconds
    const timer = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 2500)

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user ?? null
        if (mounted) setUser(currentUser)
        if (currentUser) {
          await fetchProfile(currentUser.id, currentUser.email)
        } else {
          if (mounted) setProfile(null)
        }
      } catch (err) {
        console.error('Init auth error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      if (mounted) setUser(currentUser)
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser.email)
      } else {
        if (mounted) setProfile(null)
      }
      if (mounted) setLoading(false)
    })

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
      if (signUpError) return { data: null, error: signUpError }

      // Step 2: Sign in immediately to get authenticated session
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) return { data: null, error: signInError }

      const activeUser = signInData.user
      if (!activeUser) return { data: null, error: new Error('Falha ao autenticar após cadastro') }

      // Step 3: Upload avatar if provided (now we have auth session)
      let avatarUrl = null
      if (avatarFile) {
        avatarUrl = await uploadAvatar(activeUser.id, avatarFile)
      }

      // Step 4: Upsert profile in database
      await supabase.from('perfis').upsert({
        id: activeUser.id,
        name: name || email.split('@')[0],
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })

      // Step 5: Load profile into state
      await fetchProfile(activeUser.id)

      return { data: signInData, error: null }
    } catch (err) {
      console.error('signUp error:', err)
      return { data: null, error: err }
    }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (data?.user) await fetchProfile(data.user.id)
    return { data, error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/home` }
    })
    return { data, error }
  }

  const updateProfile = async ({ name, avatarFile }) => {
    if (!user) return { error: 'Not logged in' }
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
      refreshProfile: () => user && fetchProfile(user.id)
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
