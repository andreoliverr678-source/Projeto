/**
 * Utility for automatic recognition of Brazilian brands, banks, cards, utilities and services.
 * Standardized category emojis only — no individual bank logos or badges.
 */

export const BRAND_MAP = [

  // 💡 Energia Elétrica — qualquer companhia
  {
    keywords: ['light', 'enel', 'cemig', 'copel', 'energia', 'luz', 'eletricidade', 'eletrobras',
      'coelba', 'celpe', 'energisa', 'ampla', 'elektro', 'cosern', 'celesc', 'cemar',
      'celg', 'ceron', 'boa energia'],
    name: 'Energia Elétrica',
    bg: '#EAB308',
    color: '#111827',
    short: 'Luz',
    icon: '💡',
  },

  // 💧 Água & Saneamento — qualquer companhia
  {
    keywords: ['sabesp', 'cedae', 'agua', 'água', 'saneamento', 'saneago', 'compesa',
      'cagece', 'caern', 'embasa', 'copasa', 'aguas', 'águas', 'sanepar'],
    name: 'Água / Saneamento',
    bg: '#0284C7',
    color: '#FFFFFF',
    short: 'Água',
    icon: '💧',
  },

  // 🔥 Gás — qualquer companhia
  {
    keywords: ['comgas', 'comgás', 'naturgy', 'gas', 'gás', 'botijao', 'botijão', 'glp'],
    name: 'Gás',
    bg: '#EA580C',
    color: '#FFFFFF',
    short: 'Gás',
    icon: '🔥',
  },

  // 📡 Internet & WiFi — qualquer provedor
  {
    keywords: ['internet', 'wifi', 'wi-fi', 'fibra', 'modem', 'banda larga', 'rede',
      'vivo fibra', 'net claro', 'oi fibra', 'algar', 'brisanet', 'desktop'],
    name: 'Internet',
    bg: '#2563EB',
    color: '#FFFFFF',
    short: 'Net',
    icon: '📡',
  },

  // 📱 Telefone / Celular — qualquer operadora
  {
    keywords: ['claro', 'vivo', 'tim', 'oi ', 'celular', 'telefone', 'telefonia',
      'plano celular', 'chip', 'nextel'],
    name: 'Telefone / Celular',
    bg: '#7C3AED',
    color: '#FFFFFF',
    short: 'Tel',
    icon: '📱',
  },

  // 💳 Cartão de Crédito — qualquer banco/cartão (padrão)
  {
    keywords: ['nubank', 'nu bank', 'roxinho', 'itau', 'itaú', 'itaucard', 'credicard',
      'bradesco', 'bradescard', 'next', 'santander', 'caixa', 'cef', 'caixa economica',
      'banco do brasil', 'ourocard', 'inter', 'banco inter', 'c6', 'c6bank', 'c6 bank',
      'picpay', 'pic pay', 'mercado pago', 'mercadopago', 'mercado livre',
      'pagbank', 'pagseguro', 'pag seguro', 'will bank', 'willbank', 'neon',
      'cartao', 'cartão', 'visa', 'mastercard', 'elo', 'amex', 'american express', 'hipercard', 'credito', 'crédito'],
    name: 'Cartão de Crédito',
    bg: '#1E3A5F',
    color: '#FFFFFF',
    short: '💳',
    icon: '💳',
  },

  // 🏦 Empréstimo / Banco
  {
    keywords: ['emprestimo', 'empréstimo', 'banco', 'cdc', 'consignado', 'financeira', 'portocred', 'losango', 'avista', 'facta'],
    name: 'Empréstimo',
    bg: '#1D4ED8',
    color: '#FFFFFF',
    short: '🏦',
    icon: '🏦',
  },

  // 🚗 Financiamento — veículo, imóvel, moto
  {
    keywords: ['financiamento', 'moto', 'veiculo', 'veículo', 'carro', 'automovel', 'automóvel',
      'imovel', 'imóvel', 'casa propria', 'casa própria', 'cnh', 'chassis',
      'renault', 'volkswagen', 'ford', 'fiat', 'chevrolet', 'honda', 'yamaha'],
    name: 'Financiamento',
    bg: '#4338CA',
    color: '#FFFFFF',
    short: '🚗',
    icon: '🚗',
  },

  // 🏋️ Academia / Gym
  {
    keywords: ['academia', 'gym', 'smartfit', 'smart fit', 'bluefit', 'fitness', 'crossfit',
      'treino', 'musculacao', 'musculação', 'bodytech', 'bio ritmo', 'companhia athlética'],
    name: 'Academia',
    bg: '#E11D48',
    color: '#FFFFFF',
    short: 'Gym',
    icon: '🏋️',
  },

  // 🎬 Streaming & Assinaturas
  {
    keywords: ['netflix', 'spotify', 'amazon', 'prime', 'disney', 'hbo', 'max', 'paramount',
      'apple tv', 'deezer', 'youtube premium', 'globoplay', 'telecine', 'funimation',
      'crunchyroll', 'streaming', 'assinatura'],
    name: 'Streaming',
    bg: '#DC2626',
    color: '#FFFFFF',
    short: '🎬',
    icon: '🎬',
  },

  // 🏠 Moradia — aluguel, condomínio, IPTU
  {
    keywords: ['aluguel', 'condominio', 'condomínio', 'moradia', 'iptu', 'seguro residencial',
      'seguro casa', 'administradora', 'imobiliaria', 'imobiliária'],
    name: 'Moradia',
    bg: '#4F46E5',
    color: '#FFFFFF',
    short: 'Casa',
    icon: '🏠',
  },

  // 📚 Educação — escola, faculdade, curso
  {
    keywords: ['escola', 'faculdade', 'universidade', 'colegio', 'colégio', 'curso',
      'mensalidade', 'educacao', 'educação', 'senac', 'senai', 'etec', 'fatec',
      'anhanguera', 'estacio', 'estácio', 'kroton'],
    name: 'Educação',
    bg: '#0369A1',
    color: '#FFFFFF',
    short: 'Edu',
    icon: '📚',
  },

  // 🏥 Saúde — plano de saúde, farmácia
  {
    keywords: ['saude', 'saúde', 'plano de saude', 'plano de saúde', 'unimed', 'amil',
      'bradesco saude', 'sulamerica', 'hapvida', 'notredame', 'farmacia', 'farmácia',
      'drogaria', 'hospital', 'clinica', 'clínica', 'odontologia', 'dentista'],
    name: 'Saúde',
    bg: '#16A34A',
    color: '#FFFFFF',
    short: 'Saúde',
    icon: '🏥',
  },

]

/**
 * Recognizes brand/category details from creditor name or debt type
 */
export function getBrandInfo(creditorName = '', debtType = '') {
  const cleanName = creditorName.toLowerCase().trim()

  for (const brand of BRAND_MAP) {
    for (const kw of brand.keywords) {
      if (cleanName === kw) return brand
      if (kw.length <= 5) {
        const regex = new RegExp(`(?:^|\\s)${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|\\s)`, 'i')
        if (regex.test(cleanName)) return brand
      } else {
        if (cleanName.includes(kw)) return brand
      }
    }
  }

  // Fallback by debtType
  if (debtType === 'cartao')       return { name: creditorName, bg: '#1E3A5F', color: '#FFFFFF', short: '💳', icon: '💳' }
  if (debtType === 'emprestimo')   return { name: creditorName, bg: '#1D4ED8', color: '#FFFFFF', short: '🏦', icon: '🏦' }
  if (debtType === 'financiamento') return { name: creditorName, bg: '#4338CA', color: '#FFFFFF', short: '🚗', icon: '🚗' }

  return { name: creditorName, bg: '#374151', color: '#FFFFFF', short: creditorName.charAt(0).toUpperCase() || '📋', icon: '📋' }
}

/**
 * Returns themed background styling & watermark icon per debtType
 */
export function getCardTheme(debtType = '') {
  switch (debtType) {
    case 'cartao':
      return {
        bg: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
        border: '1px solid rgba(30, 58, 95, 0.15)',
        watermark: '💳',
        chip: false,
        label: 'Cartão de Crédito'
      }
    case 'emprestimo':
      return {
        bg: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
        border: '1px solid rgba(29, 78, 216, 0.15)',
        watermark: '🏦',
        chip: false,
        label: 'Empréstimo'
      }
    case 'financiamento':
      return {
        bg: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)',
        border: '1px solid rgba(67, 56, 202, 0.15)',
        watermark: '🚗',
        chip: false,
        label: 'Financiamento'
      }
    case 'cheque_especial':
      return {
        bg: 'linear-gradient(135deg, #ffffff 0%, #fffbe6 100%)',
        border: '1px solid rgba(217, 119, 6, 0.15)',
        watermark: '📑',
        chip: false,
        label: 'Cheque Especial'
      }
    default:
      return {
        bg: '#ffffff',
        border: '1px solid #e5e7eb',
        watermark: '📋',
        chip: false,
        label: 'Conta / Dívida'
      }
  }
}
