import test from "node:test";
import assert from "node:assert/strict";

import { validateQueryPolicy } from "../src/tools/executeQuery.js";

test("read policy allows only SELECT and WITH queries", () => {
  assert.equal(validateQueryPolicy("SELECT * FROM users", "read").ok, true);
  assert.equal(validateQueryPolicy("WITH cte AS (SELECT 1) SELECT * FROM cte", "read").ok, true);
});

test("update policy allows UPDATE statements only", () => {
  const result = validateQueryPolicy("UPDATE users SET status = 'active' WHERE id = 1", "update");
  assert.equal(result.ok, true);
});

test("update policy rejects inserts and DDL", () => {
  assert.equal(validateQueryPolicy("INSERT INTO users (name) VALUES ('x')", "update").ok, false);
  assert.equal(validateQueryPolicy("CREATE TABLE audit_log (id INT)", "update").ok, false);
  assert.equal(validateQueryPolicy("ALTER TABLE users ADD COLUMN age INT", "update").ok, false);
});
