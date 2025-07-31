const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-emerald-600 to-blue-700 text-white mt-12">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Logo y empresa */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
              <img 
                src="/logo-texto-horizontal.png" 
                alt="Zentratek" 
                className="h-8 w-auto filter brightness-0 invert"
              />
            </div>
            <p className="text-emerald-100 text-sm">
              Soluciones tecnológicas innovadoras
            </p>
            <a 
              href="https://www.zentratek.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-emerald-200 hover:text-white text-sm underline transition-colors duration-200"
            >
              www.zentratek.com
            </a>
          </div>

          {/* Mensaje central */}
          <div className="text-center">
            <p className="text-lg font-medium mb-1">
              Desarrollado por{' '}
              <a 
                href="https://www.zentratek.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-emerald-200 hover:text-white font-bold transition-colors duration-200"
              >
                Zentratek
              </a>
              {' '}con{' '}
              <span className="text-red-400 text-xl">❤️</span>
            </p>
            <p className="text-emerald-100 text-sm">
              para{' '}
              <span className="font-semibold text-white">Bonsana IPS</span>
            </p>
          </div>

          {/* Desarrollador */}
          <div className="text-center md:text-right">
            <div className="flex items-center justify-center md:justify-end space-x-2 mb-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-emerald-100">Desarrollado por:</p>
                <p className="font-semibold text-white">Juan F. Bustamante</p>
              </div>
            </div>
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t border-white/20 mt-6 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-emerald-100">
            <p>
              © {new Date().getFullYear()} Zentratek. Todos los derechos reservados.
            </p>
            <div className="flex items-center space-x-4 mt-2 md:mt-0">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>ZentraTime v1.0.0</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer