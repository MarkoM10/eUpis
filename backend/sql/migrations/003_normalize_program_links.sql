DECLARE
  column_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO column_count
  FROM user_tab_columns
  WHERE table_name = 'PRIJAVA'
    AND column_name = 'ID_PROGRAMA';

  IF column_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE PRIJAVA ADD (
        ID_PROGRAMA NUMBER
      )
    ]';
  END IF;
END;
/

DECLARE
  column_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO column_count
  FROM user_tab_columns
  WHERE table_name = 'KONACNARANGLISTA'
    AND column_name = 'ID_PROGRAMA';

  IF column_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE KONACNARANGLISTA ADD (
        ID_PROGRAMA NUMBER
      )
    ]';
  END IF;
END;
/

DECLARE
  column_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO column_count
  FROM user_tab_columns
  WHERE table_name = 'STAVKARANGLISTE'
    AND column_name = 'ID_PROGRAMA';

  IF column_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE STAVKARANGLISTE ADD (
        ID_PROGRAMA NUMBER
      )
    ]';
  END IF;
END;
/

UPDATE KONACNARANGLISTA kr
SET kr.ID_PROGRAMA = (
  SELECT MIN(sp.ID_PROGRAMA)
  FROM STUDIJSKIPROGRAM_VIEW sp
  WHERE (sp.NAZIV_PROGRAMA || ' | ' || sp.MODUL) = kr.STUDIJSKI_PROGRAM
)
WHERE kr.ID_PROGRAMA IS NULL
  AND kr.STUDIJSKI_PROGRAM IS NOT NULL;

UPDATE STAVKARANGLISTE s
SET s.ID_PROGRAMA = (
  SELECT kr.ID_PROGRAMA
  FROM KONACNARANGLISTA kr
  WHERE kr.ID_RANG_LISTE = s.ID_RANG_LISTE
)
WHERE s.ID_PROGRAMA IS NULL
  AND s.ID_RANG_LISTE IS NOT NULL;

DECLARE
  constraint_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO constraint_count
  FROM user_constraints
  WHERE table_name = 'PRIJAVA'
    AND constraint_name = 'FK_PRIJAVA_PROGRAM';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE PRIJAVA
      ADD CONSTRAINT FK_PRIJAVA_PROGRAM
      FOREIGN KEY (ID_PROGRAMA)
      REFERENCES STUDIJSKIPROGRAMGLAVNO (ID_PROGRAMA)
    ]';
  END IF;
END;
/

DECLARE
  constraint_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO constraint_count
  FROM user_constraints
  WHERE table_name = 'KONACNARANGLISTA'
    AND constraint_name = 'FK_RANGLISTA_PROGRAM';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE KONACNARANGLISTA
      ADD CONSTRAINT FK_RANGLISTA_PROGRAM
      FOREIGN KEY (ID_PROGRAMA)
      REFERENCES STUDIJSKIPROGRAMGLAVNO (ID_PROGRAMA)
    ]';
  END IF;
END;
/

DECLARE
  constraint_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO constraint_count
  FROM user_constraints
  WHERE table_name = 'STAVKARANGLISTE'
    AND constraint_name = 'FK_STAVKA_PROGRAM';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE STAVKARANGLISTE
      ADD CONSTRAINT FK_STAVKA_PROGRAM
      FOREIGN KEY (ID_PROGRAMA)
      REFERENCES STUDIJSKIPROGRAMGLAVNO (ID_PROGRAMA)
    ]';
  END IF;
END;
/

-- NOTE:
-- Unique constraint (ID_PROGRAMA, SKOLSKA_GODINA) is intentionally deferred.
-- Existing legacy rows may contain duplicates and must be cleaned first.

COMMENT ON COLUMN PRIJAVA.ID_PROGRAMA IS 'Izabrani studijski program/modul kandidata';
COMMENT ON COLUMN KONACNARANGLISTA.ID_PROGRAMA IS 'Program/modul za koji je rang lista formirana';
COMMENT ON COLUMN STAVKARANGLISTE.ID_PROGRAMA IS 'Program/modul po kome je kandidat rangiran';
