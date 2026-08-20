# Alerta de Terremotos

Aplicación web (HTML/CSS/JS puro, sin backend ni dependencias) que monitorea
la actividad sísmica cerca de tu ubicación usando los feeds públicos GeoJSON
del [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/earthquakes/feed/)
y te avisa cuando ocurre un sismo dentro del radio y magnitud que definas.

## Uso

No requiere instalación ni build. Basta con servir la carpeta como archivos
estáticos, por ejemplo:

```bash
cd earthquake-alert
python3 -m http.server 8000
```

Y abrir `http://localhost:8000` en el navegador. También puede abrirse
`index.html` directamente con doble clic en la mayoría de navegadores.

## Cómo funciona

1. **Ubicación**: usa el GPS del navegador o coordenadas manuales (lat/lon).
2. **Preferencias**: define el radio de vigilancia (km), la magnitud mínima
   que dispara una alerta, la ventana de datos consultada (última hora, día
   o semana) y cada cuánto se revisa.
3. **Monitoreo**: al iniciar, consulta periódicamente el feed GeoJSON del
   USGS, calcula la distancia (fórmula de Haversine) entre cada sismo y tu
   ubicación, y muestra los que caen dentro del radio configurado.
4. **Alertas**: cuando aparece un sismo nuevo que cumple el umbral de
   magnitud, se muestra un banner, se reproduce un sonido y (si diste
   permiso) se dispara una notificación del navegador. Los sismos ya vistos
   no vuelven a generar alerta repetida.

## Limitaciones

- Funciona mientras la pestaña del navegador esté abierta (no hay
  notificaciones push en segundo plano; se podría añadir un Service Worker
  + servidor push como mejora futura).
- Depende de la disponibilidad y cobertura del feed público del USGS, que
  cubre sismos a nivel mundial pero puede tener algunos segundos/minutos de
  retraso respecto al evento real.
