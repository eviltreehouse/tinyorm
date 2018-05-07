--
-- A demo table
-- 
DROP TABLE IF EXISTS demo;

CREATE TABLE demo (
    id INTEGER NOT NULL PRIMARY KEY,
    tag VARCHAR(64) NOT NULL UNIQUE,
    pct_done FLOAT,
    inserted_dt BIGINT NOT NULL DEFAULT 0,
    completed_dt BIGINT
);

INSERT INTO DEMO (tag, pct_done, inserted_dt) VALUES("sel1", 18.8, 1525727167);
INSERT INTO DEMO (tag, pct_done, inserted_dt) VALUES("sel2", 99.1, 1525727167);
INSERT INTO DEMO (tag, pct_done, inserted_dt, completed_dt) VALUES("selz", 100.0, 1525727167, 1525727190);
INSERT INTO DEMO (tag, pct_done, inserted_dt) VALUES("del1", 100.0, 1);