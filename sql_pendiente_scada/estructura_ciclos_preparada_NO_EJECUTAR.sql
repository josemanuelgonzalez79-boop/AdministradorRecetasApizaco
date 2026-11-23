-- BORRADOR PARA LA FUTURA ACTUALIZACIÓN DEL SCADA.
-- No se instala automáticamente en este avance y no debe ejecutarse en producción
-- sin antes definir cómo se registran cada ciclo, transferencia y unidad.
-- La tabla complementa pb_recipes_progress sin cambiar su llave primaria.
-- Una duración/ciclo por evento podría no bastar si hay varios ciclos con
-- exactamente el mismo timestamp; validar con las rutinas del SCADA.
CREATE TABLE IF NOT EXISTS public.pb_recipes_progress_details (
  process_id integer NOT NULL,
  update_time timestamp without time zone NOT NULL,
  position integer NOT NULL,
  step integer NOT NULL,
  unit_name text,
  cycle_number integer,
  actual_water_kg double precision,
  meta_kg double precision,
  duration_seconds double precision,
  PRIMARY KEY (process_id, update_time, position, step),
  FOREIGN KEY (process_id, update_time, position, step)
    REFERENCES public.pb_recipes_progress(process_id, update_time, position, step),
  CHECK (cycle_number IS NULL OR cycle_number > 0),
  CHECK (actual_water_kg IS NULL OR actual_water_kg >= 0),
  CHECK (meta_kg IS NULL OR meta_kg >= 0),
  CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);
