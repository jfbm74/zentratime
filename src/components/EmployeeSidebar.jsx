import useBiometricStore from '../store/biometricStore'

const EmployeeSidebar = () => {
  const { 
    searchQuery, 
    setSearchQuery, 
    selectedEmployee, 
    setSelectedEmployee,
    getFilteredEmployees,
    getEmployeeStatus,
    records
  } = useBiometricStore()

  const filteredEmployees = getFilteredEmployees()

  const getEmployeeProblemCount = (employeeId) => {
    const employee = filteredEmployees.find(emp => emp.id === employeeId)
    return employee ? employee.problems?.length || 0 : 0
  }

  const getEmployeeSuggestionCount = (employeeId) => {
    const employeeRecords = records.filter(r => r.employeeId === employeeId)
    return employeeRecords.filter(r => r.suggested).length
  }

  return (
    <aside className="card h-[calc(100vh-250px)] overflow-hidden flex flex-col">
      {/* Search Box */}
      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          placeholder="Buscar funcionario..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Employee List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredEmployees.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No se encontraron empleados</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredEmployees.map((employee) => {
              const status = employee.status || getEmployeeStatus(employee.id)
              const problemCount = getEmployeeProblemCount(employee.id)
              const suggestionCount = getEmployeeSuggestionCount(employee.id)
              const isSelected = selectedEmployee?.id === employee.id

              return (
                <button
                  key={employee.id}
                  onClick={() => setSelectedEmployee(employee)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm truncate">{employee.name}</span>
                  <div className="flex items-center gap-2">
                    <div className={`status-dot status-${status}`}></div>
                    {suggestionCount > 0 && (
                      <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded-full">
                        {suggestionCount}✨
                      </span>
                    )}
                    {problemCount > 0 && (
                      <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded-full">
                        {problemCount}!
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Status Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Estados:</h4>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="status-dot status-ok"></div>
            <span>Completo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="status-dot status-warning"></div>
            <span>Advertencias</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="status-dot status-error"></div>
            <span>Errores</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default EmployeeSidebar