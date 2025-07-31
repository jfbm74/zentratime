const StatCard = ({ title, value, type = 'normal' }) => {
  const getCardStyles = () => {
    switch (type) {
      case 'warning':
        return 'bg-warning-50 border-warning-200'
      case 'error':
        return 'bg-error-50 border-error-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getValueStyles = () => {
    switch (type) {
      case 'warning':
        return 'text-warning-700'
      case 'error':
        return 'text-error-700'
      default:
        return 'text-gray-900'
    }
  }

  return (
    <div className={`p-5 rounded-lg border text-center ${getCardStyles()}`}>
      <div className={`text-3xl font-bold mb-1 ${getValueStyles()}`}>
        {value}
      </div>
      <div className="text-sm text-gray-600">
        {title}
      </div>
    </div>
  )
}

export default StatCard