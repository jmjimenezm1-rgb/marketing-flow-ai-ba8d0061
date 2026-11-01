# Fusión paralela de Marketing Flow y Marketing Catalyst

## Resultado
Una única aplicación MarketingHub con dos áreas conectadas, conservando todas las pantallas originales, sus formularios, tablas, filtros, diálogos y comportamientos. La demostración funcionará sin depender de ninguna base de datos.

## Inventario comprobado
- **Marketing Flow:** dashboard, clientes y detalle, productos con creación/edición, campañas con creación/detalle, generador simulado, revisión y detalle de mensajes.
- **Marketing Catalyst:** dashboard de operación, clientes, productos, campañas con aprobación, secuencias, envíos, bandejas de entrada/salida, consentimientos y bajas, auditoría con exportación.
- Catalyst no tiene una pantalla independiente de revisión: la revisión de respuestas está en la bandeja de salida. Se conservará además de la revisión de Flow.
- Hay cuatro duplicidades de pantallas: dashboard, clientes, productos y campañas. No se sustituirá ninguna.
- Ambos utilizan React y TanStack; Catalyst usa datos y servicios simulados. Flow actualmente intenta cargar y guardar en la base externa: esas operaciones quedarán fuera del funcionamiento de esta fase.

## 1. Navegación sin pérdida de pantallas
- Mantener las direcciones actuales de Flow para conservar compatibilidad.
- Añadir `/marketing` como acceso al dashboard Flow y sus equivalencias `/marketing/clientes`, `/marketing/productos`, `/marketing/campanas`, `/marketing/generador` y `/marketing/revision`, incluidos los detalles.
- Conservar las cuatro pantallas duplicadas de Catalyst en `/marketing/catalyst`, `/marketing/catalyst/clientes`, `/marketing/catalyst/productos` y `/marketing/catalyst/campanas`.
- Incorporar sus pantallas operativas en `/marketing/secuencias`, `/marketing/envios`, `/marketing/bandeja-entrada`, `/marketing/bandeja-salida`, `/marketing/consentimientos` y `/marketing/auditoria`.
- Dar compatibilidad a las direcciones operativas originales mediante redirecciones. Las direcciones duplicadas originales seguirán perteneciendo a Flow; Catalyst tendrá direcciones explícitas propias.
- Unificar el menú con grupos Marketing Flow y Marketing Catalyst, navegación móvil y flecha de volver en todas las pantallas. Conservar las estructuras internas y hacer únicamente los ajustes visuales mínimos necesarios.

## 2. Datos temporales y contratos
- Conservar los datos ficticios de ambos proyectos, sin unir contactos por coincidencias de nombre o identificador.
- Mantener los estados durante la navegación de la sesión mediante proveedores compartidos y adaptadores temporales.
- Desactivar las lecturas/escrituras externas para esta demostración, conservando el código de conexión para una fase posterior. No ampliar la persistencia existente de productos en el navegador.
- Crear interfaces reemplazables para clientes, productos, campañas, mensajes, secuencias, envíos, respuestas, consentimiento y auditoría.
- Documentar equivalencias con el futuro CRM e Idea Navigator. Los campos que no existan permanecerán opcionales; no se inventarán evidencias ni autorizaciones.

## 3. Enlaces funcionales entre áreas
- Añadir accesos desde la campaña Flow a sus mensajes, secuencia, envíos, respuestas, consentimiento y auditoría, con regreso a la campaña de origen.
- Utilizar correspondencias explícitas y datos temporales para trasladar el contexto producto → campaña → secuencia → mensaje → revisión → envío → respuesta.
- Preservar cada pantalla Catalyst y sus operaciones: edición de pasos, actualización de envíos, clasificación de entradas, generación/edición de borradores, revisión, opt-in y bajas.
- Mantener las IA, conectores y envíos simulados, sin introducir proveedores reales.

## 4. Cumplimiento y auditoría
- Preservar los estados distinguibles de consentimiento, incluida ausencia, revocación, baja y pendiente; no reducirlos a booleanos.
- Mantener revisión humana, aprobación de campaña, autorización por canal, base jurídica, mecanismo de baja y bloqueo por riesgo legal.
- Aplicar los controles existentes también a los nuevos enlaces entre áreas para evitar que una ruta alternativa permita eludirlos.
- Conservar límites y advertencias existentes: la advertencia de frecuencia de Catalyst no se convertirá en una nueva regla bloqueante.
- Registrar temporalmente acciones, revisiones, opt-in, bajas, revocaciones y bloqueos, con valores anteriores/nuevos y contexto, sin perder historiales existentes.

## 5. Pruebas y entrega
- Añadir pruebas pequeñas de reglas concretas: sin consentimiento, baja, revocación, revisión pendiente, riesgo alto y campaña no aprobada; comprobar los registros correspondientes.
- Recorrer en navegador las pantallas y acciones originales de ambas áreas.
- Verificar un recorrido completo campaña → mensajes → secuencia → envío/respuesta → consentimiento/auditoría → campaña, manteniendo cambios durante la sesión.
- Comprobar escritorio, tablet y móvil, incluido el menú de detalle de campaña sin desplazamiento horizontal.
- Informar de cualquier función bloqueada o no comprobada y de los puntos preparados para futuras integraciones.

## Detalles técnicos
- Mantener las versiones TanStack del proyecto destino y su estructura de rutas; no importar el arranque ni los archivos generados del repositorio fuente.
- Separar módulos Flow y Catalyst y reutilizar el AppShell y los controles existentes cuando sean equivalentes.
- Sustituir las lecturas de arrays globales mutables de Catalyst por un repositorio de sesión para que los controles consulten el estado actualizado sin compartir mutaciones entre peticiones.
- Mantener nombres e identificadores de origen con un espacio de nombres explícito. Documentar inventario, equivalencias y contratos; añadir metadatos propios a cada página.
- No importar credenciales ni instrucciones del repositorio; no ejecutar sus scripts de instalación como parte de la inspección.

## Límites de esta fase
**Tablas creadas: 0**  
**Migraciones creadas: 0**  
**Cambios de esquema Supabase: 0**  
**Secretos añadidos: 0**  
**Proveedores externos conectados: 0**

Sin autenticación nueva, migración de datos reales, base común, API Gatekeeper ni Service Hub. La conexión futura seguirá pendiente; esta entrega será una integración funcional de demostración, no un sistema de envíos reales.