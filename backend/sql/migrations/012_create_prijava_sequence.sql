DECLARE
  sequence_count NUMBER := 0;
  start_with_value NUMBER := 1;
BEGIN
  SELECT COUNT(*)
  INTO sequence_count
  FROM user_sequences
  WHERE sequence_name = 'PRIJAVA_BROJ_PRIJAVE_SEQ';

  IF sequence_count = 0 THEN
    SELECT NVL(MAX(p.BROJ_PRIJAVE), 0) + 1
    INTO start_with_value
    FROM PRIJAVA p;

    EXECUTE IMMEDIATE
      'CREATE SEQUENCE PRIJAVA_BROJ_PRIJAVE_SEQ START WITH ' || start_with_value || ' INCREMENT BY 1 NOCACHE';
  END IF;
END;
/
