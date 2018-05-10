--
-- A demo table
-- 
DROP TABLE IF EXISTS demo;

CREATE TABLE demo (
    id INTEGER NOT NULL PRIMARY KEY,
    tag VARCHAR(64) NOT NULL UNIQUE,
    demo_class char(1) NOT NULL DEFAULT 'z',
    pct_done FLOAT,
    inserted_dt BIGINT NOT NULL DEFAULT 0,
    completed_dt BIGINT
);

INSERT INTO DEMO (tag, demo_class, pct_done, inserted_dt) VALUES("sel1", 'a', 18.8, 1525727167);
INSERT INTO DEMO (tag, demo_class, pct_done, inserted_dt) VALUES("sel2", 'b', 99.1, 1525727167);
INSERT INTO DEMO (tag, demo_class, pct_done, inserted_dt, completed_dt) VALUES("selz", 'a', 100.0, 1525727167, 1525727190);
INSERT INTO DEMO (tag, demo_class, pct_done, inserted_dt) VALUES("del1", 'b', 100.0, 1);