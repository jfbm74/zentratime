import { create } from 'zustand'
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns'
import { excelParser } from '../utils/excelParser'

const useBiometricStore = create((set, get) => ({
  // File upload state
  uploadedFile: null,
  isProcessing: false,
  
  // Employee data
  employees: [],
  selectedEmployee: null,
  searchQuery: '',
  
  // Records and view state
  records: [],
  currentView: 'weekly', // 'weekly' | 'monthly'
  currentWeek: new Date(),
  
  // Statistics
  stats: {
    totalHours: 0,
    weeklyHours: 0,
    missingRecords: 0,
    anomalies: 0
  },

  // Actions
  setUploadedFile: (file) => set({ uploadedFile: file }),
  
  setProcessing: (isProcessing) => set({ isProcessing }),
  
  setEmployees: (employees) => set({ employees }),
  
  setSelectedEmployee: (employee) => {
    set({ selectedEmployee: employee })
    // Calculate stats for selected employee
    const { records } = get()
    const employeeRecords = records.filter(r => r.employeeId === employee?.id)
    const stats = calculateEmployeeStats(employeeRecords)
    set({ stats })
  },
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setRecords: (records) => set({ records }),
  
  setCurrentView: (view) => set({ currentView: view }),
  
  setCurrentWeek: (week) => set({ currentWeek: week }),
  
  // Process Excel file
  processExcelData: (rawData) => {
    try {
      console.log('Starting Excel data processing with', rawData.length, 'rows')
      
      // Try the new ExcelParser first
      try {
        excelParser.rawData = rawData
        const processedData = excelParser.processData()
        
        set({ 
          employees: processedData.employees,
          records: processedData.records,
          selectedEmployee: processedData.employees[0] || null 
        })
        
        // Select first employee and calculate stats
        if (processedData.employees[0]) {
          const employeeRecords = processedData.records.filter(r => r.employeeId === processedData.employees[0].id)
          const stats = calculateEmployeeStats(employeeRecords)
          set({ stats })
        }
        
        console.log('ExcelParser succeeded')
        return
      } catch (parserError) {
        console.warn('ExcelParser failed, falling back to simple processing:', parserError)
        
        // Fallback to simple processing
        const { employees, records } = parseExcelDataSimple(rawData)
        set({ 
          employees,
          records,
          selectedEmployee: employees[0] || null 
        })
        
        // Select first employee and calculate stats
        if (employees[0]) {
          const employeeRecords = records.filter(r => r.employeeId === employees[0].id)
          const stats = calculateEmployeeStats(employeeRecords)
          set({ stats })
        }
        
        console.log('Fallback processing succeeded')
      }
    } catch (error) {
      console.error('All processing methods failed:', error)
      throw error
    }
  },
  
  // Get filtered employees based on search
  getFilteredEmployees: () => {
    const { employees, searchQuery } = get()
    if (!searchQuery) return employees
    
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  },
  
  // Get employee status
  getEmployeeStatus: (employeeId) => {
    const { records } = get()
    const employeeRecords = records.filter(r => r.employeeId === employeeId)
    const missingCount = employeeRecords.filter(r => !r.state || r.anomaly).length
    
    if (missingCount === 0) return 'ok'
    if (missingCount <= 2) return 'warning'
    return 'error'
  },
  
  // Auto-suggest missing states
  autoSuggestStates: (employeeId) => {
    try {
      const suggestions = excelParser.autoSuggestStates(employeeId)
      
      // Update the store with the new records
      set(state => ({
        records: excelParser.records,
        stats: calculateEmployeeStats(excelParser.records.filter(r => r.employeeId === employeeId))
      }))
      
      return suggestions
    } catch (error) {
      console.error('Error auto-suggesting states:', error)
      return []
    }
  },
  
  // Confirm suggestion
  confirmSuggestion: (recordId, accept = true) => {
    try {
      const result = excelParser.confirmSuggestion(recordId, accept)
      
      if (result) {
        // Update store with new records
        const { selectedEmployee } = get()
        set(state => ({
          records: excelParser.records,
          stats: selectedEmployee ? calculateEmployeeStats(excelParser.records.filter(r => r.employeeId === selectedEmployee.id)) : state.stats
        }))
      }
      
      return result
    } catch (error) {
      console.error('Error confirming suggestion:', error)
      return false
    }
  },
  
  // Confirm all suggestions for an employee
  confirmAllSuggestions: (employeeId, accept = true) => {
    try {
      const count = excelParser.confirmAllSuggestions(employeeId, accept)
      
      if (count > 0) {
        // Update store with new records
        set(state => ({
          records: excelParser.records,
          stats: calculateEmployeeStats(excelParser.records.filter(r => r.employeeId === employeeId))
        }))
      }
      
      return count
    } catch (error) {
      console.error('Error confirming all suggestions:', error)
      return 0
    }
  },
  
  // Load data from localStorage
  loadFromStorage: () => {
    try {
      const data = excelParser.loadFromLocalStorage()
      if (data) {
        set({
          employees: data.employees,
          records: data.records,
          selectedEmployee: data.employees[0] || null
        })
        
        if (data.employees[0]) {
          const stats = calculateEmployeeStats(data.records.filter(r => r.employeeId === data.employees[0].id))
          set({ stats })
        }
      }
      return !!data
    } catch (error) {
      console.error('Error loading from storage:', error)
      return false
    }
  }
}))

// Helper functions
function parseExcelDataSimple(data) {
  console.log('Using simple Excel parsing for', data.length, 'rows')
  const employees = new Map()
  const records = []
  
  data.forEach((row, index) => {
    try {
      const employeeId = String(row['Número'] || '')
      const employeeName = row['Nombre'] || ''
      const dateTimeStr = row['Tiempo']
      const state = row['Estado'] || null
      const device = row['Dispositivos'] || ''
      const recordType = row['Tipo de Registro'] || ''
      
      if (!employeeId || !employeeName || !dateTimeStr) {
        return
      }
      
      // Simple date parsing
      let dateTime
      try {
        const cleanDateStr = String(dateTimeStr)
          .replace(' a. m.', ' AM')
          .replace(' p. m.', ' PM')
        dateTime = new Date(cleanDateStr)
        
        if (isNaN(dateTime.getTime())) {
          return
        }
      } catch (e) {
        return
      }
      
      // Add employee if not exists
      if (!employees.has(employeeId)) {
        employees.set(employeeId, {
          id: employeeId,
          name: employeeName,
          area: 'General',
          shift: 'Diurno (7:00 - 17:00)',
          problems: [],
          status: 'ok'
        })
      }
      
      // Add record
      records.push({
        id: `${employeeId}_${index}`,
        employeeId,
        dateTime,
        state,
        device,
        recordType,
        suggested: false,
        confirmed: false,
        originalState: state,
        hasProblems: !state,
        problems: !state ? ['Sin estado'] : []
      })
    } catch (error) {
      console.warn('Error parsing row', index, ':', error)
    }
  })
  
  console.log('Simple parsing result:', employees.size, 'employees,', records.length, 'records')
  
  return {
    employees: Array.from(employees.values()),
    records
  }
}

function parseExcelData(data) {
  console.log('Parsing Excel data:', data.length, 'rows')
  const employees = new Map()
  const records = []
  
  data.forEach((row, index) => {
    try {
      const employeeId = String(row['Número'])
      const employeeName = row['Nombre']
      const dateTimeStr = row['Tiempo']
      const state = row['Estado'] || null
      const device = row['Dispositivos']
      const recordType = row['Tipo de Registro']
      
      if (!employeeId || !employeeName || !dateTimeStr) {
        console.log('Skipping row', index, 'missing required fields')
        return
      }
      
      // Parse date - handle Excel date format
      let dateTime
      try {
        // Try parsing as Excel date string
        dateTime = new Date(dateTimeStr)
        
        // If invalid date, try other formats
        if (isNaN(dateTime.getTime())) {
          // Handle Spanish date format like "1/07/2025 7:08:11 a. m."
          const cleanDateStr = dateTimeStr
            .replace(' a. m.', ' AM')
            .replace(' p. m.', ' PM')
          dateTime = new Date(cleanDateStr)
        }
        
        if (isNaN(dateTime.getTime())) {
          console.log('Invalid date format:', dateTimeStr)
          return
        }
      } catch (e) {
        console.log('Error parsing date:', dateTimeStr, e)
        return
      }
      
      // Add employee if not exists
      if (!employees.has(employeeId)) {
        employees.set(employeeId, {
          id: employeeId,
          name: employeeName,
          area: 'General',
          shift: 'Diurno (7:00 - 17:00)'
        })
      }
      
      // Add record
      records.push({
        id: `${employeeId}_${index}`,
        employeeId,
        dateTime,
        state,
        device,
        recordType,
        suggested: false,
        anomaly: false
      })
    } catch (e) {
      console.error('Error parsing row', index, ':', e, row)
    }
  })
  
  console.log('Parsed:', employees.size, 'employees,', records.length, 'records')
  return {
    employees: Array.from(employees.values()),
    records
  }
}

function calculateEmployeeStats(records) {
  const totalHours = calculateTotalHours(records)
  const weeklyHours = calculateWeeklyHours(records)
  const missingRecords = records.filter(r => !r.state).length
  const anomalies = records.filter(r => r.anomaly).length
  
  return {
    totalHours,
    weeklyHours,
    missingRecords,
    anomalies
  }
}

function calculateTotalHours(records) {
  // Group records by date and calculate daily hours
  const dailyHours = new Map()
  
  records.forEach(record => {
    const dateKey = format(record.dateTime, 'yyyy-MM-dd')
    if (!dailyHours.has(dateKey)) {
      dailyHours.set(dateKey, [])
    }
    dailyHours.get(dateKey).push(record)
  })
  
  let totalMinutes = 0
  
  for (const [date, dayRecords] of dailyHours) {
    const sortedRecords = dayRecords.sort((a, b) => a.dateTime - b.dateTime)
    
    // Simple calculation: last record time - first record time
    if (sortedRecords.length >= 2) {
      const startTime = sortedRecords[0].dateTime
      const endTime = sortedRecords[sortedRecords.length - 1].dateTime
      const dayMinutes = (endTime - startTime) / (1000 * 60)
      totalMinutes += Math.max(0, dayMinutes - 60) // Subtract 1 hour for lunch
    }
  }
  
  return Math.round(totalMinutes / 60 * 10) / 10 // Round to 1 decimal
}

function calculateWeeklyHours(records) {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  
  const weekRecords = records.filter(r => 
    r.dateTime >= weekStart && r.dateTime <= weekEnd
  )
  
  return calculateTotalHours(weekRecords)
}

function suggestMissingStates(records) {
  return records.map((record, index) => {
    if (record.state) return record
    
    // Simple logic: alternate between entrada and salida
    const previousRecord = records[index - 1]
    const nextRecord = records[index + 1]
    
    let suggestedState = null
    
    if (!previousRecord || previousRecord.state === 'Salida') {
      suggestedState = 'Entrada'
    } else if (previousRecord.state === 'Entrada') {
      suggestedState = 'Salida'
    }
    
    return {
      ...record,
      state: suggestedState,
      suggested: true
    }
  })
}

export default useBiometricStore