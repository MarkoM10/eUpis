DECLARE
  column_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO column_count
  FROM user_tab_columns
  WHERE table_name = 'KONKURSZAMASTERSTUDIJE'
    AND column_name = 'ID_FAKULTETA';

  IF column_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE KONKURSZAMASTERSTUDIJE ADD (ID_FAKULTETA NUMBER)
    ]';
  END IF;
END;
/

DECLARE
  ambiguous_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO ambiguous_count
  FROM (
    SELECT ks.ID_KONKURSA
    FROM KONKURSSTAVKA ks
    JOIN STUDIJSKIPROGRAMGLAVNO spg ON spg.ID_PROGRAMA = ks.ID_PROGRAMA
    JOIN KONKURSZAMASTERSTUDIJE k ON k.ID_KONKURSA = ks.ID_KONKURSA
    WHERE k.ID_FAKULTETA IS NULL
    GROUP BY ks.ID_KONKURSA
    HAVING COUNT(DISTINCT spg.ID_FAKULTETA) > 1
  );

  IF ambiguous_count > 0 THEN
    RAISE_APPLICATION_ERROR(
      -20001,
      'Migracija 011: postoje konkursi sa vise fakulteta po stavkama; rucno ispraviti podatke pre backfill-a ID_FAKULTETA.'
    );
  END IF;
END;
/

BEGIN
  EXECUTE IMMEDIATE q'[
    UPDATE KONKURSZAMASTERSTUDIJE k
    SET k.ID_FAKULTETA = (
      SELECT MAX(spg.ID_FAKULTETA)
      FROM KONKURSSTAVKA ks
      JOIN STUDIJSKIPROGRAMGLAVNO spg ON spg.ID_PROGRAMA = ks.ID_PROGRAMA
      WHERE ks.ID_KONKURSA = k.ID_KONKURSA
    )
    WHERE k.ID_FAKULTETA IS NULL
      AND EXISTS (
        SELECT 1
        FROM KONKURSSTAVKA ks
        JOIN STUDIJSKIPROGRAMGLAVNO spg ON spg.ID_PROGRAMA = ks.ID_PROGRAMA
        WHERE ks.ID_KONKURSA = k.ID_KONKURSA
      )
  ]';
END;
/

DECLARE
  constraint_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO constraint_count
  FROM user_constraints uc
  JOIN user_cons_columns ucc
    ON uc.constraint_name = ucc.constraint_name
   AND uc.table_name = ucc.table_name
  WHERE uc.table_name = 'KONKURSZAMASTERSTUDIJE'
    AND uc.constraint_type = 'R'
    AND ucc.column_name = 'ID_FAKULTETA'
    AND uc.r_constraint_name IN (
      SELECT constraint_name
      FROM user_constraints
      WHERE table_name = 'FAKULTET'
        AND constraint_type IN ('P', 'U')
    );

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE KONKURSZAMASTERSTUDIJE
      ADD CONSTRAINT FK_KONKURS_MASTER_FAKULTET
      FOREIGN KEY (ID_FAKULTETA)
      REFERENCES FAKULTET (ID_FAKULTETA)
    ]';
  END IF;
END;
/

DECLARE
  index_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO index_count
  FROM user_ind_columns
  WHERE table_name = 'KONKURSZAMASTERSTUDIJE'
    AND column_name = 'ID_FAKULTETA';

  IF index_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE INDEX IDX_KONKURS_MASTER_ID_FAKULTETA
      ON KONKURSZAMASTERSTUDIJE (ID_FAKULTETA)
    ]';
  END IF;
END;
/

COMMENT ON COLUMN KONKURSZAMASTERSTUDIJE.ID_FAKULTETA IS 'Fakultet za koji je konkurs kreiran';
