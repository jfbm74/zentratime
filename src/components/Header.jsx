const Header = () => {
  return (
    <header className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo y Título */}
          <div className="flex items-center space-x-4">
            <img 
              src="/logo-texto-horizontal.png" 
              alt="Zentratek" 
              className="h-12 w-auto filter brightness-0 invert"
            />
            <div className="hidden md:block h-8 w-px bg-white/30"></div>
            <div className="hidden md:block">
              <h1 className="text-2xl font-bold">
                ZentraTime
              </h1>
              <p className="text-emerald-100 text-sm">
                Control Biométrico
              </p>
            </div>
          </div>
          
          {/* Cliente */}
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-emerald-100">Cliente:</p>
                <p className="text-lg font-semibold">Clínica Bonsana</p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Título móvil */}
        <div className="md:hidden mt-3 text-center">
          <h1 className="text-xl font-bold">ZentraTime</h1>
          <p className="text-emerald-100 text-sm">Control Biométrico - Clínica Bonsana</p>
        </div>
      </div>
    </header>
  )
}

export default Header