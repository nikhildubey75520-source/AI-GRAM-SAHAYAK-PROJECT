import { createContext, useContext, useState } from 'react'

const translations = {
  en: {
    appTitle: 'Gram Sahayak AI',
    backend: 'Backend:',
    checking: 'Checking...',
    connected: 'Connected',
    disconnected: 'Disconnected',
    assistant: 'Ask Gram Sahayak',
    assistantPlaceholder: 'Ask about farming, health, housing, or jobs',
    ask: 'Ask',
    thinking: 'Thinking...',
    relatedSchemes: 'Related schemes:',
    schemes: 'Government Schemes',
    all: 'All',
    loadingSchemes: 'Loading schemes...',
    villages: 'Villages',
    loadingVillages: 'Loading villages...',
    noVillages: 'No villages found.',
    grievance: 'File a Grievance',
    yourName: 'Your Name',
    namePlaceholder: 'e.g. Ravi Kumar',
    category: 'Category',
    describeIssue: 'Describe the issue',
    issuePlaceholder: 'e.g. No water supply for 3 days in our area',
    submitGrievance: 'Submit Grievance',
    submitting: 'Submitting...',
    fillFields: 'Please fill in your name and issue.',
    grievanceSuccess: 'Grievance submitted successfully. Status: pending.',
    submissionFailed: 'Submission failed. Please try again.',
    serverUnavailable: 'Could not reach server.'
  },
  hi: {
    appTitle: 'एआई ग्राम सहायक',
    backend: 'बैकएंड:',
    checking: 'जाँच हो रही है...',
    connected: 'कनेक्टेड',
    disconnected: 'डिस्कनेक्टेड',
    assistant: 'ग्राम सहायक से पूछें',
    assistantPlaceholder: 'खेती, स्वास्थ्य, आवास या रोजगार के बारे में पूछें',
    ask: 'पूछें',
    thinking: 'सोच रहा है...',
    relatedSchemes: 'संबंधित योजनाएं:',
    schemes: 'सरकारी योजनाएं',
    all: 'सभी',
    loadingSchemes: 'योजनाएं लोड हो रही हैं...',
    villages: 'गांव',
    loadingVillages: 'गांव लोड हो रहे हैं...',
    noVillages: 'कोई गांव नहीं मिला।',
    grievance: 'शिकायत दर्ज करें',
    yourName: 'आपका नाम',
    namePlaceholder: 'उदाहरण: रवि कुमार',
    category: 'श्रेणी',
    describeIssue: 'समस्या का वर्णन करें',
    issuePlaceholder: 'उदाहरण: हमारे क्षेत्र में 3 दिनों से पानी की आपूर्ति नहीं है',
    submitGrievance: 'शिकायत जमा करें',
    submitting: 'जमा हो रहा है...',
    fillFields: 'कृपया अपना नाम और समस्या भरें।',
    grievanceSuccess: 'शिकायत सफलतापूर्वक दर्ज हुई। स्थिति: लंबित।',
    submissionFailed: 'जमा करना विफल रहा। कृपया फिर कोशिश करें।',
    serverUnavailable: 'सर्वर से संपर्क नहीं हो सका।'
  }
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en')
  const t = (key) => translations[lang][key] || translations.en[key] || key

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}