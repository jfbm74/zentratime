import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import useBiometricStore from '../store/biometricStore'

const RecordsTable = ({ employeeId, view, currentWeek }) => {
  const { records } = useBiometricStore()

  // Filter records for the selected employee and time period
  let periodStart, periodEnd
  
  if (view === 'monthly') {
    periodStart = startOfMonth(currentWeek)
    periodEnd = endOfMonth(currentWeek)
  } else {
    periodStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
    periodEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  }

  const employeeRecords = records
    .filter(r => r.employeeId === employeeId)
    .filter(r => r.dateTime >= periodStart && r.dateTime <= periodEnd)
    .sort((a, b) => a.dateTime - b.dateTime)

  // Group records by work shift
  const groupedShifts = groupRecordsByWorkShift(employeeRecords)

  const getTimeBadgeClass = (record) => {
    if (record.suggested) {
      return 'bg-yellow-100 text-yellow-800 border-2 border-dashed border-yellow-400 relative animate-pulse'
    }
    
    if (record.confirmed) {
      return 'bg-green-100 text-green-800 border border-green-400'
    }
    
    if (!record.state) {
      return 'bg-red-100 text-red-700 border border-dashed border-red-400'
    }

    if (record.hasProblems) {
      switch (record.state?.toLowerCase()) {
        case 'entrada':
          return 'bg-primary-100 text-primary-700 border border-red-300'
        case 'salida':
          return 'bg-pink-100 text-pink-700 border border-red-300'
        default:
          return 'bg-gray-100 text-gray-700 border border-red-300'
      }
    }

    switch (record.state?.toLowerCase()) {
      case 'entrada':
        return 'bg-primary-100 text-primary-700'
      case 'salida':
        return 'bg-pink-100 text-pink-700'
      case 'almuerzo':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const calculateDayHours = (dayRecords) => {
    if (dayRecords.length < 2) return '-'
    
    const sortedRecords = dayRecords.sort((a, b) => a.dateTime - b.dateTime)
    let totalWorkingMinutes = 0
    let entryTime = null
    
    // Calcular períodos de trabajo reales basados en entradas y salidas
    for (const record of sortedRecords) {
      const state = record.state?.toLowerCase()
      
      if (state === 'entrada' && entryTime === null) {
        entryTime = record.dateTime
      } else if (state === 'salida' && entryTime !== null) {
        let workingMinutes = (record.dateTime - entryTime) / (1000 * 60)
        
        // Si la salida es antes que la entrada (cruzó medianoche), ajustar el cálculo
        if (record.dateTime < entryTime) {
          // Añadir 24 horas en minutos
          workingMinutes += 24 * 60
        }
        
        totalWorkingMinutes += workingMinutes
        entryTime = null
      }
    }
    
    // Si hay una entrada sin salida correspondiente, no contar ese período
    if (totalWorkingMinutes === 0) {
      // Fallback al método anterior si no hay entradas/salidas claras
      const firstRecord = sortedRecords[0]
      const lastRecord = sortedRecords[sortedRecords.length - 1]
      let totalMinutes = (lastRecord.dateTime - firstRecord.dateTime) / (1000 * 60)
      
      // Ajustar si cruza medianoche
      if (lastRecord.dateTime < firstRecord.dateTime) {
        totalMinutes += 24 * 60
      }
      
      totalWorkingMinutes = Math.max(0, totalMinutes - 60)
    }
    
    const hours = Math.floor(totalWorkingMinutes / 60)
    const minutes = Math.round(totalWorkingMinutes % 60)
    
    return `${hours}h ${minutes}m`
  }

  const hasProblems = (dayRecords) => {
    return dayRecords.some(r => !r.state || r.anomaly || r.suggested)
  }


  if (employeeRecords.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-sm">No hay registros para este período</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm w-48">
              Fecha
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm w-96">
              Registros
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm w-32">
              Horas Trabajadas
            </th>
            <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">
              Observaciones
            </th>
          </tr>
        </thead>
        <tbody>
          {groupedShifts
            .sort((a, b) => a.date - b.date)
            .map((shift, shiftIndex) => {
            const shiftHours = calculateDayHours(shift.allRecords)
            const problems = hasProblems(shift.allRecords)
            const shiftDate = shift.date

            return (
              <tr 
                key={shiftIndex}
                className={`border-b border-gray-100 hover:bg-gray-50 ${
                  problems ? 'bg-warning-25' : ''
                }`}
              >
                <td className="py-4 px-4 w-48">
                  <div className="font-medium text-gray-900 flex items-center gap-2">
                    {format(shiftDate, 'EEEE d MMM', { locale: es })}
                    {shift.isNightShift && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                        +1
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4 min-w-[400px]">
                  <div className="flex flex-nowrap gap-2 overflow-x-auto">
                    {shift.allRecords.map((record, index) => {
                      const isNextDay = shift.entry && record.dateTime.toDateString() !== shift.entry.dateTime.toDateString()
                      return (
                        <div key={index} className="relative">
                          <span 
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getTimeBadgeClass(record)}`}
                          >
                            {isNextDay && (
                              <span className="text-[10px] mr-1">{format(record.dateTime, 'd MMM')}</span>
                            )}
                            {format(record.dateTime, 'h:mm a')} {record.state || 'Sin estado'}
                          </span>
                          {record.suggested && (
                            <>
                              <div className="absolute -top-2 -right-1 bg-yellow-500 text-white text-xs px-1 rounded text-[9px] font-bold">
                                SUG
                              </div>
                              <SuggestionControls recordId={record.id} />
                            </>
                          )}
                          {record.confirmed && (
                            <div className="absolute -top-2 -right-1 bg-green-500 text-white text-xs px-1 rounded text-[9px] font-bold">
                              ✓
                            </div>
                          )}
                          {record.hasProblems && !record.suggested && (
                            <div className="absolute -top-2 -right-1 bg-red-500 text-white text-xs px-1 rounded text-[9px] font-bold">
                              !
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </td>
                <td className="py-4 px-4 w-32 font-semibold text-gray-900">
                  {shiftHours}
                </td>
                <td className="py-4 px-4">
                  {problems ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-2 py-1 bg-warning-100 text-warning-700 rounded text-xs font-medium">
                        ⚠️ Revisar
                      </span>
                    </div>
                  ) : (
                    <span className="text-success-600 text-sm">✅ Completo</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Suggestion controls component
const SuggestionControls = ({ recordId }) => {
  const { confirmSuggestion } = useBiometricStore()

  const handleAccept = (e) => {
    e.stopPropagation()
    confirmSuggestion(recordId, true)
  }

  const handleReject = (e) => {
    e.stopPropagation()
    confirmSuggestion(recordId, false)
  }

  return (
    <div className="absolute -bottom-8 left-0 flex gap-1 bg-white border border-gray-200 rounded shadow-lg p-1 z-10">
      <button
        onClick={handleAccept}
        className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
        title="Aceptar sugerencia"
      >
        ✓
      </button>
      <button
        onClick={handleReject}
        className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
        title="Rechazar sugerencia"
      >
        ✕
      </button>
    </div>
  )
}

// Helper function to group records by work shifts instead of calendar days
function groupRecordsByWorkShift(records) {
  const shifts = []
  const sortedRecords = [...records].sort((a, b) => a.dateTime - b.dateTime)
  
  let currentShift = null
  let pendingEntry = null
  
  for (const record of sortedRecords) {
    const state = record.state?.toLowerCase()
    
    if (state === 'entrada') {
      // Si hay una entrada pendiente sin salida, cerrar ese turno
      if (pendingEntry) {
        shifts.push(currentShift)
      }
      
      // Iniciar nuevo turno
      currentShift = {
        entry: record,
        exit: null,
        allRecords: [record],
        date: record.dateTime,
        isNightShift: record.dateTime.getHours() >= 18
      }
      pendingEntry = record
    } else if (state === 'salida' && currentShift) {
      // Agregar salida al turno actual
      currentShift.exit = record
      currentShift.allRecords.push(record)
      
      // Si la salida es al día siguiente, marcar como turno nocturno
      if (currentShift.entry && record.dateTime.toDateString() !== currentShift.entry.dateTime.toDateString()) {
        currentShift.isNightShift = true
      }
      
      shifts.push(currentShift)
      currentShift = null
      pendingEntry = null
    } else if (currentShift) {
      // Otros registros (almuerzo, etc.) se agregan al turno actual
      currentShift.allRecords.push(record)
    } else {
      // Registro suelto sin turno asociado
      shifts.push({
        entry: null,
        exit: null,
        allRecords: [record],
        date: record.dateTime,
        isNightShift: false
      })
    }
  }
  
  // Si queda un turno pendiente sin cerrar
  if (currentShift) {
    shifts.push(currentShift)
  }
  
  return shifts
}

export default RecordsTable