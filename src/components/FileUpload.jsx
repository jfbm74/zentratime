import { useState, useRef } from 'react'
import { excelParser } from '../utils/excelParser'
import useBiometricStore from '../store/biometricStore'

const FileUpload = () => {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)
  
  const { 
    uploadedFile, 
    setUploadedFile, 
    setProcessing, 
    processExcelData 
  } = useBiometricStore()

  const handleClearData = () => {
    localStorage.removeItem('biometric_data')
    alert('Datos limpiados. Recarga la página.')
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const excelFile = files.find(file => 
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    )
    
    if (excelFile) {
      setUploadedFile(excelFile)
    }
  }

  const handleFileSelect = (e) => {
    console.log('File selected from input')
    const file = e.target.files[0]
    if (file) {
      console.log('File details:', file.name, file.size, file.type)
      setUploadedFile(file)
    }
  }

  const handleProcessFile = async () => {
    console.log('=== STARTING FILE PROCESSING ===')
    
    if (!uploadedFile) {
      console.error('No uploaded file found')
      return
    }
    
    console.log('File to process:', uploadedFile.name, uploadedFile.size, 'bytes')
    setProcessing(true)
    
    try {
      console.log('Step 1: Reading Excel file...')
      const data = await excelParser.readExcelFile(uploadedFile)
      console.log('Step 2: Excel data read successfully:', data?.length, 'rows')
      console.log('First few rows sample:', data?.slice(0, 2))
      
      // Process data with slight delay for UI
      setTimeout(() => {
        try {
          console.log('Step 3: Processing Excel data...')
          processExcelData(data)
          console.log('Step 4: Excel data processed successfully')
          setProcessing(false)
        } catch (error) {
          console.error('ERROR in Step 3/4 - Processing:', error)
          alert('Error processing Excel data: ' + error.message)
          setProcessing(false)
        }
      }, 500)
      
    } catch (error) {
      console.error('ERROR in Step 1/2 - Reading file:', error)
      alert('Error reading file: ' + error.message)
      setProcessing(false)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }


  return (
    <div className="card p-6 mb-5">
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {!uploadedFile ? (
          <div 
            className={`flex-1 border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
              dragOver 
                ? 'border-primary-500 bg-primary-50 scale-105' 
                : 'border-gray-300 bg-gray-50 hover:border-primary-500 hover:bg-primary-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="mb-4">
              <svg 
                className="w-12 h-12 text-primary-500 mx-auto" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cargar archivo biométrico
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Arrastra y suelta el archivo .xls/.xlsx aquí o haz clic para seleccionar
            </p>
            <button className="btn btn-primary">
              Seleccionar archivo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex-1 bg-gray-50 rounded-lg p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{uploadedFile.name}</h4>
                <p className="text-sm text-gray-600">
                  {(uploadedFile.size / 1024).toFixed(1)} KB • Archivo Excel
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  console.log('Process button clicked!')
                  handleProcessFile()
                }}
                className="btn btn-success"
              >
                <span>⚡</span>
                Procesar datos
              </button>
              <button 
                onClick={handleRemoveFile}
                className="btn btn-danger"
              >
                <span>✕</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="text-lg">📅</span>
          <span>Último archivo cargado: <strong>Nunca</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">✓</span>
          <span>Estado: <strong className="text-gray-500">Sin datos</strong></span>
        </div>
        <button 
          onClick={handleClearData}
          className="text-red-600 hover:text-red-800 text-xs underline"
        >
          Limpiar datos guardados
        </button>
      </div>
    </div>
  )
}

export default FileUpload