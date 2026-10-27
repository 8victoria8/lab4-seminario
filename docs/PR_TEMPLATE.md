<!--
Plantilla de Pull Request del laboratorio.
Copia todo lo que está debajo de la línea en la descripción de tu PR y complétalo.
Tip: si la copias a .github/pull_request_template.md, GitHub la cargará automáticamente en cada PR nuevo.
-->

---

## Descripción del cambio

**Tipo de cambio:** ☐ Refactorización (sin cambio de comportamiento) ☐ Corrección de error ☐ Nueva funcionalidad ☐ Solo pruebas / documentación

**¿Qué cambia y por qué?**
<!-- 2-4 líneas. Ej.: "Divido calculatePricing() en calculateSubtotal, calculateDiscount, calculateShipping y calculateTotal para reducir la complejidad." -->

**Archivos modificados**
<!-- Pega la salida de `git diff --stat origin/main` -->
```
```

**¿Cambia el comportamiento observable?** ☐ No ☐ Sí → explica y actualiza los criterios de aceptación.

## Criterios de aceptación

<!-- Marca los criterios de docs/ACCEPTANCE_CRITERIA.md que este cambio toca o que debe seguir cumpliendo. -->

- [ ] AC-05 · Cupón SAVE10 (2 Laptop Sleeve → total $59.00)
- [ ] AC-07 · Cupón FREESHIP
- [ ] AC-08 · No combinar cupones
- [ ] AC-09 · Envío gratis desde $100.00 (valor límite)
- [ ] AC-10 · El umbral se evalúa después del descuento
- [ ] AC-11 · Redondeo del descuento
- [ ] Otros: ______

## Pruebas ejecutadas

| Comando | Ejecutado | Resultado |
|---|---|---|
| `npm run typecheck` | ☐ | |
| `npm run lint` | ☐ | |
| `npm run test:unit` | ☐ | ___ / 15 |
| `npm run test:e2e` | ☐ | ___ / 12 |
| CI (GitHub Actions) | ☐ | <!-- enlace a la ejecución --> |

- [ ] **No modifiqué ninguna prueba existente** (`git diff --stat origin/main -- tests` está vacío)
- [ ] Si agregué pruebas nuevas, las listo aquí: ______

## Resultados

<!-- Antes / después. Ej.: -->

| Métrica | Antes | Después |
|---|---|---|
| Pruebas unitarias | 15 ✅ | 15 ✅ |
| Pruebas E2E | 12 ✅ | 12 ✅ |
| Avisos de `npm run lint` | | |
| Complejidad de la función principal | | |

## Evidencia E2E

- [ ] Captura del reporte HTML de Playwright (`npm run test:e2e:report`) con todas las pruebas en verde
- [ ] Enlace al artefacto `playwright-report` de la ejecución de CI: <!-- URL -->
- [ ] (Si hubo un fallo que corregí) Captura del trace o screenshot del fallo y de la corrección

## Capturas o enlaces a reportes

<!-- Arrastra aquí tus imágenes o pega los enlaces. -->

## Riesgos conocidos

<!--
- ¿Qué podría salir mal con este cambio?
- ¿Qué NO cubren las pruebas actuales? (ej.: fracciones de centavo en E2E, concurrencia, otros navegadores)
- ¿Cómo se mitiga o se revertiría?
-->

## Lista de verificación final

- [ ] El PR contiene solo cambios relacionados con su objetivo
- [ ] La rama está actualizada con `main`
- [ ] Todos los checks de CI están en verde
