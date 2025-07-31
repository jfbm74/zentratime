import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import useBiometricStore from '../store/biometricStore'
import StatCard from './StatCard'
import RecordsTable from './RecordsTable'

const MainContent = () => {
  const { 
    selectedEmployee, 
    currentView, 
    setCurrentView,
    currentWeek,
    setCurrentWeek,
    stats,
    records,
    autoSuggestStates,
    confirmAllSuggestions
  } = useBiometricStore()

  if (!selectedEmployee) {
    return (
      <div className="card p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Selecciona un empleado
        </h3>
        <p className="text-gray-600">
          Selecciona un empleado de la lista lateral para ver sus registros
        </p>
      </div>
    )
  }

  const handlePreviousPeriod = () => {
    if (currentView === 'monthly') {
      setCurrentWeek(subMonths(currentWeek, 1))
    } else {
      setCurrentWeek(subWeeks(currentWeek, 1))
    }
  }

  const handleNextPeriod = () => {
    if (currentView === 'monthly') {
      setCurrentWeek(addMonths(currentWeek, 1))
    } else {
      setCurrentWeek(addWeeks(currentWeek, 1))
    }
  }

  const handleAutoSuggest = () => {
    autoSuggestStates(selectedEmployee.id)
  }

  const handleConfirmAll = () => {
    confirmAllSuggestions(selectedEmployee.id, true)
  }

  const handleRejectAll = () => {
    confirmAllSuggestions(selectedEmployee.id, false)
  }

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  
  const weekLabel = `${format(weekStart, 'dd MMM', { locale: es })} - ${format(weekEnd, 'dd MMM yyyy', { locale: es })}`
  const monthLabel = format(currentWeek, 'MMMM yyyy', { locale: es })

  const employeeRecords = records.filter(r => r.employeeId === selectedEmployee.id)
  const problemRecords = employeeRecords.filter(r => r.hasProblems || !r.originalState)
  const employee = selectedEmployee

  return (
    <div className="card p-6">
      {/* Employee Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {selectedEmployee.name}
          </h2>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            <span>ID: #{selectedEmployee.id}</span>
            <span>Área: {selectedEmployee.area}</span>
            <span>Turno: {selectedEmployee.shift}</span>
          </div>
        </div>
      </div>

      {/* Period Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
        {/* View Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setCurrentView('weekly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              currentView === 'weekly'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Vista Semanal
          </button>
          <button
            onClick={() => setCurrentView('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              currentView === 'monthly'
                ? 'bg-white text-primary-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Vista Mensual
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2">
          <button
            onClick={handlePreviousPeriod}
            className="text-gray-600 hover:text-gray-900 p-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="font-medium text-gray-900 min-w-[200px] text-center">
            {currentView === 'weekly' ? weekLabel : monthLabel}
          </span>
          <button
            onClick={handleNextPeriod}
            className="text-gray-600 hover:text-gray-900 p-1"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Horas Totales (Mes)"
          value={`${stats.totalHours}h`}
          type="normal"
        />
        <StatCard
          title="Horas Esta Semana"
          value={`${stats.weeklyHours}h`}
          type="normal"
        />
        <StatCard
          title="Registros Sin Estado"
          value={stats.missingRecords}
          type={stats.missingRecords > 0 ? "warning" : "normal"}
        />
        <StatCard
          title="Días con Anomalías"
          value={stats.anomalies}
          type={stats.anomalies > 0 ? "error" : "normal"}
        />
      </div>

      {/* Problem Alerts */}
      {(employee.problems?.length > 0 || problemRecords.length > 0) && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-warning-600 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-warning-800 mb-2">
                Problemas detectados
              </h4>
              <div className="space-y-1 text-sm text-warning-700">
                {employee.problems ? (
                  employee.problems.slice(0, 5).map((problem, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span>•</span>
                      <span>{problem}</span>
                    </div>
                  ))
                ) : (
                  problemRecords.slice(0, 3).map((record, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span>•</span>
                      <span>
                        <strong>{format(record.dateTime, 'dd MMM', { locale: es })}:</strong>{' '}
                        {record.problems?.join(', ') || (!record.originalState ? 'Falta estado' : 'Anomalía detectada')}
                      </span>
                    </div>
                  ))
                )}
                {employee.problems && employee.problems.length > 5 && (
                  <div className="text-warning-600">
                    +{employee.problems.length - 5} problemas más
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Records Section */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Registros Detallados - {currentView === 'weekly' ? `Semana (${weekLabel})` : `Mes (${monthLabel})`}
          </h3>
          <div className="flex flex-wrap gap-2 mt-2 lg:mt-0">
            <button
              onClick={handleAutoSuggest}
              className="btn btn-primary"
              disabled={stats.missingRecords === 0}
            >
              <span>✨</span>
              Auto-sugerir estados
            </button>
            {records.some(r => r.employeeId === selectedEmployee.id && r.suggested) && (
              <>
                <button
                  onClick={handleConfirmAll}
                  className="btn btn-success text-sm"
                >
                  <span>✓</span>
                  Confirmar todas
                </button>
                <button
                  onClick={handleRejectAll}
                  className="btn btn-danger text-sm"
                >
                  <span>✕</span>
                  Rechazar todas
                </button>
              </>
            )}
          </div>
        </div>
        
        <RecordsTable 
          employeeId={selectedEmployee.id}
          view={currentView}
          currentWeek={currentWeek}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-4 lg:mb-0">
          Última actualización: Hace pocos segundos
        </p>
        <div className="flex gap-3">
          <button className="btn btn-primary">
            <span>📊</span>
            Exportar Empleado
          </button>
          <button className="btn btn-success">
            <span>📄</span>
            Generar Reporte
          </button>
        </div>
      </div>
    </div>
  )
}

export default MainContent