const axios = require('axios');
const payload = {
  "comercializadora_id": "eafc46ec-acc9-47e4-b03a-4608f5c32b69",
  "comercializadora_nombre": "Loviluz Energia",
  "producto_id": "3f39b271-ff0d-4dfe-9e2a-c9d196fe7fc1",
  "producto_nombre": "Lov TOO V 1",
  "tarifa_acceso": "2.0TD",
  "suministro": "Luz",
  "tipo_alta": "Nueva",
  "cambio_titular": false,
  "cambio_potencia": false,
  "consumo_anual": 2977,
  "p1": 5.5,
  "p2": 5.5,
  "p3": 5.5,
  "p4": 5.5,
  "p5": 5.5,
  "p6": 5.5,
  "potencia_max": 5.5,
  "codigo_comercial": 9999
};
axios.post('https://crm-vivivan.onrender.com/api/comisiones/calcular', payload)
  .then(res => console.log(JSON.stringify(res.data, null, 2)))
  .catch(err => console.log(err.response ? JSON.stringify(err.response.data, null, 2) : err.message));
