# 🕒 Biometric Dashboard

Una aplicación web moderna para la gestión y análisis de registros biométricos de empleados. Permite procesar archivos Excel con datos de entrada y salida, detectar anomalías, y generar reportes detallados de asistencia.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-19.1.0-61dafb.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Características

### 📊 **Gestión de Registros**
- **Carga de archivos Excel**: Soporte completo para archivos `.xls` y `.xlsx`
- **Parsing inteligente**: Reconocimiento automático de formatos de fecha españoles (`a. m.` / `p. m.`)
- **Detección de anomalías**: Identificación automática de registros incompletos o problemáticos
- **Auto-sugerencias**: Sistema inteligente para completar estados faltantes

### 🎯 **Análisis y Reportes**
- **Cálculo de horas trabajadas**: Algoritmo preciso que maneja múltiples entradas/salidas
- **Detección de tardanzas**: Configuración personalizable de horarios límite
- **Turnos nocturnos**: Soporte para turnos que cruzan medianoche
- **Vistas flexibles**: Visualización semanal y mensual

### 🖥️ **Interfaz de Usuario**
- **Diseño moderno**: Interfaz limpia y responsive construida con Tailwind CSS
- **Navegación intuitiva**: Sidebar con lista de empleados y filtros
- **Feedback visual**: Estados claros para registros (sugeridos, confirmados, problemáticos)
- **Tablas optimizadas**: Visualización eficiente con scroll horizontal para múltiples registros

### ⚙️ **Características Técnicas**
- **Almacenamiento local**: Persistencia de datos en localStorage
- **Estado global**: Gestión de estado con Zustand
- **Internacionalización**: Soporte completo para español (fechas, formatos)
- **Containerización**: Docker listo para producción

## 🚀 Inicio Rápido

### Requisitos Previos

- **Node.js** 18.0+ 
- **npm** 9.0+
- **Docker** (opcional, para containerización)

### Instalación Local

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd biometric-dashboard
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:5173
   ```

### 🐳 Instalación con Docker

#### Desarrollo
```bash
# Construir y ejecutar en modo desarrollo
docker-compose --profile dev up --build

# Acceder en: http://localhost:5173
```

#### Producción
```bash
# Construir y ejecutar en modo producción
docker-compose up --build

# Acceder en: http://localhost:3000
```

## 📖 Guía de Uso

### 1. **Carga de Archivos**

1. Haz clic en el botón **"Seleccionar archivo Excel"**
2. Selecciona un archivo `.xls` o `.xlsx` con la estructura esperada
3. Presiona **"Procesar Archivo"** para importar los datos

#### Estructura de Archivo Esperada
```
| Número | Nombre           | Tiempo                    | Estado  | Dispositivos | Tipo de Registro |
|--------|------------------|---------------------------|---------|--------------|------------------|
| 1      | Juan Pérez       | 1/07/2025 7:08:11 a. m.  | Entrada | DEVICE001    | 0                |
| 1      | Juan Pérez       | 1/07/2025 12:04:38 p. m. |         | DEVICE001    | 0                |
```

### 2. **Navegación**

- **Sidebar izquierdo**: Lista de empleados con indicadores de estado
- **Panel principal**: Registros detallados del empleado seleccionado
- **Controles de período**: Cambiar entre vista semanal y mensual

### 3. **Gestión de Anomalías**

#### Auto-sugerencias
1. Selecciona un empleado con registros sin estado
2. Haz clic en **"Auto-sugerir estados"**
3. Revisa las sugerencias marcadas con etiqueta amarilla **SUG**
4. Acepta (✓) o rechaza (✕) cada sugerencia individualmente

#### Estados de Registros
- 🟢 **Verde**: Registro confirmado
- 🟡 **Amarillo**: Sugerencia pendiente
- 🔴 **Rojo**: Registro con problemas
- 🔵 **Azul**: Entrada normal
- 🟣 **Rosa**: Salida normal

### 4. **Interpretación de Datos**

#### Tarjetas de Estadísticas
- **Horas Totales (Mes)**: Suma de horas trabajadas en el mes actual
- **Horas Esta Semana**: Horas trabajadas en la semana seleccionada
- **Registros Sin Estado**: Cantidad de registros que requieren atención
- **Días con Anomalías**: Días que presentan inconsistencias

#### Cálculo de Horas
El sistema calcula automáticamente las horas trabajadas basándose en:
- Pares de **Entrada** → **Salida**
- Múltiples períodos (mañana y tarde)
- Exclusión automática de tiempo de almuerzo

## 🏗️ Arquitectura

### Estructura del Proyecto
```
biometric-dashboard/
├── src/
│   ├── components/          # Componentes React
│   │   ├── EmployeeSidebar.jsx
│   │   ├── FileUpload.jsx
│   │   ├── MainContent.jsx
│   │   ├── RecordsTable.jsx
│   │   └── StatCard.jsx
│   ├── store/              # Estado global (Zustand)
│   │   └── biometricStore.js
│   ├── utils/              # Utilidades
│   │   └── excelParser.js  # Lógica de parsing Excel
│   ├── App.jsx
│   └── main.jsx
├── public/
├── docker/                 # Configuración Docker
├── docs/                  # Documentación
└── README.md
```

### Stack Tecnológico

#### Frontend
- **React 19.1.0**: Biblioteca principal de UI
- **Vite**: Build tool y dev server
- **Tailwind CSS**: Framework de estilos
- **date-fns**: Manipulación de fechas
- **Zustand**: Gestión de estado global

#### Utilidades
- **XLSX**: Parsing de archivos Excel
- **ESLint**: Linting de código

#### Containerización
- **Docker**: Containerización
- **Nginx**: Servidor web (producción)

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# Configuración de la aplicación
VITE_APP_TITLE=Biometric Dashboard
VITE_APP_VERSION=1.0.0

# Configuración de desarrollo
VITE_DEV_PORT=5173
```

### Configuración de Horarios

Edita `src/utils/excelParser.js` para ajustar parámetros:

```javascript
const WORK_CONFIG = {
  ENTRY_CUTOFF: '07:30',        // Hora límite entrada sin tardanza
  MIN_RECORDS_FULL_DAY: 4,      // Registros mínimos día completo
  MIN_RECORDS_FRIDAY: 2,        // Registros mínimos viernes
  FRIDAY: 5                     // Día viernes (0=domingo)
}
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor desarrollo
npm run build           # Build producción
npm run preview         # Preview build
npm run lint           # Ejecutar ESLint

# Docker
docker-compose up                    # Producción
docker-compose --profile dev up      # Desarrollo
docker-compose down                  # Detener contenedores
```

## 🐛 Resolución de Problemas

### Problemas Comunes

#### 1. **Fechas mostrando día anterior**
- **Causa**: Problemas de zona horaria
- **Solución**: Ya corregido en v1.0.0+ usando construcción manual de fechas

#### 2. **Archivo Excel no se procesa**
- Verifica que el archivo tenga las columnas requeridas
- Asegúrate que las fechas estén en formato español (`a. m.` / `p. m.`)
- Revisa la consola del navegador para errores específicos

#### 3. **Registros sin estado**
- Usa la función **"Auto-sugerir estados"**
- Verifica manualmente registros con anomalías
- Asegúrate que los horarios sean consistentes

#### 4. **Cálculo de horas incorrecto**
- Confirma que todos los registros tengan estados correctos
- Verifica que haya pares entrada-salida válidos
- Revisa configuración de horarios en `WORK_CONFIG`

### Logs y Debugging

```bash
# Ver logs en desarrollo
npm run dev

# Ver logs Docker
docker-compose logs -f biometric-dashboard

# Inspeccionar build
npm run build -- --debug
```

## 🤝 Contribución

### Proceso de Desarrollo

1. **Fork del repositorio**
2. **Crear rama feature**: `git checkout -b feature/nueva-funcionalidad`
3. **Commit cambios**: `git commit -m 'feat: agregar nueva funcionalidad'`
4. **Push a la rama**: `git push origin feature/nueva-funcionalidad`
5. **Crear Pull Request**

### Estándares de Código

- **ESLint**: Seguir configuración del proyecto
- **Commits**: Usar [Conventional Commits](https://conventionalcommits.org/)
- **Componentes**: Funcionales con hooks
- **Estilos**: Tailwind CSS únicamente

### Testing

```bash
# Ejecutar tests (cuando estén disponibles)
npm run test

# Coverage
npm run test:coverage
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👤 Autor

**Juan Bustamante**
- GitHub: [@juan-bustamante](https://github.com/juan-bustamante)
- Email: juan.bustamante@example.com

## 🙏 Agradecimientos

- **React Team** por la excelente biblioteca
- **Tailwind CSS** por el framework de estilos
- **date-fns** por las utilidades de fecha
- **XLSX** por el parsing de Excel

---

## 📋 Changelog

### v1.0.0 (2025-07-31)
- ✨ Lanzamiento inicial
- 🐛 Corrección de problemas de zona horaria en fechas
- 🎨 Interfaz completa con Tailwind CSS
- 📊 Sistema de auto-sugerencias
- 🐳 Soporte completo para Docker
- 📖 Documentación completa

---

**¿Tienes preguntas?** Abre un [issue](https://github.com/username/biometric-dashboard/issues) o contacta al equipo de desarrollo.
