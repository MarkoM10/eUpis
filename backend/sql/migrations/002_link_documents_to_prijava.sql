DECLARE
  column_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO column_count
  FROM user_tab_columns
  WHERE table_name = 'DIPLOMA'
    AND column_name = 'BROJ_PRIJAVE';

  IF column_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE DIPLOMA ADD (
        BROJ_PRIJAVE NUMBER,
        SKOLSKA_GODINA VARCHAR2(10)
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
  WHERE table_name = 'UVERENJEOPOLOZENIMPREDMETIMA'
    AND column_name = 'BROJ_PRIJAVE';

  IF column_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE UVERENJEOPOLOZENIMPREDMETIMA ADD (
        BROJ_PRIJAVE NUMBER,
        SKOLSKA_GODINA VARCHAR2(10)
      )
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
  WHERE table_name = 'DIPLOMA'
    AND constraint_name = 'FK_DIPLOMA_PRIJAVA';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE DIPLOMA
      ADD CONSTRAINT FK_DIPLOMA_PRIJAVA
      FOREIGN KEY (BROJ_PRIJAVE, SKOLSKA_GODINA)
      REFERENCES PRIJAVA (BROJ_PRIJAVE, SKOLSKA_GODINA)
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
  WHERE table_name = 'UVERENJEOPOLOZENIMPREDMETIMA'
    AND constraint_name = 'FK_UVERENJE_PRIJAVA';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE UVERENJEOPOLOZENIMPREDMETIMA
      ADD CONSTRAINT FK_UVERENJE_PRIJAVA
      FOREIGN KEY (BROJ_PRIJAVE, SKOLSKA_GODINA)
      REFERENCES PRIJAVA (BROJ_PRIJAVE, SKOLSKA_GODINA)
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
  WHERE table_name = 'DIPLOMA'
    AND constraint_name = 'UQ_DIPLOMA_PRIJAVA';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE DIPLOMA
      ADD CONSTRAINT UQ_DIPLOMA_PRIJAVA UNIQUE (BROJ_PRIJAVE, SKOLSKA_GODINA)
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
  WHERE table_name = 'UVERENJEOPOLOZENIMPREDMETIMA'
    AND constraint_name = 'UQ_UVERENJE_PRIJAVA';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE UVERENJEOPOLOZENIMPREDMETIMA
      ADD CONSTRAINT UQ_UVERENJE_PRIJAVA UNIQUE (BROJ_PRIJAVE, SKOLSKA_GODINA)
    ]';
  END IF;
END;
/

COMMENT ON COLUMN DIPLOMA.BROJ_PRIJAVE IS 'Broj prijave kojoj dokument pripada';
COMMENT ON COLUMN DIPLOMA.SKOLSKA_GODINA IS 'Skolska godina prijave kojoj dokument pripada';
COMMENT ON COLUMN UVERENJEOPOLOZENIMPREDMETIMA.BROJ_PRIJAVE IS 'Broj prijave kojoj dokument pripada';
COMMENT ON COLUMN UVERENJEOPOLOZENIMPREDMETIMA.SKOLSKA_GODINA IS 'Skolska godina prijave kojoj dokument pripada';
