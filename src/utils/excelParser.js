import * as XLSX from 'xlsx'
import { format, isAfter, parseISO, startOfDay, isSameDay } from 'date-fns'

// Configuración de horarios
const WORK_CONFIG = {
  ENTRY_CUTOFF: '07:30', // Hora límite para entrada sin tardanza
  MIN_RECORDS_FULL_DAY: 4, // Mínimo de registros para día completo
  MIN_RECORDS_FRIDAY: 2, // Mínimo de registros para viernes
  FRIDAY: 5 // Día viernes (0=domingo, 1=lunes, ..., 5=viernes)
}

export class ExcelParser {
  constructor() {
    this.rawData = []
    this.employees = new Map()
    this.records = []
    this.processedData = null
  }

  // 1. Leer archivo Excel y convertir a JSON
  async readExcelFile(file) {
    console.log('ExcelParser.readExcelFile called with:', file?.name, file?.size)
    
    return new Promise((resolve, reject) => {
      console.log('Creating FileReader...')
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          console.log('FileReader onload triggered, data size:', e.target.result?.byteLength)
          const data = new Uint8Array(e.target.result)
          console.log('Converting to Uint8Array, length:', data.length)
          
          const workbook = XLSX.read(data, { type: 'array' })
          console.log('XLSX workbook created, sheets:', workbook.SheetNames)
          
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          console.log('Got first worksheet:', workbook.SheetNames[0])
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          console.log('Converted to JSON, rows:', jsonData.length)
          console.log('Sample data:', jsonData.slice(0, 2))
          
          this.rawData = jsonData
          resolve(jsonData)
        } catch (error) {
          console.error('Error in FileReader onload:', error)
          reject(error)
        }
      }
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error)
        reject(new Error('Error reading file'))
      }
      
      console.log('Starting readAsArrayBuffer...')
      reader.readAsArrayBuffer(file)
    })
  }

  // 2. Agrupar registros por empleado y procesar datos
  processData() {
    try {
      console.log('Processing Excel data...', this.rawData.length, 'rows')
      this.employees.clear()
      this.records = []

      if (!this.rawData || this.rawData.length === 0) {
        throw new Error('No hay datos para procesar')
      }

      let processedCount = 0
      let errorCount = 0

      this.rawData.forEach((row, index) => {
        try {
          // Debug: mostrar las primeras 3 filas para entender la estructura
          if (index < 3) {
            console.log(`Row ${index + 1} structure:`, Object.keys(row))
            console.log(`Row ${index + 1} data:`, row)
          }

          const employeeId = String(row['Número'] || '').trim()
          const employeeName = (row['Nombre'] || '').trim()
          const dateTimeStr = row['Tiempo']
          const state = (row['Estado'] || '').trim() || null
          const device = row['Dispositivos'] || ''
          const recordType = row['Tipo de Registro'] || ''

          // Debug detallado para las primeras filas
          if (index < 3) {
            console.log(`Row ${index + 1} parsed:`, {
              employeeId, employeeName, dateTimeStr, state
            })
          }

          if (!employeeId || !employeeName || !dateTimeStr) {
            console.warn(`Skipping row ${index + 1}: missing required fields`, {
              employeeId: !!employeeId, 
              employeeName: !!employeeName, 
              dateTimeStr: !!dateTimeStr,
              actualValues: { employeeId, employeeName, dateTimeStr }
            })
            errorCount++
            return
          }

          // Parse datetime
          const dateTime = this.parseDateTime(dateTimeStr)
          if (!dateTime) {
            console.warn(`Skipping row ${index + 1}: invalid date format:`, dateTimeStr)
            errorCount++
            return
          }

          // Add employee if not exists
          if (!this.employees.has(employeeId)) {
            this.employees.set(employeeId, {
              id: employeeId,
              name: employeeName,
              area: 'General',
              shift: 'Diurno (7:00 - 17:00)',
              problems: [],
              status: 'ok'
            })
          }

          // Add record
          const record = {
            id: `${employeeId}_${index}`,
            employeeId,
            dateTime,
            state,
            device,
            recordType,
            suggested: false,
            confirmed: false,
            originalState: state,
            hasProblems: false,
            problems: []
          }

          // 3. Detectar registros sin estado y marcarlos
          if (!state) {
            record.hasProblems = true
            record.problems.push('Sin estado')
          }

          this.records.push(record)
          processedCount++
        } catch (error) {
          console.error(`Error processing row ${index + 1}:`, error, row)
          errorCount++
        }
      })

      console.log(`Processed ${processedCount} records, ${errorCount} errors`)

      if (processedCount === 0) {
        throw new Error('No se pudieron procesar registros válidos')
      }

      // Detectar problemas por empleado
      this.detectEmployeeProblems()

      // Preparar datos procesados
      this.processedData = {
        employees: Array.from(this.employees.values()),
        records: this.records,
        summary: this.generateSummary()
      }

      console.log('Data processed successfully:', this.employees.size, 'employees,', this.records.length, 'records')
      
      // 4. Guardar en localStorage
      this.saveToLocalStorage()
      
      return this.processedData
    } catch (error) {
      console.error('Error processing Excel data:', error)
      throw error
    }
  }

  // Parse datetime - versión simplificada
  parseDateTime(dateTimeStr) {
    try {
      // Convertir a string y limpiar formato español
      const cleanDateStr = String(dateTimeStr).trim()
        .replace(/\s*a\.\s*m\./gi, ' AM')
        .replace(/\s*p\.\s*m\./gi, ' PM')

      // Usar regex manual directamente ya que el formato no es estándar para Date()
      const pattern = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i
      const match = cleanDateStr.match(pattern)
      
      if (match) {
        const day = parseInt(match[1])
        const month = parseInt(match[2]) 
        const year = parseInt(match[3])
        let hour = parseInt(match[4])
        const minute = parseInt(match[5])
        const second = parseInt(match[6])
        const ampm = match[7].toUpperCase()
        
        // Convertir AM/PM
        if (ampm === 'PM' && hour !== 12) hour += 12
        if (ampm === 'AM' && hour === 12) hour = 0
        
        // Crear fecha asumiendo DD/MM/YYYY
        const manualDate = new Date(year, month - 1, day, hour, minute, second)
        
        
        return manualDate
      }

      // Fallback: intentar parsing directo
      const directDate = new Date(cleanDateStr)
      if (!isNaN(directDate.getTime())) {
        return directDate
      }

      console.error('Could not parse datetime:', dateTimeStr, 'cleaned:', cleanDateStr)
      return null
    } catch (error) {
      console.error('Error parsing datetime:', dateTimeStr, error)
      return null
    }
  }

  // Detectar problemas por empleado
  detectEmployeeProblems() {
    for (const [employeeId, employee] of this.employees) {
      const employeeRecords = this.records.filter(r => r.employeeId === employeeId)
      const problems = []

      // Agrupar por día
      const dayGroups = this.groupRecordsByDay(employeeRecords)

      for (const [dateKey, dayRecords] of Object.entries(dayGroups)) {
        const date = new Date(dateKey)
        const dayOfWeek = date.getDay()
        const isFriday = dayOfWeek === WORK_CONFIG.FRIDAY

        // 1. Días sin entrada o salida
        const entryRecords = dayRecords.filter(r => r.state === 'Entrada' || (!r.state && this.couldBeEntry(r, dayRecords)))
        const exitRecords = dayRecords.filter(r => r.state === 'Salida' || (!r.state && this.couldBeExit(r, dayRecords)))

        if (dayRecords.length > 0) {
          if (entryRecords.length === 0) {
            problems.push(`${format(date, 'dd/MM/yyyy')}: Sin entrada`)
            this.markRecordsWithProblem(dayRecords, 'Sin entrada')
          }
          if (exitRecords.length === 0) {
            problems.push(`${format(date, 'dd/MM/yyyy')}: Sin salida`)
            this.markRecordsWithProblem(dayRecords, 'Sin salida')
          }
        }

        // 2. Registros incompletos
        const minRecords = isFriday ? WORK_CONFIG.MIN_RECORDS_FRIDAY : WORK_CONFIG.MIN_RECORDS_FULL_DAY
        if (dayRecords.length > 0 && dayRecords.length < minRecords) {
          problems.push(`${format(date, 'dd/MM/yyyy')}: Registros incompletos (${dayRecords.length}/${minRecords})`)
          this.markRecordsWithProblem(dayRecords, 'Registros incompletos')
        }

        // 3. Tardanzas
        const firstRecord = dayRecords.sort((a, b) => a.dateTime - b.dateTime)[0]
        if (firstRecord && this.isLate(firstRecord.dateTime)) {
          problems.push(`${format(date, 'dd/MM/yyyy')}: Tardanza (${format(firstRecord.dateTime, 'HH:mm')})`)
          firstRecord.hasProblems = true
          firstRecord.problems.push('Tardanza')
        }
      }

      // 4. Marcar empleado con problemas
      employee.problems = problems
      employee.status = problems.length === 0 ? 'ok' : 
                      problems.length <= 2 ? 'warning' : 'error'
    }
  }

  // Agrupar registros por día
  groupRecordsByDay(records) {
    return records.reduce((groups, record) => {
      const dateKey = format(record.dateTime, 'yyyy-MM-dd')
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(record)
      return groups
    }, {})
  }

  // Verificar si podría ser entrada
  couldBeEntry(record, dayRecords) {
    const sortedRecords = dayRecords.sort((a, b) => a.dateTime - b.dateTime)
    return sortedRecords.indexOf(record) === 0 || sortedRecords.indexOf(record) === 2
  }

  // Verificar si podría ser salida
  couldBeExit(record, dayRecords) {
    const sortedRecords = dayRecords.sort((a, b) => a.dateTime - b.dateTime)
    return sortedRecords.indexOf(record) === 1 || sortedRecords.indexOf(record) === 3
  }

  // Marcar registros con problemas
  markRecordsWithProblem(records, problem) {
    records.forEach(record => {
      record.hasProblems = true
      if (!record.problems.includes(problem)) {
        record.problems.push(problem)
      }
    })
  }

  // Verificar tardanza
  isLate(dateTime) {
    const timeStr = format(dateTime, 'HH:mm')
    return timeStr > WORK_CONFIG.ENTRY_CUTOFF
  }

  // Auto-sugerir estados
  autoSuggestStates(employeeId) {
    const employeeRecords = this.records.filter(r => r.employeeId === employeeId)
    const dayGroups = this.groupRecordsByDay(employeeRecords)
    
    const suggestions = []

    for (const [dateKey, dayRecords] of Object.entries(dayGroups)) {
      const sortedRecords = dayRecords.sort((a, b) => a.dateTime - b.dateTime)
      const recordsWithoutState = sortedRecords.filter(r => !r.state)
      
      if (recordsWithoutState.length === 0) continue

      // Lógica de sugerencias según el número de registros
      if (sortedRecords.length === 4) {
        // 4 registros: Entrada, Salida (almuerzo), Entrada (almuerzo), Salida
        const states = ['Entrada', 'Salida', 'Entrada', 'Salida']
        sortedRecords.forEach((record, index) => {
          if (!record.state) {
            record.state = states[index]
            record.suggested = true
            record.confirmed = false
            suggestions.push({
              recordId: record.id,
              suggestedState: states[index],
              confidence: 'high'
            })
          }
        })
      } else if (sortedRecords.length === 2) {
        // 2 registros: Entrada, Salida
        const states = ['Entrada', 'Salida']
        sortedRecords.forEach((record, index) => {
          if (!record.state) {
            record.state = states[index]
            record.suggested = true
            record.confirmed = false
            suggestions.push({
              recordId: record.id,
              suggestedState: states[index],
              confidence: 'medium'
            })
          }
        })
      } else if (sortedRecords.length === 3) {
        // 3 registros: Entrada, Salida (almuerzo), Entrada (tarde sin salida)
        const states = ['Entrada', 'Salida', 'Entrada']
        sortedRecords.forEach((record, index) => {
          if (!record.state) {
            record.state = states[index]
            record.suggested = true
            record.confirmed = false
            suggestions.push({
              recordId: record.id,
              suggestedState: states[index],
              confidence: 'low'
            })
          }
        })
      }
    }

    console.log('Generated suggestions:', suggestions.length)
    this.saveToLocalStorage()
    return suggestions
  }

  // Confirmar sugerencia
  confirmSuggestion(recordId, accept = true) {
    const record = this.records.find(r => r.id === recordId)
    if (!record || !record.suggested) return false

    if (accept) {
      record.confirmed = true
      record.suggested = false
    } else {
      // Rechazar sugerencia - restaurar estado original
      record.state = record.originalState
      record.suggested = false
      record.confirmed = false
    }

    this.saveToLocalStorage()
    return true
  }

  // Confirmar todas las sugerencias de un empleado
  confirmAllSuggestions(employeeId, accept = true) {
    const employeeRecords = this.records.filter(r => 
      r.employeeId === employeeId && r.suggested
    )

    employeeRecords.forEach(record => {
      this.confirmSuggestion(record.id, accept)
    })

    return employeeRecords.length
  }

  // Generar resumen
  generateSummary() {
    const totalRecords = this.records.length
    const recordsWithoutState = this.records.filter(r => !r.originalState).length
    const suggestedRecords = this.records.filter(r => r.suggested).length
    const employeesWithProblems = Array.from(this.employees.values())
      .filter(emp => emp.problems.length > 0).length

    return {
      totalRecords,
      recordsWithoutState,
      suggestedRecords,
      employeesWithProblems,
      totalEmployees: this.employees.size
    }
  }

  // Guardar en localStorage
  saveToLocalStorage() {
    try {
      const dataToSave = {
        employees: Array.from(this.employees.values()),
        records: this.records,
        summary: this.generateSummary(),
        lastUpdated: new Date().toISOString()
      }
      
      localStorage.setItem('biometric_data', JSON.stringify(dataToSave))
      console.log('Data saved to localStorage')
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  // Cargar desde localStorage
  loadFromLocalStorage() {
    try {
      const data = localStorage.getItem('biometric_data')
      if (!data) return null

      const parsedData = JSON.parse(data)
      
      // Reconstruir Maps y Dates
      this.employees = new Map()
      parsedData.employees.forEach(emp => {
        this.employees.set(emp.id, emp)
      })
      
      this.records = parsedData.records.map(record => ({
        ...record,
        dateTime: new Date(record.dateTime)
      }))

      this.processedData = {
        employees: parsedData.employees,
        records: this.records,
        summary: parsedData.summary
      }

      console.log('Data loaded from localStorage')
      return this.processedData
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      return null
    }
  }

  // Limpiar datos
  clearData() {
    this.rawData = []
    this.employees.clear()
    this.records = []
    this.processedData = null
    localStorage.removeItem('biometric_data')
    console.log('Data cleared')
  }

  // Obtener estadísticas de un empleado
  getEmployeeStats(employeeId) {
    const employeeRecords = this.records.filter(r => r.employeeId === employeeId)
    const problems = employeeRecords.filter(r => r.hasProblems).length
    const suggestions = employeeRecords.filter(r => r.suggested).length
    const totalDays = new Set(employeeRecords.map(r => format(r.dateTime, 'yyyy-MM-dd'))).size

    return {
      totalRecords: employeeRecords.length,
      totalDays,
      problems,
      suggestions,
      completionRate: totalDays > 0 ? ((totalDays - problems) / totalDays * 100).toFixed(1) : 0
    }
  }
}

// Instancia singleton
export const excelParser = new ExcelParser()