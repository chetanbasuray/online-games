import assert from "node:assert/strict";
import test from "node:test";

const modulePromise = import("../app/data/lexiTwistDictionary.js");

await test("lexi twist dictionary exports expected structure", async () => {
  const dictionary = await modulePromise;
  assert.ok(Array.isArray(dictionary.english));
  assert.ok(Array.isArray(dictionary.words));
  assert.equal(dictionary.english, dictionary.languages.english);
  assert.equal(dictionary.english, dictionary.default.english);
  assert.equal(dictionary.words, dictionary.english);
  assert.equal(dictionary.languages, dictionary.default.languages);
  assert.equal(dictionary.default.words, dictionary.english);
  assert.ok(dictionary.english.every((entry) => typeof entry === "string"));
  assert.ok(dictionary.english.every((entry) => entry === entry.toUpperCase()));
  assert.ok(dictionary.english.includes("ACE"));
});
