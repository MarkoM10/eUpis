DECLARE
  table_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO table_count
  FROM user_tables
  WHERE table_name = 'KONKURSZAMASTERSTUDIJE';

  IF table_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE TABLE KONKURSZAMASTERSTUDIJE (
        ID_KONKURSA NUMBER NOT NULL,
        SKOLSKA_GODINA VARCHAR2(20) NOT NULL,
        KONKURSNI_ROK VARCHAR2(80) NOT NULL,
        DATUM_OD DATE NOT NULL,
        DATUM_DO DATE NOT NULL,
        STATUS VARCHAR2(30) NOT NULL,
        CREATED_BY NUMBER,
        CREATED_AT DATE DEFAULT SYSDATE NOT NULL
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
  WHERE table_name = 'KONKURSZAMASTERSTUDIJE'
    AND constraint_name = 'PK_KONKURS_MASTER';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE KONKURSZAMASTERSTUDIJE
      ADD CONSTRAINT PK_KONKURS_MASTER PRIMARY KEY (ID_KONKURSA)
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
  WHERE table_name = 'KONKURSZAMASTERSTUDIJE'
    AND constraint_name = 'CK_KONKURS_MASTER_STATUS';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE KONKURSZAMASTERSTUDIJE
      ADD CONSTRAINT CK_KONKURS_MASTER_STATUS
      CHECK (STATUS IN ('Nacrt', 'Aktivan', 'Zatvoren', 'Arhiviran'))
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
  WHERE table_name = 'KONKURSZAMASTERSTUDIJE'
    AND constraint_name = 'CK_KONKURS_MASTER_DATUM';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE KONKURSZAMASTERSTUDIJE
      ADD CONSTRAINT CK_KONKURS_MASTER_DATUM
      CHECK (DATUM_OD <= DATUM_DO)
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
  WHERE table_name = 'KONKURSZAMASTERSTUDIJE'
    AND constraint_name = 'FK_KONKURS_MASTER_ADMIN';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE KONKURSZAMASTERSTUDIJE
      ADD CONSTRAINT FK_KONKURS_MASTER_ADMIN
      FOREIGN KEY (CREATED_BY)
      REFERENCES KORISNICI (ID_KORISNIKA)
    ]';
  END IF;
END;
/

DECLARE
  table_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO table_count
  FROM user_tables
  WHERE table_name = 'KONKURSSTAVKA';

  IF table_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE TABLE KONKURSSTAVKA (
        ID_STAVKE_KONKURSA NUMBER NOT NULL,
        ID_KONKURSA NUMBER NOT NULL,
        ID_PROGRAMA NUMBER NOT NULL,
        BROJ_DOSTUPNIH_MESTA NUMBER NOT NULL
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
  WHERE table_name = 'KONKURSSTAVKA'
    AND constraint_name = 'PK_KONKURS_STAVKA';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE KONKURSSTAVKA
      ADD CONSTRAINT PK_KONKURS_STAVKA PRIMARY KEY (ID_STAVKE_KONKURSA)
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
  WHERE table_name = 'KONKURSSTAVKA'
    AND constraint_name = 'FK_KONKURS_STAVKA_KONKURS';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE KONKURSSTAVKA
      ADD CONSTRAINT FK_KONKURS_STAVKA_KONKURS
      FOREIGN KEY (ID_KONKURSA)
      REFERENCES KONKURSZAMASTERSTUDIJE (ID_KONKURSA)
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
  WHERE table_name = 'KONKURSSTAVKA'
    AND constraint_name = 'FK_KONKURS_STAVKA_PROGRAM';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE KONKURSSTAVKA
      ADD CONSTRAINT FK_KONKURS_STAVKA_PROGRAM
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
  WHERE table_name = 'KONKURSSTAVKA'
    AND constraint_name = 'CK_KONKURS_STAVKA_MESTA';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE KONKURSSTAVKA
      ADD CONSTRAINT CK_KONKURS_STAVKA_MESTA
      CHECK (BROJ_DOSTUPNIH_MESTA >= 0)
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
  WHERE table_name = 'KONKURSSTAVKA'
    AND constraint_name = 'UQ_KONKURS_STAVKA_PROGRAM';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE KONKURSSTAVKA
      ADD CONSTRAINT UQ_KONKURS_STAVKA_PROGRAM UNIQUE (ID_KONKURSA, ID_PROGRAMA)
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
  WHERE table_name = 'PRIJAVA'
    AND column_name = 'ID_KONKURSA';

  IF column_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE PRIJAVA ADD (ID_KONKURSA NUMBER)
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
  WHERE table_name = 'PRIJAVA'
    AND constraint_name = 'FK_PRIJAVA_KONKURS';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE PRIJAVA
      ADD CONSTRAINT FK_PRIJAVA_KONKURS
      FOREIGN KEY (ID_KONKURSA)
      REFERENCES KONKURSZAMASTERSTUDIJE (ID_KONKURSA)
    ]';
  END IF;
END;
/

DECLARE
  index_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO index_count
  FROM user_indexes
  WHERE table_name = 'PRIJAVA'
    AND index_name = 'IDX_PRIJAVA_ID_KONKURSA';

  IF index_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE INDEX IDX_PRIJAVA_ID_KONKURSA ON PRIJAVA (ID_KONKURSA)
    ]';
  END IF;
END;
/

COMMENT ON TABLE KONKURSZAMASTERSTUDIJE IS 'Konkurs za upis na master akademske studije';
COMMENT ON TABLE KONKURSSTAVKA IS 'Programi i moduli sa brojem mesta u okviru konkursa';
COMMENT ON COLUMN PRIJAVA.ID_KONKURSA IS 'Konkurs na koji je prijava podneta';
