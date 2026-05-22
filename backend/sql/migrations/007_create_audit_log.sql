DECLARE
  table_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO table_count
  FROM user_tables
  WHERE table_name = 'AUDIT_LOG';

  IF table_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE TABLE AUDIT_LOG (
        ID_AUDIT NUMBER NOT NULL,
        EVENT_TIME DATE DEFAULT SYSDATE NOT NULL,
        TABLE_NAME VARCHAR2(60) NOT NULL,
        OPERATION VARCHAR2(10) NOT NULL,
        ENTITY_KEY VARCHAR2(200),
        DETAILS CLOB,
        DB_USER VARCHAR2(100)
      )
    ]';
  END IF;
END;
/

DECLARE
  sequence_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO sequence_count
  FROM user_sequences
  WHERE sequence_name = 'AUDIT_LOG_SEQ';

  IF sequence_count = 0 THEN
    EXECUTE IMMEDIATE 'CREATE SEQUENCE AUDIT_LOG_SEQ START WITH 1 INCREMENT BY 1 NOCACHE';
  END IF;
END;
/

DECLARE
  constraint_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO constraint_count
  FROM user_constraints
  WHERE table_name = 'AUDIT_LOG'
    AND constraint_name = 'PK_AUDIT_LOG';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE AUDIT_LOG
      ADD CONSTRAINT PK_AUDIT_LOG PRIMARY KEY (ID_AUDIT)
    ]';
  END IF;
END;
/

DECLARE
  trigger_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO trigger_count
  FROM user_triggers
  WHERE trigger_name = 'TRG_AUDIT_PRIJAVA';

  IF trigger_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE OR REPLACE TRIGGER TRG_AUDIT_PRIJAVA
      AFTER INSERT OR UPDATE OR DELETE ON PRIJAVA
      FOR EACH ROW
      BEGIN
        INSERT INTO AUDIT_LOG (
          ID_AUDIT,
          EVENT_TIME,
          TABLE_NAME,
          OPERATION,
          ENTITY_KEY,
          DETAILS,
          DB_USER
        )
        VALUES (
          AUDIT_LOG_SEQ.NEXTVAL,
          SYSDATE,
          'PRIJAVA',
          CASE
            WHEN INSERTING THEN 'INSERT'
            WHEN UPDATING THEN 'UPDATE'
            ELSE 'DELETE'
          END,
          CASE
            WHEN INSERTING OR UPDATING THEN TO_CHAR(:NEW.BROJ_PRIJAVE) || '/' || :NEW.SKOLSKA_GODINA
            ELSE TO_CHAR(:OLD.BROJ_PRIJAVE) || '/' || :OLD.SKOLSKA_GODINA
          END,
          CASE
            WHEN INSERTING THEN 'status=' || NVL(:NEW.STATUS_PRIJAVE, 'NULL')
            WHEN UPDATING THEN 'status:' || NVL(:OLD.STATUS_PRIJAVE, 'NULL') || '->' || NVL(:NEW.STATUS_PRIJAVE, 'NULL')
            ELSE 'status=' || NVL(:OLD.STATUS_PRIJAVE, 'NULL')
          END,
          USER
        );
      END;
    ]';
  END IF;
END;
/

DECLARE
  trigger_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO trigger_count
  FROM user_triggers
  WHERE trigger_name = 'TRG_AUDIT_KANDIDAT';

  IF trigger_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE OR REPLACE TRIGGER TRG_AUDIT_KANDIDAT
      AFTER INSERT OR UPDATE OR DELETE ON KANDIDAT
      FOR EACH ROW
      BEGIN
        INSERT INTO AUDIT_LOG (
          ID_AUDIT,
          EVENT_TIME,
          TABLE_NAME,
          OPERATION,
          ENTITY_KEY,
          DETAILS,
          DB_USER
        )
        VALUES (
          AUDIT_LOG_SEQ.NEXTVAL,
          SYSDATE,
          'KANDIDAT',
          CASE
            WHEN INSERTING THEN 'INSERT'
            WHEN UPDATING THEN 'UPDATE'
            ELSE 'DELETE'
          END,
          CASE
            WHEN INSERTING OR UPDATING THEN :NEW.JMBG
            ELSE :OLD.JMBG
          END,
          CASE
            WHEN INSERTING THEN 'ime=' || NVL(:NEW.IME_PREZIME, 'NULL')
            WHEN UPDATING THEN 'ime:' || NVL(:OLD.IME_PREZIME, 'NULL') || '->' || NVL(:NEW.IME_PREZIME, 'NULL')
            ELSE 'ime=' || NVL(:OLD.IME_PREZIME, 'NULL')
          END,
          USER
        );
      END;
    ]';
  END IF;
END;
/

DECLARE
  trigger_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO trigger_count
  FROM user_triggers
  WHERE trigger_name = 'TRG_AUDIT_STAVKARANGLISTE';

  IF trigger_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE OR REPLACE TRIGGER TRG_AUDIT_STAVKARANGLISTE
      AFTER INSERT OR UPDATE OR DELETE ON STAVKARANGLISTE
      FOR EACH ROW
      BEGIN
        INSERT INTO AUDIT_LOG (
          ID_AUDIT,
          EVENT_TIME,
          TABLE_NAME,
          OPERATION,
          ENTITY_KEY,
          DETAILS,
          DB_USER
        )
        VALUES (
          AUDIT_LOG_SEQ.NEXTVAL,
          SYSDATE,
          'STAVKARANGLISTE',
          CASE
            WHEN INSERTING THEN 'INSERT'
            WHEN UPDATING THEN 'UPDATE'
            ELSE 'DELETE'
          END,
          CASE
            WHEN INSERTING OR UPDATING THEN TO_CHAR(:NEW.ID_STAVKE)
            ELSE TO_CHAR(:OLD.ID_STAVKE)
          END,
          CASE
            WHEN INSERTING THEN 'prijava=' || NVL(TO_CHAR(:NEW.BROJ_PRIJAVE), 'NULL') || ', status=' || NVL(:NEW.STATUS, 'NULL')
            WHEN UPDATING THEN 'status:' || NVL(:OLD.STATUS, 'NULL') || '->' || NVL(:NEW.STATUS, 'NULL')
            ELSE 'prijava=' || NVL(TO_CHAR(:OLD.BROJ_PRIJAVE), 'NULL') || ', status=' || NVL(:OLD.STATUS, 'NULL')
          END,
          USER
        );
      END;
    ]';
  END IF;
END;
/

DECLARE
  trigger_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO trigger_count
  FROM user_triggers
  WHERE trigger_name = 'TRG_AUDIT_KONACNARANGLISTA';

  IF trigger_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE OR REPLACE TRIGGER TRG_AUDIT_KONACNARANGLISTA
      AFTER INSERT OR UPDATE OR DELETE ON KONACNARANGLISTA
      FOR EACH ROW
      BEGIN
        INSERT INTO AUDIT_LOG (
          ID_AUDIT,
          EVENT_TIME,
          TABLE_NAME,
          OPERATION,
          ENTITY_KEY,
          DETAILS,
          DB_USER
        )
        VALUES (
          AUDIT_LOG_SEQ.NEXTVAL,
          SYSDATE,
          'KONACNARANGLISTA',
          CASE
            WHEN INSERTING THEN 'INSERT'
            WHEN UPDATING THEN 'UPDATE'
            ELSE 'DELETE'
          END,
          CASE
            WHEN INSERTING OR UPDATING THEN TO_CHAR(:NEW.ID_RANG_LISTE)
            ELSE TO_CHAR(:OLD.ID_RANG_LISTE)
          END,
          CASE
            WHEN INSERTING THEN 'program=' || NVL(TO_CHAR(:NEW.ID_PROGRAMA), 'NULL') || ', godina=' || NVL(:NEW.SKOLSKA_GODINA, 'NULL')
            WHEN UPDATING THEN 'broj_mesta:' || NVL(TO_CHAR(:OLD.BROJ_MESTA), 'NULL') || '->' || NVL(TO_CHAR(:NEW.BROJ_MESTA), 'NULL')
            ELSE 'program=' || NVL(TO_CHAR(:OLD.ID_PROGRAMA), 'NULL') || ', godina=' || NVL(:OLD.SKOLSKA_GODINA, 'NULL')
          END,
          USER
        );
      END;
    ]';
  END IF;
END;
/

DECLARE
  table_count NUMBER := 0;
  trigger_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO table_count
  FROM user_tables
  WHERE table_name = 'UPIS_FINALIZACIJA';

  IF table_count > 0 THEN
    SELECT COUNT(*)
    INTO trigger_count
    FROM user_triggers
    WHERE trigger_name = 'TRG_AUDIT_UPIS_FINALIZACIJA';

    IF trigger_count = 0 THEN
      EXECUTE IMMEDIATE q'[
        CREATE OR REPLACE TRIGGER TRG_AUDIT_UPIS_FINALIZACIJA
        AFTER INSERT OR UPDATE OR DELETE ON UPIS_FINALIZACIJA
        FOR EACH ROW
        BEGIN
          INSERT INTO AUDIT_LOG (
            ID_AUDIT,
            EVENT_TIME,
            TABLE_NAME,
            OPERATION,
            ENTITY_KEY,
            DETAILS,
            DB_USER
          )
          VALUES (
            AUDIT_LOG_SEQ.NEXTVAL,
            SYSDATE,
            'UPIS_FINALIZACIJA',
            CASE
              WHEN INSERTING THEN 'INSERT'
              WHEN UPDATING THEN 'UPDATE'
              ELSE 'DELETE'
            END,
            CASE
              WHEN INSERTING OR UPDATING THEN TO_CHAR(:NEW.ID_UPISA)
              ELSE TO_CHAR(:OLD.ID_UPISA)
            END,
            CASE
              WHEN INSERTING THEN 'status=' || NVL(:NEW.STATUS_UPISA, 'NULL')
              WHEN UPDATING THEN 'status:' || NVL(:OLD.STATUS_UPISA, 'NULL') || '->' || NVL(:NEW.STATUS_UPISA, 'NULL') || ', indeks=' || NVL(:NEW.BROJ_INDEKSA, 'NULL')
              ELSE 'status=' || NVL(:OLD.STATUS_UPISA, 'NULL')
            END,
            USER
          );
        END;
      ]';
    END IF;
  END IF;
END;
/

COMMENT ON TABLE AUDIT_LOG IS 'Centralizovan audit log aktivnosti nad kljucnim tabelama sistema';
COMMENT ON COLUMN AUDIT_LOG.ENTITY_KEY IS 'Primarni kljuc ili identifikator entiteta na kome je izvrsena akcija';

-- Corrected trigger definitions (CREATE OR REPLACE) to ensure successful compilation.
CREATE OR REPLACE TRIGGER TRG_AUDIT_PRIJAVA
AFTER INSERT OR UPDATE OR DELETE ON PRIJAVA
FOR EACH ROW
DECLARE
  v_operation VARCHAR2(10);
  v_entity_key VARCHAR2(200);
  v_details CLOB;
BEGIN
  IF INSERTING THEN
    v_operation := 'INSERT';
    v_entity_key := TO_CHAR(:NEW.BROJ_PRIJAVE) || '/' || :NEW.SKOLSKA_GODINA;
    v_details := 'status=' || NVL(:NEW.STATUS_PRIJAVE, 'NULL');
  ELSIF UPDATING THEN
    v_operation := 'UPDATE';
    v_entity_key := TO_CHAR(:NEW.BROJ_PRIJAVE) || '/' || :NEW.SKOLSKA_GODINA;
    v_details := 'status:' || NVL(:OLD.STATUS_PRIJAVE, 'NULL') || '->' || NVL(:NEW.STATUS_PRIJAVE, 'NULL');
  ELSE
    v_operation := 'DELETE';
    v_entity_key := TO_CHAR(:OLD.BROJ_PRIJAVE) || '/' || :OLD.SKOLSKA_GODINA;
    v_details := 'status=' || NVL(:OLD.STATUS_PRIJAVE, 'NULL');
  END IF;

  INSERT INTO AUDIT_LOG (ID_AUDIT, EVENT_TIME, TABLE_NAME, OPERATION, ENTITY_KEY, DETAILS, DB_USER)
  VALUES (AUDIT_LOG_SEQ.NEXTVAL, SYSDATE, 'PRIJAVA', v_operation, v_entity_key, v_details, USER);
END;
/

CREATE OR REPLACE TRIGGER TRG_AUDIT_KANDIDAT
AFTER INSERT OR UPDATE OR DELETE ON KANDIDAT
FOR EACH ROW
DECLARE
  v_operation VARCHAR2(10);
  v_entity_key VARCHAR2(200);
  v_details CLOB;
BEGIN
  IF INSERTING THEN
    v_operation := 'INSERT';
    v_entity_key := :NEW.JMBG;
    v_details := 'ime=' || NVL(:NEW.IME_PREZIME, 'NULL');
  ELSIF UPDATING THEN
    v_operation := 'UPDATE';
    v_entity_key := :NEW.JMBG;
    v_details := 'ime:' || NVL(:OLD.IME_PREZIME, 'NULL') || '->' || NVL(:NEW.IME_PREZIME, 'NULL');
  ELSE
    v_operation := 'DELETE';
    v_entity_key := :OLD.JMBG;
    v_details := 'ime=' || NVL(:OLD.IME_PREZIME, 'NULL');
  END IF;

  INSERT INTO AUDIT_LOG (ID_AUDIT, EVENT_TIME, TABLE_NAME, OPERATION, ENTITY_KEY, DETAILS, DB_USER)
  VALUES (AUDIT_LOG_SEQ.NEXTVAL, SYSDATE, 'KANDIDAT', v_operation, v_entity_key, v_details, USER);
END;
/

CREATE OR REPLACE TRIGGER TRG_AUDIT_STAVKARANGLISTE
AFTER INSERT OR UPDATE OR DELETE ON STAVKARANGLISTE
FOR EACH ROW
DECLARE
  v_operation VARCHAR2(10);
  v_entity_key VARCHAR2(200);
  v_details CLOB;
BEGIN
  IF INSERTING THEN
    v_operation := 'INSERT';
    v_entity_key := TO_CHAR(:NEW.ID_STAVKE);
    v_details := 'prijava=' || NVL(TO_CHAR(:NEW.BROJ_PRIJAVE), 'NULL') || ', status=' || NVL(:NEW.STATUS, 'NULL');
  ELSIF UPDATING THEN
    v_operation := 'UPDATE';
    v_entity_key := TO_CHAR(:NEW.ID_STAVKE);
    v_details := 'status:' || NVL(:OLD.STATUS, 'NULL') || '->' || NVL(:NEW.STATUS, 'NULL');
  ELSE
    v_operation := 'DELETE';
    v_entity_key := TO_CHAR(:OLD.ID_STAVKE);
    v_details := 'prijava=' || NVL(TO_CHAR(:OLD.BROJ_PRIJAVE), 'NULL') || ', status=' || NVL(:OLD.STATUS, 'NULL');
  END IF;

  INSERT INTO AUDIT_LOG (ID_AUDIT, EVENT_TIME, TABLE_NAME, OPERATION, ENTITY_KEY, DETAILS, DB_USER)
  VALUES (AUDIT_LOG_SEQ.NEXTVAL, SYSDATE, 'STAVKARANGLISTE', v_operation, v_entity_key, v_details, USER);
END;
/

CREATE OR REPLACE TRIGGER TRG_AUDIT_KONACNARANGLISTA
AFTER INSERT OR UPDATE OR DELETE ON KONACNARANGLISTA
FOR EACH ROW
DECLARE
  v_operation VARCHAR2(10);
  v_entity_key VARCHAR2(200);
  v_details CLOB;
BEGIN
  IF INSERTING THEN
    v_operation := 'INSERT';
    v_entity_key := TO_CHAR(:NEW.ID_RANG_LISTE);
    v_details := 'program=' || NVL(TO_CHAR(:NEW.ID_PROGRAMA), 'NULL') || ', godina=' || NVL(:NEW.SKOLSKA_GODINA, 'NULL');
  ELSIF UPDATING THEN
    v_operation := 'UPDATE';
    v_entity_key := TO_CHAR(:NEW.ID_RANG_LISTE);
    v_details := 'broj_mesta:' || NVL(TO_CHAR(:OLD.BROJ_MESTA), 'NULL') || '->' || NVL(TO_CHAR(:NEW.BROJ_MESTA), 'NULL');
  ELSE
    v_operation := 'DELETE';
    v_entity_key := TO_CHAR(:OLD.ID_RANG_LISTE);
    v_details := 'program=' || NVL(TO_CHAR(:OLD.ID_PROGRAMA), 'NULL') || ', godina=' || NVL(:OLD.SKOLSKA_GODINA, 'NULL');
  END IF;

  INSERT INTO AUDIT_LOG (ID_AUDIT, EVENT_TIME, TABLE_NAME, OPERATION, ENTITY_KEY, DETAILS, DB_USER)
  VALUES (AUDIT_LOG_SEQ.NEXTVAL, SYSDATE, 'KONACNARANGLISTA', v_operation, v_entity_key, v_details, USER);
END;
/

DECLARE
  table_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO table_count
  FROM user_tables
  WHERE table_name = 'UPIS_FINALIZACIJA';

  IF table_count > 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE OR REPLACE TRIGGER TRG_AUDIT_UPIS_FINALIZACIJA
      AFTER INSERT OR UPDATE OR DELETE ON UPIS_FINALIZACIJA
      FOR EACH ROW
      DECLARE
        v_operation VARCHAR2(10);
        v_entity_key VARCHAR2(200);
        v_details CLOB;
      BEGIN
        IF INSERTING THEN
          v_operation := 'INSERT';
          v_entity_key := TO_CHAR(:NEW.ID_UPISA);
          v_details := 'status=' || NVL(:NEW.STATUS_UPISA, 'NULL');
        ELSIF UPDATING THEN
          v_operation := 'UPDATE';
          v_entity_key := TO_CHAR(:NEW.ID_UPISA);
          v_details := 'status:' || NVL(:OLD.STATUS_UPISA, 'NULL') || '->' || NVL(:NEW.STATUS_UPISA, 'NULL') || ', indeks=' || NVL(:NEW.BROJ_INDEKSA, 'NULL');
        ELSE
          v_operation := 'DELETE';
          v_entity_key := TO_CHAR(:OLD.ID_UPISA);
          v_details := 'status=' || NVL(:OLD.STATUS_UPISA, 'NULL');
        END IF;

        INSERT INTO AUDIT_LOG (ID_AUDIT, EVENT_TIME, TABLE_NAME, OPERATION, ENTITY_KEY, DETAILS, DB_USER)
        VALUES (AUDIT_LOG_SEQ.NEXTVAL, SYSDATE, 'UPIS_FINALIZACIJA', v_operation, v_entity_key, v_details, USER);
      END;
    ]';
  END IF;
END;
/
