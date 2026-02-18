# Integración API Dropi con NOMADEV

Referencia técnica de la API de Dropi para conectar nomadev.io (logística, órdenes, guías, productos).

## URLs base

| Entorno   | URL                    |
|----------|------------------------|
| Pruebas  | `https://test-api.dropi.co` |
| Producción | `https://api.dropi.co`   |

## Autenticación

- **Login:** `POST /api/login`
- **Cabeceras:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "usuario@gmail.com",
    "password": "clave",
    "white_brand_id": "df3e6b0bb66ceaadca4f84cbc371fd66e04d20fe51fc414da8d1b84d31d178de"
  }
  ```
- **Respuesta exitosa:** devuelve `token`. Usar en todas las peticiones:
  - **Cabecera:** `Authorization: Bearer TOKEN`
- **Token expirado:** respuesta `401`, body `{ "isSuccess": false, "message": "Token is Expired", "status": 401 }` → hay que hacer login de nuevo.

---

## Endpoints (todas requieren `Authorization: Bearer TOKEN`)

### Ubicación

| Servicio   | Método | Ruta                     | Descripción           |
|-----------|--------|--------------------------|------------------------|
| Departamentos | GET  | `/api/department`         | Lista de departamentos |
| Ciudades      | POST | `/api/trajectory/bycity` | Lista de ciudades. Body: `{ "department_id": int, "rate_type": "CON RECAUDO" \| "SIN RECAUDO" \| "" }` |

### Órdenes

| Servicio        | Método | Ruta                              | Notas |
|-----------------|--------|-----------------------------------|-------|
| Crear orden     | POST   | `/api/orders/myorders`           | Body: state, city, name, surname, dir, phone, payment_method_id: 1, rate_type, type: "FINAL_ORDER", total_order, products[] (id, price, quantity, variation_id opcional). Opcional: client_email, notes, distributionCompany.id, etc. |
| Orden por ID    | GET    | `/api/orders/myorders/{id}`       | ID = orden Dropi |
| Orden por guía  | GET    | `/api/orders/myorderbyguide/{guia}` | Número de guía |
| Listar órdenes  | GET    | `/api/orders/myorders`           | Query: result_number, start, textToSearch, from, untill (yyyy-mm-dd), radio_downloaded, orderBy, orderDirection, filter_by, value_filter_by, status, filter_date_by |
| Generar guía (una) | PUT  | `/api/orders/myorders/{id}`       | Body: `{ "status": "GUIA_GENERADA" }` |
| Generar guías (masivo) | POST | `/api/orders/myorder/masive`  | Body: `[{ "id": orderId, "status": "GUIA_GENERADA" }, ...]` |

### Guías PDF

- **Obtener PDF:** `GET /guias/{nombre_transportadora}/{sticker}`
- El campo `sticker` viene en el objeto de la orden.
- Ejemplos:
  - Servientrega/Envia: `https://api.dropi.co/guias/servientrega/{sticker}`
  - Otras: `https://api.dropi.co/guias/interrapidisimo/{sticker}`, `coordinadora`, `domina`, etc.

### Cartera y transportadoras

| Servicio           | Método | Ruta                           |
|--------------------|--------|--------------------------------|
| Historial cartera  | GET    | `/api/historywallet`           |
| Transportadoras   | GET    | `/api/distribution_companies`  |
| Cotizador flete   | POST   | `/api/orders/cotizaEnvioTransportadoraV2` | Body: `EnvioConCobro` (bool), `amount` (int), `ciudad_destino: { "cod_dane": "5001000" }`, `ciudad_remitente: { "cod_dane": "11001000" }` |

### Productos

| Servicio       | Método | Ruta                    |
|----------------|--------|-------------------------|
| Categorías     | GET    | `/api/categories`       |
| Crear producto | POST   | `/api/products`         |
| Listar productos | POST | `/api/products/index`   | Body: keywords, pageSize, startData, userVerified (opcionales) |
| Producto por ID | GET   | `/api/products/{id}`    |

### Tickets (soporte)

| Servicio           | Método | Ruta                                    |
|--------------------|--------|-----------------------------------------|
| Crear ticket       | POST   | `/api/tickets/createticket`             |
| Crear mensaje      | POST   | `/api/tickets/createconversationticket` |
| Ver conversación   | GET    | `/api/tickets/indexconversation?idSelect={ticket_id}` |
| Listar tickets     | GET    | `/api/tickets/indextickets`             |

### Novedades

- Listar pendientes: mismo GET `/api/orders/myorders` con `haveIncidenceProcesamiento: true`, `issue_solved_by_parent_order: false`.

---

## Cómo encajar en NOMADEV

1. **Tabla `integrations`:** usar `integration_type = 'dropi'`, guardar en `config` (opcional) `base_url` (test/prod) y en `credentials` (encriptado) `email`, `token` (y refrescar token cuando la API devuelva 401).
2. **Edge Function:** una función (ej. `dropi-api`) que reciba el `user_id`, lea la integración Dropi del usuario, use el token y reenvíe las peticiones a Dropi (login, órdenes, guías, etc.). En caso de 401, intentar re-login con email/password almacenados y actualizar token.
3. **Frontend:** pantalla “Conectar Dropi” (email + contraseña o solo token si Dropi lo permite) que guarde/actualice la fila en `integrations`.
4. **Variables de entorno:** por ejemplo `DROPI_WHITE_BRAND_ID` (el valor fijo del doc), y si se usa login desde backend, no guardar password en claro; preferible flujo donde el usuario introduce credenciales, se hace login una vez y se guarda solo el token (y renovar cuando expire).

---

## Ejemplo mínimo: crear orden

```json
POST /api/orders/myorders
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "calculate_costs_and_shiping": true,
  "state": "CUNDINAMARCA",
  "city": "BOGOTA",
  "name": "fernando",
  "surname": "perez",
  "dir": "cr 3 #2-09",
  "payment_method_id": 1,
  "phone": "313523645",
  "rate_type": "CON RECAUDO",
  "type": "FINAL_ORDER",
  "total_order": 260000,
  "products": [
    { "id": 1002, "price": 80000, "quantity": 2, "variation_id": null },
    { "id": 30100, "price": 50000, "quantity": 2, "variation_id": null }
  ]
}
```

Respuesta exitosa incluye `objects` con la orden (id, status, shipping_amount, etc.) y `wallets`.

---

*Documentación extraída del PDF oficial de Dropi. Para más detalle de parámetros y respuestas, consultar el documento original.*
