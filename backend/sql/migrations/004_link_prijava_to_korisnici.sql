DECLARE
  column_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO column_count
  FROM user_tab_columns
  WHERE table_name = 'PRIJAVA'
    AND column_name = 'ID_KORISNIKA';

  IF column_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE PRIJAVA ADD (
        ID_KORISNIKA NUMBER
      )
    ]';
  END IF;
END;
/

-- Backfill strategy #1: username equals JMBG.
UPDATE PRIJAVA p
SET p.ID_KORISNIKA = (
  SELECT MIN(k.ID_KORISNIKA)
  FROM KORISNICI k
  WHERE LOWER(k.KORISNICKO_IME) = LOWER(p.JMBG)
)
WHERE p.ID_KORISNIKA IS NULL
  AND p.JMBG IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM KORISNICI k
    WHERE LOWER(k.KORISNICKO_IME) = LOWER(p.JMBG)
  );

-- Backfill strategy #2: Candidate email equals Korisnici email.
UPDATE PRIJAVA p
SET p.ID_KORISNIKA = (
  SELECT MIN(k.ID_KORISNIKA)
  FROM KANDIDAT c
  JOIN KORISNICI k ON LOWER(k.EMAIL) = LOWER(c.EMAIL.GET_VREDNOST())
  WHERE c.JMBG = p.JMBG
)
WHERE p.ID_KORISNIKA IS NULL
  AND p.JMBG IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM KANDIDAT c
    JOIN KORISNICI k ON LOWER(k.EMAIL) = LOWER(c.EMAIL.GET_VREDNOST())
    WHERE c.JMBG = p.JMBG
  );

DECLARE
  constraint_count NUMBER := 0;
BEGIN
  SELECT COUNT(*)
  INTO constraint_count
  FROM user_constraints
  WHERE table_name = 'PRIJAVA'
    AND constraint_name = 'FK_PRIJAVA_KORISNIK';

  IF constraint_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      ALTER TABLE PRIJAVA
      ADD CONSTRAINT FK_PRIJAVA_KORISNIK
      FOREIGN KEY (ID_KORISNIKA)
      REFERENCES KORISNICI (ID_KORISNIKA)
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
    AND index_name = 'IDX_PRIJAVA_ID_KORISNIKA';

  IF index_count = 0 THEN
    EXECUTE IMMEDIATE q'[
      CREATE INDEX IDX_PRIJAVA_ID_KORISNIKA ON PRIJAVA (ID_KORISNIKA)
    ]';
  END IF;
END;
/

COMMENT ON COLUMN PRIJAVA.ID_KORISNIKA IS 'Vlasnik prijave iz tabele Korisnici';