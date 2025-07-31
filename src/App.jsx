import { useState, useEffect } from 'react'
import Header from './components/Header'
import FileUpload from './components/FileUpload'
import EmployeeSidebar from './components/EmployeeSidebar'
import MainContent from './components/MainContent'
import Footer from './components/Footer'
import useBiometricStore from './store/biometricStore'

function App() {
  const { employees, isProcessing, loadFromStorage } = useBiometricStore()
  
  console.log('=== APP COMPONENT RENDERED ===')
  console.log('App render - employees:', employees.length, 'isProcessing:', isProcessing)
  console.log('Current time:', new Date().toISOString())

  // Load data from localStorage on app start
  useEffect(() => {
    const loaded = loadFromStorage()
    if (loaded) {
      console.log('Loaded data from localStorage')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto p-5">
          <FileUpload />
          
          {employees.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mt-5">
              <EmployeeSidebar />
              <div className="lg:col-span-3">
                <MainContent />
              </div>
            </div>
          )}
          
          {isProcessing && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-8 text-center min-w-[400px]">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Procesando archivo...
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Analizando registros biométricos
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div className="bg-emerald-500 h-2 rounded-full w-3/4 transition-all duration-300"></div>
                </div>
                <p className="text-emerald-500 text-sm font-medium">75% completado</p>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default App