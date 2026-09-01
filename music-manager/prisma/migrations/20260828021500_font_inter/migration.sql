-- La opción "Geist — la de la app" dejó de ser cierta: el cuerpo de la app
-- pasó a Inter. Los kits que la tuvieran guardada apuntarían a un id que ya
-- no existe, y toda búsqueda por id caería a la primera opción sin avisar.
UPDATE "BrandKit" SET "fontFamily" = 'inter' WHERE "fontFamily" = 'geist';

-- Saneado: durante un tiempo la acción de guardar escribía el literal 'Anton'
-- (con mayúscula) cuando el formulario llegaba sin el campo, y ningún id lo
-- lleva. Esas filas quedaban rotas de forma silenciosa.
UPDATE "BrandKit" SET "fontFamily" = 'anton' WHERE "fontFamily" = 'Anton';
