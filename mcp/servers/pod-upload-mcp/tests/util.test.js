import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseWorkHref, slugifyTitle, buildRbTags, tpTagsText, validateTitle } from '../dist/util.js';

test('parseWorkHref extracts id and slug', () => {
  const got = parseWorkHref('/portfolio/images/184876324-big-pink-bow-flat-vector-coquette-balletcore/edit');
  assert.deepEqual(got, { id: '184876324', slug: 'big-pink-bow-flat-vector-coquette-balletcore' });
  assert.equal(parseWorkHref('/x/y/z'), null);
  assert.equal(parseWorkHref(''), null);
});

test('slugifyTitle matches redbubble expectations', () => {
  assert.equal(slugifyTitle('Big Pink Bow Flat Vector - Coquette Balletcore'), 'big-pink-bow-flat-vector-coquette-balletcore');
  assert.equal(slugifyTitle('Twin Cherries, Flat Illustration & Cute Fruit Art'), 'twin-cherries-flat-illustration-and-cute-fruit-art');
});

test('buildRbTags dedupes, caps and warns', () => {
  const got = buildRbTags('Bow', ['coquette', 'BOW', '', 'pink bow', 'x'.repeat(51)]);
  assert.equal(got.main, 'bow');
  assert.deepEqual(got.supporting, ['coquette', 'pink bow']);
  assert.ok(got.warnings.some((w) => w.includes('too long')));
  assert.ok(got.warnings.some((w) => w.includes('dropped')));

  const many = buildRbTags('bow', Array.from({ length: 20 }, (_, i) => `tag${i}`));
  assert.equal(many.supporting.length, 14);
  assert.ok(many.warnings.some((w) => w.includes('trimmed to 14')));
});

test('tpTagsText joins and dedupes', () => {
  assert.equal(tpTagsText(['bow', ' Bow ', 'cute']), 'bow, cute');
  assert.equal(tpTagsText([]), '');
});

test('validateTitle flags weak titles', () => {
  assert.ok(validateTitle('bow').length > 0);
  assert.ok(validateTitle('Big Pink Bow Flat Vector', 4, 8).length === 0);
});
