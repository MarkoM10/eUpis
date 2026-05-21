DECLARE
  duplicate_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO duplicate_count
  FROM (
    SELECT kr.ID_PROGRAMA, kr.SKOLSKA_GODINA
    FROM KONACNARANGLISTA kr
    GROUP BY kr.ID_PROGRAMA, kr.SKOLSKA_GODINA
    HAVING COUNT(*) > 1
  );

  IF duplicate_count > 0 THEN
    RAISE_APPLICATION_ERROR(
      -20005,
      'Postoje duplikati u KONACNARANGLISTA za isti studijski program i skolsku godinu.'
    );
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
    AND constraint_name = 'UQ_KON_RANG_LISTA_PROGRAM_GOD';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE KONACNARANGLISTA
      ADD CONSTRAINT UQ_KON_RANG_LISTA_PROGRAM_GOD
      UNIQUE (ID_PROGRAMA, SKOLSKA_GODINA)
    ]';
  END IF;
END;
/